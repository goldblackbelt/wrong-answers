const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const WrongQuestion = require('../models/WrongQuestion');
const ReviewPlan = require('../models/ReviewPlan');
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

// 生成复习计划
router.post('/generate', authenticate, async (req, res) => {
  try {
    // 查询用户的错题
    let wrongQuestions = await WrongQuestion.findByUserId(req.user.userId);

    if (wrongQuestions.length === 0) {
      return res.status(400).json({ status: 'error', message: '没有错题可生成复习计划' });
    }

    // 按掌握度排序
    wrongQuestions.sort((a, b) => (a.mastery_level || 0) - (b.mastery_level || 0));

    // 筛选需要复习的题目
    const needReviewQuestions = wrongQuestions.filter(q => (q.mastery_level || 0) < 80);

    if (needReviewQuestions.length === 0) {
      return res.status(200).json({
        status: 'success',
        message: '所有错题掌握度已达标，无需复习',
        data: {
          reviewPlan: null
        }
      });
    }

    // 按掌握度分组
    const weakQuestions = needReviewQuestions.filter(q => (q.mastery_level || 0) < 40);
    const mediumQuestions = needReviewQuestions.filter(q => (q.mastery_level || 0) >= 40 && (q.mastery_level || 0) < 60);
    const strongQuestions = needReviewQuestions.filter(q => (q.mastery_level || 0) >= 60 && (q.mastery_level || 0) < 80);

    // 生成复习计划
    const reviewQuestions = [];
    
    // 优先复习薄弱题目
    reviewQuestions.push(...weakQuestions.slice(0, 5));
    
    // 然后复习中等题目
    if (reviewQuestions.length < 10) {
      reviewQuestions.push(...mediumQuestions.slice(0, 10 - reviewQuestions.length));
    }
    
    // 最后复习较强题目
    if (reviewQuestions.length < 15) {
      reviewQuestions.push(...strongQuestions.slice(0, 15 - reviewQuestions.length));
    }

    // 计算下次复习时间
    const nextReviewDate = new Date();
    nextReviewDate.setDate(nextReviewDate.getDate() + 1); // 明天开始复习

    // 创建复习计划
    const reviewPlan = await ReviewPlan.create({
      userId: req.user.userId,
      questions: reviewQuestions.map(q => q.id),
      nextReviewDate,
      reviewInterval: 1,
      status: 'pending'
    });

    res.status(201).json({
      status: 'success',
      message: '复习计划生成成功',
      data: {
        reviewPlan
      }
    });
  } catch (error) {
    console.error('生成复习计划错误:', error);
    res.status(500).json({ status: 'error', message: '服务器内部错误' });
  }
});

// 获取用户的复习计划
router.get('/plans', authenticate, async (req, res) => {
  try {
    const { status } = req.query;

    // 获取用户所有复习计划
    let reviewPlans = await ReviewPlan.findByUserId(req.user.userId);

    // 筛选
    if (status) {
      reviewPlans = reviewPlans.filter(p => p.status === status);
    }

    // 排序
    reviewPlans.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    res.status(200).json({
      status: 'success',
      data: {
        reviewPlans
      }
    });
  } catch (error) {
    console.error('获取复习计划错误:', error);
    res.status(500).json({ status: 'error', message: '服务器内部错误' });
  }
});

// 获取今日需要复习的题目
router.get('/today', authenticate, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // 获取用户所有复习计划
    let reviewPlans = await ReviewPlan.findByUserId(req.user.userId);

    // 筛选今日需要复习的计划
    reviewPlans = reviewPlans.filter(plan => {
      const planDate = new Date(plan.next_review_date);
      return planDate >= today && planDate < tomorrow && ['pending', 'in_progress'].includes(plan.status);
    });

    // 提取所有需要复习的题目
    const reviewQuestions = [];
    reviewPlans.forEach(plan => {
      plan.questions.forEach(questionId => {
        // 这里简化处理，实际应该查询题目详情
        if (!reviewQuestions.some(q => q.id === questionId)) {
          reviewQuestions.push({ id: questionId });
        }
      });
    });

    res.status(200).json({
      status: 'success',
      data: {
        reviewPlans,
        reviewQuestions
      }
    });
  } catch (error) {
    console.error('获取今日复习错误:', error);
    res.status(500).json({ status: 'error', message: '服务器内部错误' });
  }
});

