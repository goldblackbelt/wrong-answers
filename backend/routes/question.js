const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Question = require('../models/Question');
const WrongQuestion = require('../models/WrongQuestion');

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

// 生成类似题目
router.post('/generate-similar', authenticate, async (req, res) => {
  try {
    const { wrongQuestionId, count = 3 } = req.body;

    // 验证输入
    if (!wrongQuestionId) {
      return res.status(400).json({ status: 'error', message: '错题ID为必填项' });
    }

    // 查询错题
    const wrongQuestion = await WrongQuestion.findById(wrongQuestionId);
    if (!wrongQuestion) {
      return res.status(404).json({ status: 'error', message: '错题不存在' });
    }

    // 验证权限
    if (wrongQuestion.user_id !== req.user.userId) {
      return res.status(403).json({ status: 'error', message: '无权操作该错题' });
    }

    // 基于错题生成类似题目
    const similarQuestions = [];

    // 模拟生成类似题目（实际项目中可集成AI API）
    for (let i = 0; i < count; i++) {
      const similarQuestion = await Question.create({
        content: `类似题目 ${i + 1}: ${wrongQuestion.question_content.replace(/[？?]$/, '')}（变式${i + 1}）`,
        answer: `类似题目 ${i + 1} 的答案：${wrongQuestion.standard_answer}`,
        explanation: `本题是基于原错题的变式练习，考察相同的知识点：${wrongQuestion.knowledge_points?.join('、') || ''}`,
        knowledgePoints: wrongQuestion.knowledge_points || [],
        examPoints: wrongQuestion.exam_points?.map(ep => ep.point) || [],
        difficulty: wrongQuestion.difficulty,
        type: 'similar'
      });

      similarQuestions.push(similarQuestion);
    }

    // 更新错题的类似题目关联
    await WrongQuestion.update(wrongQuestionId, {
      similarQuestions: similarQuestions.map(q => q.id)
    });

    res.status(201).json({
      status: 'success',
      message: `成功生成 ${similarQuestions.length} 道类似题目`,
      data: {
        similarQuestions
      }
    });
  } catch (error) {
    console.error('生成类似题目错误:', error);
    res.status(500).json({ status: 'error', message: '服务器内部错误' });
  }
});

// 获取类似题目
router.get('/similar/:wrongQuestionId', authenticate, async (req, res) => {
  try {
    const { wrongQuestionId } = req.params;

    // 查询错题
    const wrongQuestion = await WrongQuestion.findById(wrongQuestionId);
    if (!wrongQuestion) {
      return res.status(404).json({ status: 'error', message: '错题不存在' });
    }

    // 验证权限
    if (wrongQuestion.user_id !== req.user.userId) {
      return res.status(403).json({ status: 'error', message: '无权访问该错题' });
    }

    // 获取类似题目（这里简化处理，实际应该根据ID列表查询）
    const similarQuestions = [];
    if (wrongQuestion.similar_questions && wrongQuestion.similar_questions.length > 0) {
      for (const questionId of wrongQuestion.similar_questions) {
        const question = await Question.findById(questionId);
        if (question) {
          similarQuestions.push(question);
        }
      }
    }

    res.status(200).json({
      status: 'success',
      data: {
        similarQuestions
      }
    });
  } catch (error) {
    console.error('获取类似题目错误:', error);
    res.status(500).json({ status: 'error', message: '服务器内部错误' });
  }
});

// 获取题目详情
router.get('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    // 查询题目
    const question = await Question.findById(id);
    if (!question) {
      return res.status(404).json({ status: 'error', message: '题目不存在' });
    }

    res.status(200).json({
      status: 'success',
      data: {
        question
      }
    });
  } catch (error) {
    console.error('获取题目详情错误:', error);
    res.status(500).json({ status: 'error', message: '服务器内部错误' });
  }
});

