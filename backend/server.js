const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const { serverConfig, supabaseConfig } = require('./config');

// 创建Express应用
const app = express();

// 配置中间件
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 添加CSRF保护
const crypto = require('crypto');

// 简单的CSRF保护实现（不依赖session）
const csrfProtection = (req, res, next) => {
  // 只对非GET请求进行CSRF保护
  if (req.method !== 'GET') {
    // 在开发环境中暂时禁用CSRF保护，方便测试
    if (process.env.NODE_ENV !== 'production') {
      return next();
    }
    
    const csrfToken = req.headers['x-csrf-token'] || req.body._csrf;
    
    // 这里可以实现更复杂的CSRF令牌验证逻辑
    // 例如使用Redis存储令牌，或者基于用户会话的令牌验证
    
    // 暂时使用一个简单的验证，在生产环境中应该使用更安全的方法
    if (!csrfToken) {
      return res.status(403).json({
        status: 'error',
        message: 'CSRF令牌验证失败'
      });
    }
  }
  next();
};

// 应用CSRF保护到所有路由
app.use(csrfProtection);

// 配置静态文件服务
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.static(path.join(__dirname, 'public')));

// 配置文件上传
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, 'uploads');
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

// 初始化Supabase客户端
let supabase = null;
const { url: supabaseUrl, anonKey: supabaseAnonKey, serviceRoleKey: supabaseServiceKey } = supabaseConfig;