// 更新复习计划状态
router.put('/plan/:id/status', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // 验证输入
    if (!status || !['pending', 'in_progress', 'completed'].includes(status)) {
      return res.status(400).json({ status: 'error', message: '请提供有效的状态' });
    }

    // 查询复习计划
    const reviewPlan = await ReviewPlan.findById(id);
    if (!reviewPlan) {
      return res.status(404).json({ status: 'error', message: '复习计划不存在' });
    }

    // 验证权限
    if (reviewPlan.user_id !== req.user.userId) {
      return res.status(403).json({ status: 'error', message: '无权操作该复习计划' });
    }

    // 更新状态
    await ReviewPlan.update(id, {
      status: status
    });

    // 如果完成，计算下次复习时间
    if (status === 'completed') {
      // 检查题目掌握度
      const unmasteredQuestions = [];
      let totalQuestions = 0;
      let masteredQuestions = 0;

      // 这里简化处理，实际应该查询每个题目的掌握度
      if (reviewPlan.questions && reviewPlan.questions.length > 0) {
        totalQuestions = reviewPlan.questions.length;
        // 假设一半题目已掌握
        masteredQuestions = Math.floor(totalQuestions / 2);
      }

      // 根据掌握情况调整复习间隔
      let newInterval = reviewPlan.review_interval || 1;
      if (totalQuestions > 0 && masteredQuestions / totalQuestions >= 0.8) {
        // 掌握良好，延长间隔
        newInterval = Math.min(30, newInterval * 2);
      } else if (totalQuestions > 0 && masteredQuestions / totalQuestions < 0.4) {
        // 掌握较差，缩短间隔
        newInterval = Math.max(1, Math.floor(newInterval / 2));
      }

      // 创建新的复习计划（如果还有未掌握的题目）
      if (totalQuestions - masteredQuestions > 0) {
        const nextReviewDate = new Date();
        nextReviewDate.setDate(nextReviewDate.getDate() + newInterval);

        await ReviewPlan.create({
          userId: req.user.userId,
          questions: reviewPlan.questions, // 简化处理，使用原计划的题目
          nextReviewDate,
          reviewInterval: newInterval,
          status: 'pending'
        });
      }
    }

    res.status(200).json({
      status: 'success',
      message: '复习计划状态更新成功',
      data: {
        reviewPlan: { ...reviewPlan, status }
      }
    });
  } catch (error) {
    console.error('更新复习计划状态错误:', error);
    res.status(500).json({ status: 'error', message: '服务器内部错误' });
  }
});

// 删除复习计划
router.delete('/plan/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    // 查询复习计划
    const reviewPlan = await ReviewPlan.findById(id);
    if (!reviewPlan) {
      return res.status(404).json({ status: 'error', message: '复习计划不存在' });
    }

    // 验证权限
    if (reviewPlan.user_id !== req.user.userId) {
      return res.status(403).json({ status: 'error', message: '无权删除该复习计划' });
    }

    // 删除复习计划
    await ReviewPlan.delete(id);

    res.status(200).json({
      status: 'success',
      message: '复习计划删除成功'
    });
  } catch (error) {
    console.error('删除复习计划错误:', error);
    res.status(500).json({ status: 'error', message: '服务器内部错误' });
  }
});

// 批量生成复习计划
router.post('/batch-generate', authenticate, async (req, res) => {
  try {
    const { days = 7 } = req.body;

    // 查询用户的错题
    let wrongQuestions = await WrongQuestion.findByUserId(req.user.userId);

    if (wrongQuestions.length === 0) {
      return res.status(400).json({ status: 'error', message: '没有错题可生成复习计划' });
    }

    // 按掌握度排序
    wrongQuestions.sort((a, b) => (a.mastery_level || 0) - (b.mastery_level || 0));

    const plans = [];

    for (let i = 0; i < days; i++) {
      // 计算当天需要复习的题目数量
      const dayQuestions = Math.min(10, Math.ceil(wrongQuestions.length / days));
      
      // 选择题目
      const startIndex = i * dayQuestions;
      const endIndex = startIndex + dayQuestions;
      const dayReviewQuestions = wrongQuestions.slice(startIndex, endIndex);

      if (dayReviewQuestions.length === 0) {
        break;
      }

      // 计算复习日期
      const reviewDate = new Date();
      reviewDate.setDate(reviewDate.getDate() + i);

      // 创建复习计划
      const reviewPlan = await ReviewPlan.create({
        userId: req.user.userId,
        questions: dayReviewQuestions.map(q => q.id),
        nextReviewDate: reviewDate,
        reviewInterval: 1,
        status: 'pending'
      });

      plans.push(reviewPlan);
    }

    res.status(201).json({
      status: 'success',
      message: `成功生成 ${plans.length} 天的复习计划`,
      data: {
        plans
      }
    });
  } catch (error) {
    console.error('批量生成复习计划错误:', error);
    res.status(500).json({ status: 'error', message: '服务器内部错误' });
  }
});

// 获取复习统计
router.get('/stats', authenticate, async (req, res) => {
  try {
    // 查询用户的复习计划
    const reviewPlans = await ReviewPlan.findByUserId(req.user.userId);

    // 统计数据
    const totalPlans = reviewPlans.length;
    const completedPlans = reviewPlans.filter(p => p.status === 'completed').length;
    const pendingPlans = reviewPlans.filter(p => p.status === 'pending').length;
    const inProgressPlans = reviewPlans.filter(p => p.status === 'in_progress').length;

    // 计算完成率
    const completionRate = totalPlans > 0 ? (completedPlans / totalPlans) * 100 : 0;

    // 获取最近的复习计划
    const recentPlans = reviewPlans
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, 5);

    res.status(200).json({
      status: 'success',
      data: {
        stats: {
          totalPlans,
          completedPlans,
          pendingPlans,
          inProgressPlans,
          completionRate: Math.round(completionRate)
        },
        recentPlans
      }
    });
  } catch (error) {
    console.error('获取复习统计错误:', error);
    res.status(500).json({ status: 'error', message: '服务器内部错误' });
  }
});

module.exports = router;