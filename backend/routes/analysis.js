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

// 错题分类统计
router.get('/category-stats', authenticate, async (req, res) => {
  try {
    // 查询用户所有错题
    const wrongQuestions = await WrongQuestion.findByUserId(req.user.userId);

    // 统计分类
    const categoryStats = {};
    
    wrongQuestions.forEach(question => {
      const category = question.category || '未分类';
      if (!categoryStats[category]) {
        categoryStats[category] = {
          count: 0,
          totalDifficulty: 0,
          averageMastery: 0,
          questions: []
        };
      }
      categoryStats[category].count++;
      categoryStats[category].totalDifficulty += question.difficulty || 0;
      categoryStats[category].averageMastery += question.mastery_level || 0;
      categoryStats[category].questions.push(question);
    });

    // 计算平均值
    Object.keys(categoryStats).forEach(category => {
      const stats = categoryStats[category];
      stats.averageDifficulty = stats.totalDifficulty / stats.count;
      stats.averageMastery = stats.averageMastery / stats.count;
      // 移除具体题目信息，只保留统计数据
      delete stats.questions;
    });

    res.status(200).json({
      status: 'success',
      data: {
        categoryStats
      }
    });
  } catch (error) {
    console.error('获取分类统计错误:', error);
    res.status(500).json({ status: 'error', message: '服务器内部错误' });
  }
});

// 考点分析
router.get('/exam-points-analysis', authenticate, async (req, res) => {
  try {
    // 查询用户所有错题
    const wrongQuestions = await WrongQuestion.findByUserId(req.user.userId);

    // 统计考点
    const examPointsStats = {};
    
    wrongQuestions.forEach(question => {
      if (question.exam_points && Array.isArray(question.exam_points)) {
        question.exam_points.forEach(examPoint => {
          const point = examPoint.point;
          if (!examPointsStats[point]) {
            examPointsStats[point] = {
              count: 0,
              totalImportance: 0,
              averageMastery: 0,
              questions: []
            };
          }
          examPointsStats[point].count++;
          examPointsStats[point].totalImportance += examPoint.importance || 0;
          examPointsStats[point].averageMastery += question.mastery_level || 0;
          examPointsStats[point].questions.push(question.id);
        });
      }
    });

    // 计算平均值
    Object.keys(examPointsStats).forEach(point => {
      const stats = examPointsStats[point];
      stats.averageImportance = stats.totalImportance / stats.count;
      stats.averageMastery = stats.averageMastery / stats.count;
    });

    // 按重要程度排序
    const sortedPoints = Object.entries(examPointsStats)
      .sort((a, b) => b[1].averageImportance - a[1].averageImportance)
      .map(([point, stats]) => ({
        point,
        ...stats
      }));

    res.status(200).json({
      status: 'success',
      data: {
        examPointsStats: sortedPoints
      }
    });
  } catch (error) {
    console.error('获取考点分析错误:', error);
    res.status(500).json({ status: 'error', message: '服务器内部错误' });
  }
});

// 薄弱环节分析
router.get('/weakness-analysis', authenticate, async (req, res) => {
  try {
    // 查询用户所有错题
    let wrongQuestions = await WrongQuestion.findByUserId(req.user.userId);

    // 按掌握度排序
    wrongQuestions.sort((a, b) => (a.mastery_level || 0) - (b.mastery_level || 0));

    // 取前20个
    wrongQuestions = wrongQuestions.slice(0, 20);

    // 分析知识点掌握情况
    const knowledgePointsStats = {};
    
    wrongQuestions.forEach(question => {
      if (question.knowledge_points && Array.isArray(question.knowledge_points)) {
        question.knowledge_points.forEach(point => {
          if (!knowledgePointsStats[point]) {
            knowledgePointsStats[point] = {
              count: 0,
              totalMastery: 0,
              questions: []
            };
          }
          knowledgePointsStats[point].count++;
          knowledgePointsStats[point].totalMastery += question.mastery_level || 0;
          knowledgePointsStats[point].questions.push(question.id);
        });
      }
    });

    // 计算平均掌握度
    Object.keys(knowledgePointsStats).forEach(point => {
      const stats = knowledgePointsStats[point];
      stats.averageMastery = stats.totalMastery / stats.count;
    });

    // 按掌握度排序（从低到高）
    const weakPoints = Object.entries(knowledgePointsStats)
      .sort((a, b) => a[1].averageMastery - b[1].averageMastery)
      .map(([point, stats]) => ({
        point,
        ...stats
      }))
      .slice(0, 10); // 取前10个薄弱知识点

    res.status(200).json({
      status: 'success',
      data: {
        weakPoints,
        weakQuestions: wrongQuestions
      }
    });
  } catch (error) {
    console.error('获取薄弱环节分析错误:', error);
    res.status(500).json({ status: 'error', message: '服务器内部错误' });
  }
});