// 批量生成类似题目
router.post('/batch-generate-similar', authenticate, async (req, res) => {
  try {
    const { wrongQuestionIds, count = 2 } = req.body;

    if (!Array.isArray(wrongQuestionIds) || wrongQuestionIds.length === 0) {
      return res.status(400).json({ status: 'error', message: '请提供有效的错题ID列表' });
    }

    const results = [];

    for (const wrongQuestionId of wrongQuestionIds) {
      // 查询错题
      const wrongQuestion = await WrongQuestion.findById(wrongQuestionId);
      if (!wrongQuestion || wrongQuestion.user_id !== req.user.userId) {
        continue;
      }

      // 生成类似题目
      const similarQuestions = [];

      for (let i = 0; i < count; i++) {
        const similarQuestion = await Question.create({
          content: `类似题目 ${i + 1}: ${wrongQuestion.question_content.replace(/[？?]$/, '')}（变式${i + 1}）`,
          answer: `类似题目 ${i + 1} 的答案：${wrongQuestion.standard_answer}`,
          explanation: `本题是基于原错题的变式练习，考察相同的知识点：${wrongQuestion.knowledge_points?.join('、') || ''}`,
          knowledgePoints: wrongQuestion.knowledge_points || [],
          examPoints: wrongQuestion.exam_points?.map(ep => ep.point) || [],
          difficulty: wrongQuestion.difficulty,
          type: 'similar'
        });

        similarQuestions.push(similarQuestion);
      }

      // 更新错题的类似题目关联
      await WrongQuestion.update(wrongQuestionId, {
        similarQuestions: similarQuestions.map(q => q.id)
      });

      results.push({
        wrongQuestionId,
        similarQuestions
      });
    }

    res.status(201).json({
      status: 'success',
      message: `成功为 ${results.length} 道错题生成类似题目`,
      data: {
        results
      }
    });
  } catch (error) {
    console.error('批量生成类似题目错误:', error);
    res.status(500).json({ status: 'error', message: '服务器内部错误' });
  }
});

// 验证答案
router.post('/verify-answer', authenticate, async (req, res) => {
  try {
    const { questionId, userAnswer } = req.body;

    // 验证输入
    if (!questionId || !userAnswer) {
      return res.status(400).json({ status: 'error', message: '题目ID和用户答案为必填项' });
    }

    // 查询题目
    const question = await Question.findById(questionId);
    if (!question) {
      return res.status(404).json({ status: 'error', message: '题目不存在' });
    }

    // 简单的答案验证（实际项目中可能需要更复杂的验证逻辑）
    const isCorrect = userAnswer.trim() === question.answer.trim();

    // 计算得分
    let score = 0;
    if (isCorrect) {
      score = 100;
    } else {
      // 部分正确的情况（这里简化处理）
      const userAnswerLower = userAnswer.toLowerCase();
      const correctAnswerLower = question.answer.toLowerCase();
      const similarity = calculateSimilarity(userAnswerLower, correctAnswerLower);
      score = Math.round(similarity * 100);
    }

    res.status(200).json({
      status: 'success',
      data: {
        isCorrect,
        score,
        correctAnswer: question.answer,
        explanation: question.explanation
      }
    });
  } catch (error) {
    console.error('验证答案错误:', error);
    res.status(500).json({ status: 'error', message: '服务器内部错误' });
  }
});

// 计算字符串相似度（简单的Levenshtein距离计算）
function calculateSimilarity(str1, str2) {
  const matrix = [];
  
  // 初始化矩阵
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }
  
  // 计算编辑距离
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // 替换
          matrix[i][j - 1] + 1,     // 插入
          matrix[i - 1][j] + 1      // 删除
        );
      }
    }
  }
  
  // 计算相似度
  const maxLength = Math.max(str1.length, str2.length);
  const similarity = 1 - (matrix[str2.length][str1.length] / maxLength);
  
  return similarity;
}

// 获取题目列表
router.get('/list', authenticate, async (req, res) => {
  try {
    const { page = 1, limit = 20, type, difficulty } = req.query;

    // 这里简化处理，实际应该从数据库查询
    // 由于Question模型目前没有提供获取所有题目的方法，这里返回空列表
    const questions = [];
    const total = 0;

    res.status(200).json({
      status: 'success',
      data: {
        questions,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });
  } catch (error) {
    console.error('获取题目列表错误:', error);
    res.status(500).json({ status: 'error', message: '服务器内部错误' });
  }
});

// 删除题目
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    // 查询题目
    const question = await Question.findById(id);
    if (!question) {
      return res.status(404).json({ status: 'error', message: '题目不存在' });
    }

    // 删除题目
    await Question.delete(id);

    // 这里简化处理，实际应该更新所有关联的错题

    res.status(200).json({
      status: 'success',
      message: '题目删除成功'
    });
  } catch (error) {
    console.error('删除题目错误:', error);
    res.status(500).json({ status: 'error', message: '服务器内部错误' });
  }
});

module.exports = router;