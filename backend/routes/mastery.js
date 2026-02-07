const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const WrongQuestion = require('../models/WrongQuestion');
const MasteryRecord = require('../models/MasteryRecord');

// 认证中间件
const authenticate = (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ status: 'error', message: '未提供认证令牌' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ status: 'error', message: '认证失败' });
  }
};

// 更新掌握度
router.post('/update', authenticate, async (req, res) => {
  try {
    const { questionId, isCorrect, userAnswer } = req.body;

    // 验证输入
    if (!questionId || isCorrect === undefined) {
      return res.status(400).json({ status: 'error', message: '题目ID和答题结果为必填项' });
    }

    // 查询错题
    const wrongQuestion = await WrongQuestion.findById(questionId);
    if (!wrongQuestion) {
      return res.status(404).json({ status: 'error', message: '错题不存在' });
    }

    // 验证权限
    if (wrongQuestion.user_id !== req.user.userId) {
      return res.status(403).json({ status: 'error', message: '无权操作该错题' });
    }

    // 查找或创建掌握度记录
    let masteryRecord = await MasteryRecord.findByUserAndQuestion(req.user.userId, questionId);
    let attemptCount = 0;
    let correctCount = 0;
    let history = [];

    if (masteryRecord) {
      attemptCount = masteryRecord.attempt_count || 0;
      correctCount = masteryRecord.correct_count || 0;
      history = masteryRecord.history || [];
    }

    // 更新尝试次数和正确次数
    attemptCount++;
    if (isCorrect) {
      correctCount++;
    }

    // 计算掌握度（基于正确率和尝试次数）
    const correctRate = correctCount / attemptCount;
    let newMasteryLevel = 0;

    // 掌握度计算算法
    if (correctRate === 1) {
      // 全部正确
      if (attemptCount >= 3) {
        newMasteryLevel = 100;
      } else if (attemptCount === 2) {
        newMasteryLevel = 90;
      } else {
        newMasteryLevel = 80;
      }
    } else if (correctRate >= 0.7) {
      // 大部分正确
      newMasteryLevel = 60 + (correctRate - 0.7) * 40 / 0.3;
    } else if (correctRate >= 0.4) {
      // 部分正确
      newMasteryLevel = 30 + (correctRate - 0.4) * 30 / 0.3;
    } else {
      // 很少正确
      newMasteryLevel = correctRate * 30 / 0.4;
    }

    // 限制掌握度范围
    newMasteryLevel = Math.min(100, Math.max(0, Math.round(newMasteryLevel)));

    // 添加历史记录
    history.push({
      date: new Date(),
      level: newMasteryLevel
    });

    // 保存掌握度记录
    masteryRecord = await MasteryRecord.upsert(req.user.userId, questionId, {
      masteryLevel: newMasteryLevel,
      attemptCount: attemptCount,
      correctCount: correctCount,
      lastAttemptDate: new Date(),
      history: history
    });

    // 更新错题的掌握度
    await WrongQuestion.update(questionId, {
      masteryLevel: newMasteryLevel,
      lastReviewDate: new Date(),
      reviewCount: (wrongQuestion.review_count || 0) + 1
    });

    // 计算复习间隔（基于艾宾浩斯遗忘曲线）
    let reviewInterval = 1; // 默认1天
    if (newMasteryLevel >= 80) {
      reviewInterval = 7; // 7天
    } else if (newMasteryLevel >= 60) {
      reviewInterval = 3; // 3天
    } else if (newMasteryLevel >= 40) {
      reviewInterval = 2; // 2天
    }

    res.status(200).json({
      status: 'success',
      message: '掌握度更新成功',
      data: {
        masteryRecord,
        wrongQuestion,
        reviewInterval
      }
    });
  } catch (error) {
    console.error('更新掌握度错误:', error);
    res.status(500).json({ status: 'error', message: '服务器内部错误' });
  }
});

// 获取掌握度记录
router.get('/record/:questionId', authenticate, async (req, res) => {
  try {
    const { questionId } = req.params;

    // 查询掌握度记录
    const masteryRecord = await MasteryRecord.findByUserAndQuestion(req.user.userId, questionId);
    if (!masteryRecord) {
      return res.status(404).json({ status: 'error', message: '掌握度记录不存在' });
    }

    res.status(200).json({
      status: 'success',
      data: {
        masteryRecord
      }
    });
  } catch (error) {
    console.error('获取掌握度记录错误:', error);
    res.status(500).json({ status: 'error', message: '服务器内部错误' });
  }
});