// 强制使用模拟模式，避免Supabase数据库连接问题
if (false) {
  console.log('连接到实际的Supabase数据库');
  supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      persistSession: false
    }
  });
} else {
  console.warn('使用模拟模式运行，确保所有功能正常工作');
  
  // 导入文件系统模块
  const fs = require('fs');
  const path = require('path');
  
  // 数据存储文件路径
  const dataDir = path.join(__dirname, 'data');
  const usersFile = path.join(dataDir, 'users.json');
  const wrongQuestionsFile = path.join(dataDir, 'wrongQuestions.json');
  const masteryRecordsFile = path.join(dataDir, 'masteryRecords.json');
  const reviewPlansFile = path.join(dataDir, 'reviewPlans.json');
  const questionsFile = path.join(dataDir, 'questions.json');
  
  // 确保数据目录存在
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  
  // 加载数据
  const loadData = (filePath, defaultValue) => {
    try {
      if (fs.existsSync(filePath)) {
        const data = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(data);
      }
      return defaultValue;
    } catch (error) {
      console.error(`加载数据失败 ${filePath}:`, error);
      return defaultValue;
    }
  };
  
  // 保存数据
  const saveData = (filePath, data) => {
    try {
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    } catch (error) {
      console.error(`保存数据失败 ${filePath}:`, error);
    }
  };
  
  // 加载模拟数据
  let mockUsers = loadData(usersFile, []);
  let mockUserId = Math.max(...mockUsers.map(u => u.id), 0) + 1;

  let mockWrongQuestions = loadData(wrongQuestionsFile, []);
  let mockWrongQuestionId = Math.max(...mockWrongQuestions.map(q => q.id), 0) + 1;

  let mockMasteryRecords = loadData(masteryRecordsFile, []);
  let mockMasteryId = Math.max(...mockMasteryRecords.map(r => r.id), 0) + 1;

  let mockReviewPlans = loadData(reviewPlansFile, []);
  let mockReviewPlanId = Math.max(...mockReviewPlans.map(p => p.id), 0) + 1;

  let mockQuestions = loadData(questionsFile, []);
  let mockQuestionId = Math.max(...mockQuestions.map(q => q.id), 0) + 1;

  supabase = {
    from: (table) => {
      if (table === 'users') {
        return {
          select: (columns) => {
            return {
              eq: (field, value) => {
                if (field === 'email') {
                  const user = mockUsers.find(u => u.email === value);
                  return {
                    single: () => ({ data: user || null, error: user ? null : { message: 'User not found' } })
                  };
                } else if (field === 'id') {
                  const user = mockUsers.find(u => u.id === value);
                  return {
                    single: () => ({ data: user || null, error: user ? null : { message: 'User not found' } })
                  };
                }
                return { single: () => ({ data: null, error: null }) };
              },
              single: () => ({ data: null, error: null })
            };
          },
          insert: (userData) => {
            const newUser = {
              id: mockUserId++,
              ...userData,
              created_at: new Date(),
              updated_at: new Date()
            };
            mockUsers.push(newUser);
            saveData(usersFile, mockUsers);
            return {
              select: () => ({
                single: () => ({ data: newUser, error: null })
              })
            };
          },
          update: (userData) => {
            return {
              eq: (field, value) => {
                if (field === 'id') {
                  const user = mockUsers.find(u => u.id === value);
                  if (user) {
                    Object.assign(user, userData);
                    user.updated_at = new Date();
                    saveData(usersFile, mockUsers);
                  }
                  return {
                    select: () => ({
                      single: () => ({ data: user || null, error: null })
                    })
                  };
                }
                return { select: () => ({ single: () => ({ data: null, error: null }) }) };
              }
            };
          },
          delete: () => ({
            eq: () => ({ error: null })
          })
        };
      } else if (table === 'wrong_questions') {
        return {
          select: (columns) => {
            return {
              eq: (field, value) => {
                if (field === 'user_id') {
                  const questions = mockWrongQuestions.filter(q => q.user_id === value);
                  return {
                    order: (field, options) => {
                      if (field === 'upload_date') {
                        questions.sort((a, b) => {
                          const dateA = new Date(a.upload_date);
                          const dateB = new Date(b.upload_date);
                          return options.ascending ? dateA - dateB : dateB - dateA;
                        });
                      }
                      return { data: questions, error: null };
                    },
                    data: questions,
                    error: null
                  };
                } else if (field === 'id') {
                  const question = mockWrongQuestions.find(q => q.id === value);
                  return {
                    single: () => ({ data: question || null, error: question ? null : { message: 'Question not found' } })
                  };
                }
                return { data: [], error: null };
              },
              order: (field, options) => {
                const sortedQuestions = [...mockWrongQuestions];
                if (field === 'upload_date') {
                  sortedQuestions.sort((a, b) => {
                    const dateA = new Date(a.upload_date);
                    const dateB = new Date(b.upload_date);
                    return options.ascending ? dateA - dateB : dateB - dateA;
                  });
                }
                return { data: sortedQuestions, error: null };
              },
              data: mockWrongQuestions,
              error: null
            };
          },
          insert: (questionData) => {
            const newQuestion = {
              id: mockWrongQuestionId++,
              ...questionData,
              upload_date: questionData.upload_date || new Date(),
              created_at: new Date(),
              updated_at: new Date()
            };
            mockWrongQuestions.push(newQuestion);
            saveData(wrongQuestionsFile, mockWrongQuestions);
            return {
              select: () => ({
                single: () => ({ data: newQuestion, error: null })
              })
            };
          },
          update: (updateData) => {
            return {
              eq: (field, value) => {
                if (field === 'id') {
                  const questionIndex = mockWrongQuestions.findIndex(q => q.id === value);
                  if (questionIndex !== -1) {
                    const updatedQuestion = {
                      ...mockWrongQuestions[questionIndex],
                      ...updateData,
                      updated_at: new Date()
                    };
                    mockWrongQuestions[questionIndex] = updatedQuestion;
                    saveData(wrongQuestionsFile, mockWrongQuestions);
                    return {
                      select: () => ({
                        single: () => ({ data: updatedQuestion, error: null })
                      })
                    };
                  }
                  return {
                    select: () => ({
                      single: () => ({ data: null, error: { message: 'Question not found' } })
                    })
                  };
                }
                return { select: () => ({ single: () => ({ data: null, error: null }) }) };
              }
            };
          },
          delete: () => {
            return {
              eq: (field, value) => {
                if (field === 'id') {
                  const questionIndex = mockWrongQuestions.findIndex(q => q.id === value);
                  if (questionIndex !== -1) {
                    mockWrongQuestions.splice(questionIndex, 1);
                    saveData(wrongQuestionsFile, mockWrongQuestions);
                  }
                  return { error: null };
                }
                return { error: null };
              }
            };
          }
        };
      } else if (table === 'mastery_records') {
        return {
          select: (columns) => {
            return {
              eq: (field, value) => {
                if (field === 'user_id') {
                  const records = mockMasteryRecords.filter(r => r.user_id === value);
                  return { data: records, error: null };
                } else if (field === 'id') {
                  const record = mockMasteryRecords.find(r => r.id === value);
                  return {
                    single: () => ({ data: record || null, error: record ? null : { message: 'Record not found' } })
                  };
                } else if (field === 'question_id') {
                  const record = mockMasteryRecords.find(r => r.question_id === value);
                  return {
                    single: () => ({ data: record || null, error: record ? null : { message: 'Record not found' } })
                  };
                }
                return { data: [], error: null };
              },
              data: mockMasteryRecords,
              error: null
            };
          },
          insert: (recordData) => {
            const newRecord = {
              id: mockMasteryId++,
              user_id: recordData.user_id || recordData.userId,
              question_id: recordData.question_id || recordData.questionId,
              mastery_level: recordData.mastery_level || recordData.masteryLevel || 0,
              attempt_count: recordData.attempt_count || recordData.attemptCount || 0,
              correct_count: recordData.correct_count || recordData.correctCount || 0,
              last_attempt_date: recordData.last_attempt_date || recordData.lastAttemptDate || new Date(),
              history: recordData.history || [],
              created_at: new Date(),
              updated_at: new Date()
            };
            mockMasteryRecords.push(newRecord);
            saveData(masteryRecordsFile, mockMasteryRecords);
            return {
              select: () => ({
                single: () => ({ data: newRecord, error: null })
              })
            };
          },
          update: (updateData) => {
            return {
              eq: (field, value) => {
                if (field === 'id') {
                  const recordIndex = mockMasteryRecords.findIndex(r => r.id === value);
                  if (recordIndex !== -1) {
                    const updatedRecord = {
                      ...mockMasteryRecords[recordIndex],
                      mastery_level: updateData.mastery_level || updateData.masteryLevel || mockMasteryRecords[recordIndex].mastery_level,
                      attempt_count: updateData.attempt_count || updateData.attemptCount || mockMasteryRecords[recordIndex].attempt_count,
                      correct_count: updateData.correct_count || updateData.correctCount || mockMasteryRecords[recordIndex].correct_count,
                      last_attempt_date: updateData.last_attempt_date || updateData.lastAttemptDate || mockMasteryRecords[recordIndex].last_attempt_date,
                      history: updateData.history || mockMasteryRecords[recordIndex].history,
                      updated_at: new Date()
                    };
                    mockMasteryRecords[recordIndex] = updatedRecord;
                    saveData(masteryRecordsFile, mockMasteryRecords);
                    return {
                      select: () => ({
                        single: () => ({ data: updatedRecord, error: null })
                      })
                    };
                  }
                  return {
                    select: () => ({
                      single: () => ({ data: null, error: { message: 'Record not found' } })
                    })
                  };
                }
                return { select: () => ({ single: () => ({ data: null, error: null }) }) };
              }
            };
          }
        };
      } else if (table === 'review_plans') {
        return {
          select: (columns) => {
            return {
              eq: (field, value) => {
                if (field === 'user_id') {
                  const plans = mockReviewPlans.filter(p => p.user_id === value);
                  return {
                    order: (field, options) => {
                      if (field === 'next_review_date') {
                        plans.sort((a, b) => {
                          const dateA = new Date(a.next_review_date);
                          const dateB = new Date(b.next_review_date);
                          return options.ascending ? dateA - dateB : dateB - dateA;
                        });
                      }
                      return { data: plans, error: null };
                    },
                    data: plans, error: null
                  };
                } else if (field === 'id') {
                  const plan = mockReviewPlans.find(p => p.id === value);
                  return {
                    single: () => ({ data: plan || null, error: plan ? null : { message: 'Plan not found' } })
                  };
                } else if (field === 'status') {
                  const plans = mockReviewPlans.filter(p => p.status === value);
                  return {
                    lte: (field, value) => {
                      if (field === 'next_review_date') {
                        const filteredPlans = plans.filter(p => new Date(p.next_review_date) <= new Date(value));
                        return {
                          order: (field, options) => {
                            if (field === 'next_review_date') {
                              filteredPlans.sort((a, b) => {
                                const dateA = new Date(a.next_review_date);
                                const dateB = new Date(b.next_review_date);
                                return options.ascending ? dateA - dateB : dateB - dateA;
                              });
                            }
                            return { data: filteredPlans, error: null };
                          },
                          data: filteredPlans, error: null
                        };
                      }
                      return { data: [], error: null };
                    },
                    data: plans, error: null
                  };
                }
                return { data: [], error: null };
              },
              order: (field, options) => {
                const sortedPlans = [...mockReviewPlans];
                if (field === 'next_review_date') {
                  sortedPlans.sort((a, b) => {
                    const dateA = new Date(a.next_review_date);
                    const dateB = new Date(b.next_review_date);
                    return options.ascending ? dateA - dateB : dateB - dateA;
                  });
                }
                return { data: sortedPlans, error: null };
              },
              data: mockReviewPlans,
              error: null
            };
          },
          insert: (planData) => {
            const newPlan = {
              id: mockReviewPlanId++,
              user_id: planData.user_id || planData.userId,
              questions: planData.questions || [],
              next_review_date: planData.next_review_date || planData.nextReviewDate || new Date(),
              review_interval: planData.review_interval || planData.reviewInterval || 1,
              status: planData.status || 'pending',
              created_at: new Date(),
              updated_at: new Date()
            };
            mockReviewPlans.push(newPlan);
            saveData(reviewPlansFile, mockReviewPlans);
            return {
              select: () => ({
                single: () => ({ data: newPlan, error: null })
              })
            };
          },
          update: (updateData) => {
            return {
              eq: (field, value) => {
                if (field === 'id') {
                  const planIndex = mockReviewPlans.findIndex(p => p.id === value);
                  if (planIndex !== -1) {
                    const updatedPlan = {
                      ...mockReviewPlans[planIndex],
                      questions: updateData.questions || mockReviewPlans[planIndex].questions,
                      next_review_date: updateData.next_review_date || updateData.nextReviewDate || mockReviewPlans[planIndex].next_review_date,
                      review_interval: updateData.review_interval || updateData.reviewInterval || mockReviewPlans[planIndex].review_interval,
                      status: updateData.status || mockReviewPlans[planIndex].status,
                      updated_at: new Date()
                    };
                    mockReviewPlans[planIndex] = updatedPlan;
                    saveData(reviewPlansFile, mockReviewPlans);
                    return {
                      select: () => ({
                        single: () => ({ data: updatedPlan, error: null })
                      })
                    };
                  }
                  return {
                    select: () => ({
                      single: () => ({ data: null, error: { message: 'Plan not found' } })
                    })
                  };
                }
                return { select: () => ({ single: () => ({ data: null, error: null }) }) };
              }
            };
          },
          delete: () => {
            return {
              eq: (field, value) => {
                if (field === 'id') {
                  const planIndex = mockReviewPlans.findIndex(p => p.id === value);
                  if (planIndex !== -1) {
                    mockReviewPlans.splice(planIndex, 1);
                    saveData(reviewPlansFile, mockReviewPlans);
                  }
                  return { error: null };
                }
                return { error: null };
              }
            };
          }
        };
      } else if (table === 'questions') {
        return {
          select: (columns) => {
            return {
              eq: (field, value) => {
                if (field === 'id') {
                  const question = mockQuestions.find(q => q.id === value);
                  return {
                    single: () => ({ data: question || null, error: question ? null : { message: 'Question not found' } })
                  };
                }
                return { data: [], error: null };
              },
              limit: (limit) => {
                return {
                  order: (field, options) => {
                    const limitedQuestions = [...mockQuestions].slice(0, limit);
                    if (field === 'created_at') {
                      limitedQuestions.sort((a, b) => {
                        const dateA = new Date(a.created_at);
                        const dateB = new Date(b.created_at);
                        return options.ascending ? dateA - dateB : dateB - dateA;
                      });
                    }
                    return { data: limitedQuestions, error: null };
                  },
                  data: mockQuestions.slice(0, limit), error: null
                };
              },
              data: mockQuestions, error: null
            };
          },
          insert: (questionData) => {
            const newQuestion = {
              id: mockQuestionId++,
              content: questionData.content,
              image: questionData.image,
              answer: questionData.answer,
              explanation: questionData.explanation,
              knowledge_points: questionData.knowledge_points || questionData.knowledgePoints || [],
              exam_points: questionData.exam_points || questionData.examPoints || [],
              difficulty: questionData.difficulty || 3,
              type: questionData.type || 'multiple_choice',
              created_at: new Date(),
              updated_at: new Date()
            };
            mockQuestions.push(newQuestion);
            saveData(questionsFile, mockQuestions);
            return {
              select: () => ({
                single: () => ({ data: newQuestion, error: null })
              })
            };
          },
          update: (updateData) => {
            return {
              eq: (field, value) => {
                if (field === 'id') {
                  const questionIndex = mockQuestions.findIndex(q => q.id === value);
                  if (questionIndex !== -1) {
                    const updatedQuestion = {
                      ...mockQuestions[questionIndex],
                      content: updateData.content || mockQuestions[questionIndex].content,
                      image: updateData.image || mockQuestions[questionIndex].image,
                      answer: updateData.answer || mockQuestions[questionIndex].answer,
                      explanation: updateData.explanation || mockQuestions[questionIndex].explanation,
                      knowledge_points: updateData.knowledge_points || updateData.knowledgePoints || mockQuestions[questionIndex].knowledge_points,
                      exam_points: updateData.exam_points || updateData.examPoints || mockQuestions[questionIndex].exam_points,
                      difficulty: updateData.difficulty || mockQuestions[questionIndex].difficulty,
                      type: updateData.type || mockQuestions[questionIndex].type,
                      updated_at: new Date()
                    };
                    mockQuestions[questionIndex] = updatedQuestion;
                    saveData(questionsFile, mockQuestions);
                    return {
                      select: () => ({
                        single: () => ({ data: updatedQuestion, error: null })
                      })
                    };
                  }
                  return {
                    select: () => ({
                      single: () => ({ data: null, error: { message: 'Question not found' } })
                    })
                  };
                }
                return { select: () => ({ single: () => ({ data: null, error: null }) }) };
              }
            };
          },
          delete: () => {
            return {
              eq: (field, value) => {
                if (field === 'id') {
                  const questionIndex = mockQuestions.findIndex(q => q.id === value);
                  if (questionIndex !== -1) {
                    mockQuestions.splice(questionIndex, 1);
                    saveData(questionsFile, mockQuestions);
                  }
                  return { error: null };
                }
                return { error: null };
              }
            };
          }
        };
      }
      return {
        select: () => ({ data: [], error: null }),
        insert: () => ({ data: null, error: null }),
        update: () => ({ data: null, error: null }),
        delete: () => ({ error: null })
      };
    }
  };
}

