const axios = require('axios');
const { expect } = require('chai');

// 测试基础URL
const BASE_URL = 'http://localhost:3000/api';

// 测试用户数据
const testUser = {
  username: 'testuser',
  email: 'test@example.com',
  password: 'password123'
};

let authToken = '';
let userId = '';

// 测试套件
describe('错题本系统 API 测试', () => {
  // 注册测试
  describe('用户认证', () => {
    it('应该成功注册新用户', async () => {
      const response = await axios.post(`${BASE_URL}/auth/register`, testUser);
      expect(response.status).to.equal(201);
      expect(response.data.status).to.equal('success');
      expect(response.data.data.user).to.have.property('username', testUser.username);
      expect(response.data.data.user).to.have.property('email', testUser.email);
      expect(response.data.data).to.have.property('token');
      authToken = response.data.data.token;
      userId = response.data.data.user.id;
    });

    it('应该成功登录用户', async () => {
      const response = await axios.post(`${BASE_URL}/auth/login`, {
        email: testUser.email,
        password: testUser.password
      });
      expect(response.status).to.equal(200);
      expect(response.data.status).to.equal('success');
      expect(response.data.data.user).to.have.property('username', testUser.username);
      expect(response.data.data).to.have.property('token');
    });

    it('应该获取当前用户信息', async () => {
      const response = await axios.get(`${BASE_URL}/auth/me`, {
        headers: {
          Authorization: `Bearer ${authToken}`
        }
      });
      expect(response.status).to.equal(200);
      expect(response.data.status).to.equal('success');
      expect(response.data.data.user).to.have.property('username', testUser.username);
    });
  });

  // 错题管理测试
  describe('错题管理', () => {
    let wrongQuestionId = '';

    it('应该成功上传错题', async () => {
      const response = await axios.post(`${BASE_URL}/wrong-questions/upload`, {
        questionContent: '测试题目：1+1=?',
        standardAnswer: '2',
        userAnswer: '3',
        errorReason: '计算错误',
        category: '数学',
        difficulty: 1
      }, {
        headers: {
          Authorization: `Bearer ${authToken}`
        }
      });
      expect(response.status).to.equal(201);
      expect(response.data.status).to.equal('success');
      expect(response.data.data.wrongQuestion).to.have.property('questionContent', '测试题目：1+1=?');
      wrongQuestionId = response.data.data.wrongQuestion._id;
    });

    it('应该获取错题列表', async () => {
      const response = await axios.get(`${BASE_URL}/wrong-questions/list`, {
        headers: {
          Authorization: `Bearer ${authToken}`
        }
      });
      expect(response.status).to.equal(200);
      expect(response.data.status).to.equal('success');
      expect(response.data.data).to.have.property('wrongQuestions');
      expect(Array.isArray(response.data.data.wrongQuestions)).to.be.true;
    });

    it('应该获取错题详情', async () => {
      const response = await axios.get(`${BASE_URL}/wrong-questions/${wrongQuestionId}`, {
        headers: {
          Authorization: `Bearer ${authToken}`
        }
      });
      expect(response.status).to.equal(200);
      expect(response.data.status).to.equal('success');
      expect(response.data.data.wrongQuestion).to.have.property('_id', wrongQuestionId);
    });

    it('应该更新错题', async () => {
      const response = await axios.put(`${BASE_URL}/wrong-questions/${wrongQuestionId}`, {
        errorReason: '测试更新：计算错误',
        category: '数学基础'
      }, {
        headers: {
          Authorization: `Bearer ${authToken}`
        }
      });
      expect(response.status).to.equal(200);
      expect(response.data.status).to.equal('success');
      expect(response.data.data.wrongQuestion).to.have.property('errorReason', '测试更新：计算错误');
      expect(response.data.data.wrongQuestion).to.have.property('category', '数学基础');
    });

    it('应该生成类似题目', async () => {
      const response = await axios.post(`${BASE_URL}/questions/generate-similar`, {
        wrongQuestionId: wrongQuestionId,
        count: 2
      }, {
        headers: {
          Authorization: `Bearer ${authToken}`
        }
      });
      expect(response.status).to.equal(201);
      expect(response.data.status).to.equal('success');
      expect(response.data.data.similarQuestions).to.have.lengthOf(2);
    });

    it('应该获取类似题目', async () => {
      const response = await axios.get(`${BASE_URL}/questions/similar/${wrongQuestionId}`, {
        headers: {
          Authorization: `Bearer ${authToken}`
        }
      });
      expect(response.status).to.equal(200);
      expect(response.data.status).to.equal('success');
      expect(Array.isArray(response.data.data.similarQuestions)).to.be.true;
    });

    it('应该更新掌握度', async () => {
      const response = await axios.post(`${BASE_URL}/mastery/update`, {
        questionId: wrongQuestionId,
        isCorrect: true
      }, {
        headers: {
          Authorization: `Bearer ${authToken}`
        }
      });
      expect(response.status).to.equal(200);
      expect(response.data.status).to.equal('success');
      expect(response.data.data.masteryRecord).to.have.property('masteryLevel');
      expect(response.data.data.wrongQuestion).to.have.property('masteryLevel');
    });

    it('应该生成复习计划', async () => {
      const response = await axios.post(`${BASE_URL}/review/generate`, {}, {
        headers: {
          Authorization: `Bearer ${authToken}`
        }
      });
      expect(response.status).to.equal(201);
      expect(response.data.status).to.equal('success');
      expect(response.data.data.reviewPlan).to.have.property('questions');
    });

    it('应该获取复习计划列表', async () => {
      const response = await axios.get(`${BASE_URL}/review/plans`, {
        headers: {
          Authorization: `Bearer ${authToken}`
        }
      });
      expect(response.status).to.equal(200);
      expect(response.data.status).to.equal('success');
      expect(Array.isArray(response.data.data.reviewPlans)).to.be.true;
    });

    it('应该获取复习统计', async () => {
      const response = await axios.get(`${BASE_URL}/review/stats`, {
        headers: {
          Authorization: `Bearer ${authToken}`
        }
      });
      expect(response.status).to.equal(200);
      expect(response.data.status).to.equal('success');
      expect(response.data.data).to.have.property('stats');
    });

    it('应该获取分类统计', async () => {
      const response = await axios.get(`${BASE_URL}/analysis/category-stats`, {
        headers: {
          Authorization: `Bearer ${authToken}`
        }
      });
      expect(response.status).to.equal(200);
      expect(response.data.status).to.equal('success');
      expect(response.data.data).to.have.property('categoryStats');
    });

    it('应该获取考点分析', async () => {
      const response = await axios.get(`${BASE_URL}/analysis/exam-points-analysis`, {
        headers: {
          Authorization: `Bearer ${authToken}`
        }
      });
      expect(response.status).to.equal(200);
      expect(response.data.status).to.equal('success');
      expect(response.data.data).to.have.property('examPointsStats');
    });

    it('应该获取薄弱环节分析', async () => {
      const response = await axios.get(`${BASE_URL}/analysis/weakness-analysis`, {
        headers: {
          Authorization: `Bearer ${authToken}`
        }
      });
      expect(response.status).to.equal(200);
      expect(response.data.status).to.equal('success');
      expect(response.data.data).to.have.property('weakPoints');
      expect(response.data.data).to.have.property('weakQuestions');
    });

    it('应该获取学习进度分析', async () => {
      const response = await axios.get(`${BASE_URL}/analysis/progress-analysis`, {
        headers: {
          Authorization: `Bearer ${authToken}`
        }
      });
      expect(response.status).to.equal(200);
      expect(response.data.status).to.equal('success');
      expect(response.data.data).to.have.property('overallProgress');
    });

    it('应该获取智能分析报告', async () => {
      const response = await axios.get(`${BASE_URL}/analysis/smart-analysis`, {
        headers: {
          Authorization: `Bearer ${authToken}`
        }
      });
      expect(response.status).to.equal(200);
      expect(response.data.status).to.equal('success');
      expect(response.data.data).to.have.property('analysisReport');
    });

    it('应该删除错题', async () => {
      const response = await axios.delete(`${BASE_URL}/wrong-questions/${wrongQuestionId}`, {
        headers: {
          Authorization: `Bearer ${authToken}`
        }
      });
      expect(response.status).to.equal(200);
      expect(response.data.status).to.equal('success');
    });
  });

  // 健康检查测试
  describe('健康检查', () => {
    it('应该返回健康状态', async () => {
      const response = await axios.get('http://localhost:3000/health');
      expect(response.status).to.equal(200);
      expect(response.data.status).to.equal('ok');
      expect(response.data.message).to.equal('错题本系统服务运行正常');
    });
  });
});

// 运行测试
if (require.main === module) {
  console.log('开始运行 API 测试...');
  require('mocha').run();
}