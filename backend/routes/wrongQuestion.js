const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const WrongQuestion = require('../models/WrongQuestion');
const Question = require('../models/Question');
const authenticate = require('../middleware/auth');

// 配置文件上传
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../uploads');
    // 确保上传目录存在
    const fs = require('fs');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ storage: storage });

// 上传错题
router.post('/upload', authenticate, upload.single('questionImage'), async (req, res) => {
  try {
    const { questionContent, standardAnswer, userAnswer, errorReason, category, difficulty } = req.body;

    // 验证输入
    if (!questionContent || !standardAnswer) {
      return res.status(400).json({ status: 'error', message: '题目内容和标准答案为必填项' });
    }

    // 处理图片路径
    let questionImage = '';
    if (req.file) {
      questionImage = `/uploads/${req.file.filename}`;
    }

    // 创建错题
    const wrongQuestion = await WrongQuestion.create({
      userId: req.user.userId,
      questionContent,
      questionImage,
      standardAnswer,
      userAnswer,
      errorReason,
      category,
      difficulty: parseInt(difficulty) || 3,
      masteryLevel: 0
    });

    res.status(201).json({
      status: 'success',
      message: '错题上传成功',
      data: {
        wrongQuestion
      }
    });
  } catch (error) {
    console.error('上传错题错误:', error);
    res.status(500).json({ status: 'error', message: '服务器内部错误' });
  }
});

// 获取用户错题列表
router.get('/list', authenticate, async (req, res) => {
  try {
    const { page = 1, limit = 10, category, difficulty } = req.query;

    // 获取用户所有错题
    let wrongQuestions = await WrongQuestion.findByUserId(req.user.userId);

    // 筛选
    if (category) {
      wrongQuestions = wrongQuestions.filter(q => q.category === category);
    }
    
    if (difficulty) {
      const diffValue = parseInt(difficulty);
      wrongQuestions = wrongQuestions.filter(q => q.difficulty === diffValue);
    }

    // 排序（默认按上传日期倒序）
    wrongQuestions.sort((a, b) => new Date(b.upload_date) - new Date(a.upload_date));

    // 分页
    const total = wrongQuestions.length;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const paginatedQuestions = wrongQuestions.slice(skip, skip + parseInt(limit));

    res.status(200).json({
      status: 'success',
      data: {
        wrongQuestions: paginatedQuestions,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });
  } catch (error) {
    console.error('获取错题列表错误:', error);
    res.status(500).json({ status: 'error', message: '服务器内部错误' });
  }
});

// 获取错题详情
router.get('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    // 查询错题
    const wrongQuestion = await WrongQuestion.findById(id);

    if (!wrongQuestion) {
      return res.status(404).json({ status: 'error', message: '错题不存在' });
    }

    // 验证权限
    if (wrongQuestion.user_id !== req.user.userId) {
      return res.status(403).json({ status: 'error', message: '无权访问该错题' });
    }

    res.status(200).json({
      status: 'success',
      data: {
        wrongQuestion
      }
    });
  } catch (error) {
    console.error('获取错题详情错误:', error);
    res.status(500).json({ status: 'error', message: '服务器内部错误' });
  }
});

// 更新错题
router.put('/:id', authenticate, upload.single('questionImage'), async (req, res) => {
  try {
    const { id } = req.params;
    const { questionContent, standardAnswer, userAnswer, errorReason, category, difficulty, knowledgePoints, examPoints } = req.body;

    // 查询错题
    const wrongQuestion = await WrongQuestion.findById(id);
    if (!wrongQuestion) {
      return res.status(404).json({ status: 'error', message: '错题不存在' });
    }

    // 验证权限
    if (wrongQuestion.user_id !== req.user.userId) {
      return res.status(403).json({ status: 'error', message: '无权修改该错题' });
    }

    // 准备更新数据
    const updateData = {};
    
    if (questionContent) updateData.questionContent = questionContent;
    if (standardAnswer) updateData.standardAnswer = standardAnswer;
    if (userAnswer) updateData.userAnswer = userAnswer;
    if (errorReason) updateData.errorReason = errorReason;
    if (category) updateData.category = category;
    if (difficulty) updateData.difficulty = parseInt(difficulty);
    if (knowledgePoints) updateData.knowledgePoints = JSON.parse(knowledgePoints);
    if (examPoints) updateData.examPoints = JSON.parse(examPoints);

    // 处理图片更新
    if (req.file) {
      updateData.questionImage = `/uploads/${req.file.filename}`;
    }

    // 更新错题
    const updatedQuestion = await WrongQuestion.update(id, updateData);

    res.status(200).json({
      status: 'success',
      message: '错题更新成功',
      data: {
        wrongQuestion: updatedQuestion
      }
    });
  } catch (error) {
    console.error('更新错题错误:', error);
    res.status(500).json({ status: 'error', message: '服务器内部错误' });
  }
});

// 删除错题
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    // 查询错题
    const wrongQuestion = await WrongQuestion.findById(id);
    if (!wrongQuestion) {
      return res.status(404).json({ status: 'error', message: '错题不存在' });
    }

    // 验证权限
    if (wrongQuestion.user_id !== req.user.userId) {
      return res.status(403).json({ status: 'error', message: '无权删除该错题' });
    }

    // 删除错题
    await WrongQuestion.delete(id);

    res.status(200).json({
      status: 'success',
      message: '错题删除成功'
    });
  } catch (error) {
    console.error('删除错题错误:', error);
    res.status(500).json({ status: 'error', message: '服务器内部错误' });
  }
});

// 批量上传错题
router.post('/batch-upload', authenticate, async (req, res) => {
  try {
    const { questions } = req.body;

    if (!Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({ status: 'error', message: '请提供有效的错题列表' });
    }

    // 批量创建错题
    const createdQuestions = [];
    
    for (const questionData of questions) {
      const wrongQuestion = await WrongQuestion.create({
        userId: req.user.userId,
        questionContent: questionData.questionContent,
        standardAnswer: questionData.standardAnswer,
        userAnswer: questionData.userAnswer,
        errorReason: questionData.errorReason,
        category: questionData.category,
        difficulty: questionData.difficulty || 3,
        masteryLevel: 0
      });

      createdQuestions.push(wrongQuestion);
    }

    res.status(201).json({
      status: 'success',
      message: `成功上传 ${createdQuestions.length} 道错题`,
      data: {
        wrongQuestions: createdQuestions
      }
    });
  } catch (error) {
    console.error('批量上传错题错误:', error);
    res.status(500).json({ status: 'error', message: '服务器内部错误' });
  }
});

module.exports = router;