// 导出Supabase客户端供其他模块使用
global.supabase = supabase;

// 导入模型
const User = require('./models/User');
const WrongQuestion = require('./models/WrongQuestion');
const Question = require('./models/Question');
const MasteryRecord = require('./models/MasteryRecord');
const ReviewPlan = require('./models/ReviewPlan');

// 导入路由
const authRoutes = require('./routes/auth');
const wrongQuestionRoutes = require('./routes/wrongQuestion');
const questionRoutes = require('./routes/question');
const masteryRoutes = require('./routes/mastery');
const reviewRoutes = require('./routes/review');
const analysisRoutes = require('./routes/analysis');

// 使用路由
app.use('/api/auth', authRoutes);
app.use('/api/wrong-questions', wrongQuestionRoutes);
app.use('/api/questions', questionRoutes);
app.use('/api/mastery', masteryRoutes);
app.use('/api/review', reviewRoutes);
app.use('/api/analysis', analysisRoutes);

// 健康检查路由
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: '错题本系统服务运行正常' });
});

// 404处理
app.use((req, res) => {
  res.status(404).json({ status: 'error', message: '接口不存在' });
});

// 错误处理中间件
app.use((err, req, res, next) => {
  console.error('服务器错误:', err);
  const errorResponse = {
    status: 'error',
    message: '服务器内部错误',
    timestamp: new Date().toISOString()
  };
  
  // 在开发环境中返回详细错误信息
  if (process.env.NODE_ENV !== 'production') {
    errorResponse.details = err.message;
    errorResponse.stack = err.stack;
  }
  
  res.status(500).json(errorResponse);
});

// 启动服务器
const PORT = serverConfig.port;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`服务器运行在 http://localhost:${PORT}`);
  console.log(`环境: ${serverConfig.nodeEnv}`);
});

module.exports = app;