// 获取用户所有掌握度记录
router.get('/records', authenticate, async (req, res) => {
  try {
    const { page = 1, limit = 20, minLevel, maxLevel } = req.query;

    // 获取用户所有掌握度记录
    let masteryRecords = await MasteryRecord.findByUserId(req.user.userId);

    // 筛选
    if (minLevel !== undefined) {
      const minValue = parseInt(minLevel);
      masteryRecords = masteryRecords.filter(r => (r.mastery_level || 0) >= minValue);
    }
    
    if (maxLevel !== undefined) {
      const maxValue = parseInt(maxLevel);
      masteryRecords = masteryRecords.filter(r => (r.mastery_level || 0) <= maxValue);
    }

    // 排序
    masteryRecords.sort((a, b) => (a.mastery_level || 0) - (b.mastery_level || 0));

    // 分页
    const total = masteryRecords.length;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const paginatedRecords = masteryRecords.slice(skip, skip + parseInt(limit));

    res.status(200).json({
      status: 'success',
      data: {
        masteryRecords: paginatedRecords,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });
  } catch (error) {
    console.error('获取掌握度记录列表错误:', error);
    res.status(500).json({ status: 'error', message: '服务器内部错误' });
  }
});

// 批量更新掌握度
router.post('/batch-update', authenticate, async (req, res) => {
  try {
    const { updates } = req.body;

    if (!Array.isArray(updates) || updates.length === 0) {
      return res.status(400).json({ status: 'error', message: '请提供有效的更新列表' });
    }

    const results = [];

    for (const update of updates) {
      const { questionId, isCorrect } = update;

      if (!questionId || isCorrect === undefined) {
        continue;
      }

      // 查询错题
      const wrongQuestion = await WrongQuestion.findById(questionId);
      if (!wrongQuestion || wrongQuestion.user_id !== req.user.userId) {
        continue;
      }

      // 查找或创建掌握度记录
      let masteryRecord = await MasteryRecord.findByUserAndQuestion(req.user.userId, questionId);
      let attemptCount = 0;
      let correctCount = 0;
      let history = [];

      if (masteryRecord) {
        attemptCount = masteryRecord.attempt_count || 0;
        correctCount = masteryRecord.correct_count || 0;
        history = masteryRecord.history || [];
      }

      // 更新尝试次数和正确次数
      attemptCount++;
      if (isCorrect) {
        correctCount++;
      }

      // 计算掌握度
      const correctRate = correctCount / attemptCount;
      let newMasteryLevel = 0;

      if (correctRate === 1) {
        if (attemptCount >= 3) {
          newMasteryLevel = 100;
        } else if (attemptCount === 2) {
          newMasteryLevel = 90;
        } else {
          newMasteryLevel = 80;
        }
      } else if (correctRate >= 0.7) {
        newMasteryLevel = 60 + (correctRate - 0.7) * 40 / 0.3;
      } else if (correctRate >= 0.4) {
        newMasteryLevel = 30 + (correctRate - 0.4) * 30 / 0.3;
      } else {
        newMasteryLevel = correctRate * 30 / 0.4;
      }

      newMasteryLevel = Math.min(100, Math.max(0, Math.round(newMasteryLevel)));

      // 更新历史记录
      history.push({
        date: new Date(),
        level: newMasteryLevel
      });

      // 保存掌握度记录
      await MasteryRecord.upsert(req.user.userId, questionId, {
        masteryLevel: newMasteryLevel,
        attemptCount: attemptCount,
        correctCount: correctCount,
        lastAttemptDate: new Date(),
        history: history
      });

      // 更新错题的掌握度
      await WrongQuestion.update(questionId, {
        masteryLevel: newMasteryLevel,
        lastReviewDate: new Date(),
        reviewCount: (wrongQuestion.review_count || 0) + 1
      });

      results.push({
        questionId,
        masteryLevel: newMasteryLevel
      });
    }

    res.status(200).json({
      status: 'success',
      message: `成功更新 ${results.length} 条掌握度记录`,
      data: {
        results
      }
    });
  } catch (error) {
    console.error('批量更新掌握度错误:', error);
    res.status(500).json({ status: 'error', message: '服务器内部错误' });
  }
});

// 获取掌握度统计
router.get('/stats', authenticate, async (req, res) => {
  try {
    // 查询用户所有掌握度记录
    const masteryRecords = await MasteryRecord.findByUserId(req.user.userId);

    // 统计数据
    const totalRecords = masteryRecords.length;
    const masteredRecords = masteryRecords.filter(r => (r.mastery_level || 0) >= 80).length;
    const inProgressRecords = masteryRecords.filter(r => (r.mastery_level || 0) >= 40 && (r.mastery_level || 0) < 80).length;
    const weakRecords = masteryRecords.filter(r => (r.mastery_level || 0) < 40).length;

    // 计算平均掌握度
    const totalMastery = masteryRecords.reduce((sum, r) => sum + (r.mastery_level || 0), 0);
    const averageMastery = totalRecords > 0 ? totalMastery / totalRecords : 0;

    // 计算总体正确率
    const totalAttempts = masteryRecords.reduce((sum, r) => sum + (r.attempt_count || 0), 0);
    const totalCorrect = masteryRecords.reduce((sum, r) => sum + (r.correct_count || 0), 0);
    const overallCorrectRate = totalAttempts > 0 ? totalCorrect / totalAttempts : 0;

    // 掌握度分布
    const masteryDistribution = {
      '0-20': 0,
      '21-40': 0,
      '41-60': 0,
      '61-80': 0,
      '81-100': 0
    };

    masteryRecords.forEach(record => {
      const level = record.mastery_level || 0;
      if (level <= 20) {
        masteryDistribution['0-20']++;
      } else if (level <= 40) {
        masteryDistribution['21-40']++;
      } else if (level <= 60) {
        masteryDistribution['41-60']++;
      } else if (level <= 80) {
        masteryDistribution['61-80']++;
      } else {
        masteryDistribution['81-100']++;
      }
    });

    res.status(200).json({
      status: 'success',
      data: {
        stats: {
          totalRecords,
          masteredRecords,
          inProgressRecords,
          weakRecords,
          averageMastery: Math.round(averageMastery),
          overallCorrectRate: Math.round(overallCorrectRate * 100) / 100
        },
        masteryDistribution
      }
    });
  } catch (error) {
    console.error('获取掌握度统计错误:', error);
    res.status(500).json({ status: 'error', message: '服务器内部错误' });
  }
});

module.exports = router;