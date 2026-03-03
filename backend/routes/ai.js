const express = require('express');
const router = express.Router();
const axios = require('axios');

router.post('/solve', async (req, res) => {
  try {
    const { questionContent, category, difficulty } = req.body;

    if (!questionContent) {
      return res.status(400).json({ status: 'error', message: '请提供题目内容' });
    }

    console.log('收到解题请求:', { questionContent, category, difficulty });

    const apiKey = process.env.DASHSCOPE_API_KEY;
    const model = process.env.QIANWEN_MODEL || 'qwen-plus';
    const apiUrl = process.env.QIANWEN_API_URL || 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions';

    if (!apiKey) {
      console.warn('API Key 未配置，使用模拟数据');
      return res.status(200).json({
        status: 'success',
        data: {
          solution: '请配置阿里云百炼 API Key 以使用真实的智能解题功能。',
          explanation: '这是一个模拟响应，实际使用时需要配置 API Key。',
          knowledgePoints: ['待配置 API']
        }
      });
    }

    const categoryNames = {
      math: '数学',
      chinese: '语文',
      english: '英语',
      physics: '物理',
      chemistry: '化学',
      biology: '生物',
      other: '其他'
    };

    const categoryName = categoryNames[category] || '其他';

    const prompt = `你是一位经验丰富的${categoryName}老师。请详细解答以下题目，并按照以下格式返回 JSON 数据：

题目：${questionContent}
科目：${categoryName}
难度：${difficulty || 3}星（1-5星）

请返回以下 JSON 格式（不要包含其他文本）：
{
  "solution": "详细的解题步骤和最终答案",
  "explanation": "解题思路和注意事项",
  "knowledgePoints": ["知识点1", "知识点2", "知识点3"]
}`;

    const response = await axios.post(
      apiUrl,
      {
        model: model,
        messages: [
          {
            role: 'system',
            content: '你是一位专业的学科教师，擅长解答各类题目。请用 JSON 格式返回结果。'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 2000
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        }
      }
    );

    let aiResponse = response.data.choices[0].message.content;
    
    let result;
    try {
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        result = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('无法解析 JSON');
      }
    } catch (parseError) {
      console.warn('解析 AI 响应失败，使用原始内容:', parseError);
      result = {
        solution: aiResponse,
        explanation: '这道题需要认真思考，建议结合课堂笔记复习相关知识点。',
        knowledgePoints: [categoryName + '知识点']
      };
    }

    res.status(200).json({
      status: 'success',
      data: result
    });
  } catch (error) {
    console.error('智能解题错误:', error.response?.data || error.message);
    
    res.status(200).json({
      status: 'success',
      data: {
        solution: 'AI 服务暂时不可用，请稍后重试。以下是通用解题建议：\n\n1. 仔细审题，理解题目要求\n2. 回顾相关知识点\n3. 尝试不同解题方法\n4. 检查答案合理性\n\n加油！你一定能解决这道题！',
        explanation: 'AI 服务暂时不可用，建议手动解题。',
        knowledgePoints: ['综合应用']
      }
    });
  }
});

module.exports = router;