// 中考考点重要程度评估
router.get('/exam-importance-assessment', authenticate, async (req, res) => {
  try {
    // 模拟中考考点重要程度数据
    const examImportanceData = {
      '数学': {
        '代数运算': 5,
        '几何证明': 4,
        '函数应用': 5,
        '概率统计': 3,
        '三角函数': 4,
        '方程求解': 5,
        '不等式': 3,
        '立体几何': 4
      },
      '语文': {
        '古诗文阅读': 5,
        '现代文阅读': 5,
        '作文': 5,
        '基础知识': 3,
        '语言运用': 4
      },
      '英语': {
        '听力': 4,
        '阅读理解': 5,
        '完形填空': 4,
        '语法': 3,
        '作文': 4,
        '词汇': 4
      },
      '物理': {
        '力学': 5,
        '电学': 5,
        '热学': 3,
        '光学': 3,
        '声学': 2,
        '电磁学': 4
      },
      '化学': {
        '化学方程式': 5,
        '元素周期表': 4,
        '酸碱盐': 5,
        '化学实验': 4,
        '有机化学': 3
      },
      '生物': {
        '细胞结构': 4,
        '遗传规律': 5,
        '生态系统': 3,
        '人体生理': 4,
        '生物技术': 3
      }
    };

    // 查询用户错题的考点分布
    const wrongQuestions = await WrongQuestion.findByUserId(req.user.userId);
    
    // 分析用户错题的中考重要程度
    const userExamImportance = {};
    
    wrongQuestions.forEach(question => {
      if (question.exam_points && Array.isArray(question.exam_points)) {
        question.exam_points.forEach(examPoint => {
          const point = examPoint.point;
          // 简单匹配考点所属学科
          let subject = '其他';
          Object.keys(examImportanceData).forEach(s => {
            if (point.includes(s)) {
              subject = s;
            }
          });

          if (!userExamImportance[subject]) {
            userExamImportance[subject] = {
              totalQuestions: 0,
              highImportanceQuestions: 0,
              mediumImportanceQuestions: 0,
              lowImportanceQuestions: 0,
              points: {}
            };
          }

          userExamImportance[subject].totalQuestions++;
          
          // 根据中考重要程度分级
          let importanceLevel = 3; // 默认中等
          Object.keys(examImportanceData[subject] || {}).forEach(key => {
            if (point.includes(key)) {
              importanceLevel = examImportanceData[subject][key];
            }
          });

          if (importanceLevel >= 4) {
            userExamImportance[subject].highImportanceQuestions++;
          } else if (importanceLevel === 3) {
            userExamImportance[subject].mediumImportanceQuestions++;
          } else {
            userExamImportance[subject].lowImportanceQuestions++;
          }

          if (!userExamImportance[subject].points[point]) {
            userExamImportance[subject].points[point] = {
              count: 0,
              importance: importanceLevel
            };
          }
          userExamImportance[subject].points[point].count++;
        });
      }
    });

    res.status(200).json({
      status: 'success',
      data: {
        userExamImportance,
        examImportanceData
      }
    });
  } catch (error) {
    console.error('中考考点重要程度评估错误:', error);
    res.status(500).json({ status: 'error', message: '服务器内部错误' });
  }
});

// 学习进度分析
router.get('/progress-analysis', authenticate, async (req, res) => {
  try {
    // 查询用户所有错题
    const wrongQuestions = await WrongQuestion.findByUserId(req.user.userId);
    
    // 查询用户掌握度记录
    const masteryRecords = await MasteryRecord.findByUserId(req.user.userId);

    // 计算总体掌握情况
    const totalQuestions = wrongQuestions.length;
    const masteredQuestions = wrongQuestions.filter(q => (q.mastery_level || 0) >= 80).length;
    const inProgressQuestions = wrongQuestions.filter(q => (q.mastery_level || 0) >= 40 && (q.mastery_level || 0) < 80).length;
    const weakQuestions = wrongQuestions.filter(q => (q.mastery_level || 0) < 40).length;

    // 计算平均掌握度
    const totalMastery = wrongQuestions.reduce((sum, q) => sum + (q.mastery_level || 0), 0);
    const averageMastery = totalQuestions > 0 ? totalMastery / totalQuestions : 0;

    // 分析时间趋势（最近30天）
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentRecords = masteryRecords.filter(r => r.last_attempt_date && new Date(r.last_attempt_date) >= thirtyDaysAgo);

    // 按日期分组
    const dailyProgress = {};
    recentRecords.forEach(record => {
      const date = new Date(record.last_attempt_date).toISOString().split('T')[0];
      if (!dailyProgress[date]) {
        dailyProgress[date] = {
          attempts: 0,
          correct: 0,
          averageMastery: 0
        };
      }
      dailyProgress[date].attempts++;
      dailyProgress[date].correct += record.correct_count || 0;
      dailyProgress[date].averageMastery += record.mastery_level || 0;
    });

    // 计算每日平均值
    Object.keys(dailyProgress).forEach(date => {
      const progress = dailyProgress[date];
      progress.averageMastery = progress.averageMastery / progress.attempts;
      progress.correctRate = progress.correct / progress.attempts;
    });

    res.status(200).json({
      status: 'success',
      data: {
        overallProgress: {
          totalQuestions,
          masteredQuestions,
          inProgressQuestions,
          weakQuestions,
          averageMastery
        },
        dailyProgress
      }
    });
  } catch (error) {
    console.error('获取学习进度分析错误:', error);
    res.status(500).json({ status: 'error', message: '服务器内部错误' });
  }
});

