const express = require('express');
const router = express.Router();

router.post('/solve', async (req, res) => {
  try {
    const { questionContent, category, difficulty } = req.body;

    if (!questionContent) {
      return res.status(400).json({ status: 'error', message: '请提供题目内容' });
    }

    console.log('收到解题请求:', { questionContent, category, difficulty });

    const mockSolutions = {
      math: {
        answer: '详细解题步骤：\n\n1. 首先理解题目要求\n2. 分析已知条件\n3. 选择合适的公式\n4. 代入数值计算\n5. 检查结果合理性\n\n最终答案：请根据具体题目计算得出',
        explanation: '这是一个数学问题，建议仔细审题，注意单位换算和计算精度。',
        knowledgePoints: ['数学运算', '逻辑推理']
      },
      chinese: {
        answer: '解题思路：\n\n1. 仔细阅读题目\n2. 理解文章主旨\n3. 分析问题要求\n4. 结合上下文回答\n\n答案：请根据具体文章内容作答',
        explanation: '语文题需要理解文章内容，注意作者意图和修辞手法。',
        knowledgePoints: ['阅读理解', '文学鉴赏']
      },
      english: {
        answer: 'Solution Steps:\n\n1. Read the question carefully\n2. Understand the context\n3. Analyze grammar and vocabulary\n4. Choose the best answer\n\nAnswer: Please answer based on the specific question',
        explanation: 'English questions require understanding of grammar, vocabulary, and context.',
        knowledgePoints: ['Grammar', 'Vocabulary']
      },
      physics: {
        answer: '物理解题步骤：\n\n1. 确定研究对象\n2. 分析受力/运动情况\n3. 选择物理公式\n4. 代入数据计算\n5. 验证单位合理性\n\n答案：请根据具体题目计算',
        explanation: '物理题要注意物理量的单位和符号，画示意图有助于解题。',
        knowledgePoints: ['物理公式', '受力分析']
      },
      chemistry: {
        answer: '化学解题思路：\n\n1. 写出化学反应方程式\n2. 配平方程式\n3. 确定物质的量关系\n4. 进行计算\n\n答案：请根据具体反应计算',
        explanation: '化学题要注意反应条件和物质状态，配平方程式是关键。',
        knowledgePoints: ['化学方程式', '摩尔计算']
      },
      default: {
        answer: '解题建议：\n\n1. 仔细审题，理解题目要求\n2. 回顾相关知识点\n3. 尝试不同解题方法\n4. 检查答案合理性\n\n加油！你一定能解决这道题！',
        explanation: '这道题需要认真思考，建议结合课堂笔记复习相关知识点。',
        knowledgePoints: ['综合应用']
      }
    };

    const solution = mockSolutions[category] || mockSolutions.default;

    await new Promise(resolve => setTimeout(resolve, 1500));

    res.status(200).json({
      status: 'success',
      data: {
        solution: solution.answer,
        explanation: solution.explanation,
        knowledgePoints: solution.knowledgePoints
      }
    });
  } catch (error) {
    console.error('智能解题错误:', error);
    res.status(500).json({ status: 'error', message: '智能解题服务暂时不可用，请稍后重试' });
  }
});

module.exports = router;
