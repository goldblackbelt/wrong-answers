const express = require('express');
const router = express.Router();
const User = require('../models/User');
const jwt = require('jsonwebtoken');

// 注册路由
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // 验证输入
    if (!username || !email || !password) {
      return res.status(400).json({ status: 'error', message: '请填写所有必填字段' });
    }

    if (password.length < 6) {
      return res.status(400).json({ status: 'error', message: '密码长度至少为6位' });
    }

    // 检查邮箱是否已存在
    const existingUserByEmail = await User.findByEmail(email);
    if (existingUserByEmail) {
      return res.status(400).json({ status: 'error', message: '邮箱已存在' });
    }

    // 创建新用户
    const user = await User.create({
      username,
      email,
      password
    });

    // 生成JWT令牌
    const token = jwt.sign(
      { userId: user.id, username: user.username },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.status(201).json({
      status: 'success',
      message: '注册成功',
      data: {
        user: {
          id: user.id,
          username: user.username,
          email: user.email
        },
        token
      }
    });
  } catch (error) {
    console.error('注册错误:', error);
    res.status(500).json({ status: 'error', message: '服务器内部错误' });
  }
});

// 登录路由
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // 验证输入
    if (!email || !password) {
      return res.status(400).json({ status: 'error', message: '请填写所有必填字段' });
    }

    // 查找用户
    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(401).json({ status: 'error', message: '邮箱或密码错误' });
    }

    // 验证密码
    const isPasswordValid = await User.comparePassword(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ status: 'error', message: '邮箱或密码错误' });
    }

    // 生成JWT令牌
    const token = jwt.sign(
      { userId: user.id, username: user.username },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.status(200).json({
      status: 'success',
      message: '登录成功',
      data: {
        user: {
          id: user.id,
          username: user.username,
          email: user.email
        },
        token
      }
    });
  } catch (error) {
    console.error('登录错误:', error);
    res.status(500).json({ status: 'error', message: '服务器内部错误' });
  }
});

// 获取当前用户信息
router.get('/me', async (req, res) => {
  try {
    // 从请求头获取令牌
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ status: 'error', message: '未提供认证令牌' });
    }

    // 验证令牌
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    
    // 查找用户
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(401).json({ status: 'error', message: '用户不存在' });
    }

    // 移除密码字段
    const userData = {
      id: user.id,
      username: user.username,
      email: user.email,
      created_at: user.created_at,
      updated_at: user.updated_at
    };

    res.status(200).json({
      status: 'success',
      data: {
        user: userData
      }
    });
  } catch (error) {
    console.error('获取用户信息错误:', error);
    res.status(401).json({ status: 'error', message: '认证失败' });
  }
});

// 更新用户信息
router.put('/update', async (req, res) => {
  try {
    // 从请求头获取令牌
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ status: 'error', message: '未提供认证令牌' });
    }

    // 验证令牌
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    
    // 查找用户
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(401).json({ status: 'error', message: '用户不存在' });
    }

    // 更新用户信息
    const { username, email } = req.body;
    const updatedUser = await User.update(decoded.userId, { username, email });

    // 移除密码字段
    const userData = {
      id: updatedUser.id,
      username: updatedUser.username,
      email: updatedUser.email,
      created_at: updatedUser.created_at,
      updated_at: updatedUser.updated_at
    };

    res.status(200).json({
      status: 'success',
      data: {
        user: userData
      }
    });
  } catch (error) {
    console.error('更新用户信息错误:', error);
    res.status(500).json({ status: 'error', message: '服务器内部错误' });
  }
});

module.exports = router;