// 智能分析报告
router.get('/smart-analysis', authenticate, async (req, res) => {
  try {
    // 查询用户所有错题
    const wrongQuestions = await WrongQuestion.findByUserId(req.user.userId);
    
    // 计算总体数据
    const totalQuestions = wrongQuestions.length;
    const totalMastery = wrongQuestions.reduce((sum, q) => sum + (q.mastery_level || 0), 0);
    const averageMastery = totalQuestions > 0 ? totalMastery / totalQuestions : 0;
    const masteredCount = wrongQuestions.filter(q => (q.mastery_level || 0) >= 80).length;
    const weakCount = wrongQuestions.filter(q => (q.mastery_level || 0) < 40).length;

    // 分类统计
    const categoryStats = {};
    wrongQuestions.forEach(question => {
      const category = question.category || '未分类';
      if (!categoryStats[category]) {
        categoryStats[category] = {
          _id: category,
          count: 0,
          averageMastery: 0,
          averageDifficulty: 0
        };
      }
      categoryStats[category].count++;
      categoryStats[category].averageMastery += (question.mastery_level || 0);
      categoryStats[category].averageDifficulty += (question.difficulty || 0);
    });

    // 计算分类平均值
    const categoryStatsArray = Object.values(categoryStats).map(stats => ({
      ...stats,
      averageMastery: stats.averageMastery / stats.count,
      averageDifficulty: stats.averageDifficulty / stats.count
    }));

    // 考点分析
    const examPointsStats = {};
    wrongQuestions.forEach(question => {
      if (question.exam_points && Array.isArray(question.exam_points)) {
        question.exam_points.forEach(examPoint => {
          const point = examPoint.point;
          if (!examPointsStats[point]) {
            examPointsStats[point] = {
              _id: point,
              count: 0,
              totalImportance: 0,
              totalMastery: 0
            };
          }
          examPointsStats[point].count++;
          examPointsStats[point].totalImportance += (examPoint.importance || 0);
          examPointsStats[point].totalMastery += (question.mastery_level || 0);
        });
      }
    });

    // 计算考点平均值并排序
    const examPointsAnalysis = Object.values(examPointsStats)
      .map(stats => ({
        ...stats,
        averageImportance: stats.totalImportance / stats.count,
        averageMastery: stats.totalMastery / stats.count
      }))
      .sort((a, b) => b.averageImportance - a.averageImportance);

    // 薄弱环节
    const weaknessAnalysis = [...wrongQuestions]
      .sort((a, b) => (a.mastery_level || 0) - (b.mastery_level || 0))
      .slice(0, 10);

    // 生成智能分析报告
    const analysisReport = {
      summary: {
        totalQuestions,
        averageMastery,
        masteryRate: totalQuestions ? (masteredCount / totalQuestions) * 100 : 0,
        weakRate: totalQuestions ? (weakCount / totalQuestions) * 100 : 0
      },
      categoryDistribution: categoryStatsArray,
      keyExamPoints: examPointsAnalysis.slice(0, 5),
      weakQuestions: weaknessAnalysis,
      recommendations: [
        `重点关注掌握度低于40%的${weakCount}道题目`,
        `优先复习重要程度较高的考点: ${examPointsAnalysis.slice(0, 3).map(p => p._id).join(', ')}`,
        `加强练习${categoryStatsArray.sort((a, b) => a.averageMastery - b.averageMastery)[0]?._id || '未分类'}类别的题目`,
        `建议每天复习5-10道错题，保持学习连续性`
      ]
    };

    res.status(200).json({
      status: 'success',
      data: {
        analysisReport
      }
    });
  } catch (error) {
    console.error('获取智能分析报告错误:', error);
    res.status(500).json({ status: 'error', message: '服务器内部错误' });
  }
});

module.exports = router;