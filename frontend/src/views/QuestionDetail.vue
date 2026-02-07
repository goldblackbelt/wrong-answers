<template>
  <div class="question-detail-container">
    <el-card shadow="hover" class="question-detail-card">
      <template #header>
        <div class="question-detail-header">
          <el-button type="primary" plain @click="router.back()">
            返回
          </el-button>
          <h2>错题详情</h2>
          <el-button type="danger" @click="deleteQuestion">
            <el-icon><Delete /></el-icon> 删除错题
          </el-button>
        </div>
      </template>

      <div class="question-detail-content" v-if="question">
        <!-- 基本信息 -->
        <div class="basic-info">
          <el-row :gutter="20">
            <el-col :span="8">
              <el-tag :type="getCategoryType(question.category)">{{ getCategoryName(question.category) }}</el-tag>
            </el-col>
            <el-col :span="8">
              <div class="difficulty-info">
                <span>难度：</span>
                <el-rate v-model="question.difficulty" disabled :max="5" show-score score-template="{{ question.difficulty }}" />
              </div>
            </el-col>
            <el-col :span="8">
              <div class="upload-date">
                <span>上传时间：</span>
                <span>{{ formatDate(question.uploadDate) }}</span>
              </div>
            </el-col>
          </el-row>
        </div>

        <!-- 题目内容 -->
        <div class="question-section">
          <h3>题目内容</h3>
          <div class="content-box">
            <p>{{ question.questionContent }}</p>
            <img v-if="question.questionImage" :src="question.questionImage" alt="题目图片" class="question-image" />
          </div>
        </div>

        <!-- 答案对比 -->
        <div class="answers-section">
          <h3>答案对比</h3>
          <div class="answers-box">
            <div class="answer-item correct-answer">
              <h4>标准答案</h4>
              <p>{{ question.standardAnswer }}</p>
            </div>
            <div class="answer-item user-answer">
              <h4>我的答案</h4>
              <p>{{ question.userAnswer }}</p>
            </div>
          </div>
        </div>

        <!-- 错误原因 -->
        <div class="error-reason-section">
          <h3>错误原因</h3>
          <div class="content-box">
            <p>{{ question.errorReason }}</p>
          </div>
        </div>

        <!-- 知识点 -->
        <div class="knowledge-section">
          <h3>知识点</h3>
          <div class="knowledge-tags">
            <el-tag
              v-for="tag in question.knowledgePoints"
              :key="tag"
              class="knowledge-tag"
            >
              {{ tag }}
            </el-tag>
            <el-tag v-if="question.knowledgePoints.length === 0" type="info">
              暂无知识点
            </el-tag>
          </div>
        </div>

        <!-- 掌握度调整 -->
        <div class="mastery-section">
          <h3>掌握度调整</h3>
          <div class="mastery-adjust">
            <el-slider v-model="question.masteryLevel" :min="0" :max="100" :marks="{ 0: '不熟悉', 50: '一般', 100: '已掌握' }" />
            <el-button type="primary" @click="updateMastery">
              更新掌握度
            </el-button>
          </div>
        </div>

        <!-- 复习记录 -->
        <div class="review-section">
          <h3>复习记录</h3>
          <div class="review-info">
            <p>复习次数：{{ question.reviewCount }}次</p>
            <p v-if="question.lastReviewDate">
              最后复习时间：{{ formatDate(question.lastReviewDate) }}
            </p>
            <el-button type="success" @click="addReviewRecord">
              <el-icon><Timer /></el-icon> 标记为已复习
            </el-button>
          </div>
        </div>

        <!-- 操作按钮 -->
        <div class="action-buttons">
          <el-button type="primary" @click="router.back()">
            返回列表
          </el-button>
          <el-button type="warning" @click="editQuestion">
            <el-icon><Edit /></el-icon> 编辑错题
          </el-button>
        </div>
      </div>

      <!-- 加载状态 -->
      <div class="loading-section" v-else>
        <el-skeleton :rows="10" animated />
      </div>
    </el-card>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { Delete, Timer, Edit } from '@element-plus/icons-vue'

export default {
  name: 'QuestionDetail',
  components: {
    Delete,
    Timer,
    Edit
  },
  setup() {
    const router = useRouter()
    const route = useRoute()
    const questionId = route.params.id
    const question = ref(null)

    // 模拟数据
    const mockQuestions = [
      {
        id: 1,
        questionContent: '已知函数f(x) = x^2 + 2x + 1，求f(2)的值',
        questionImage: '',
        standardAnswer: 'f(2) = 2^2 + 2*2 + 1 = 4 + 4 + 1 = 9',
        userAnswer: 'f(2) = 2^2 + 2*2 + 1 = 4 + 4 + 1 = 8',
        errorReason: '计算错误，最后一步加法错误',
        category: 'math',
        difficulty: 2,
        masteryLevel: 0,
        uploadDate: new Date('2026-02-01'),
        reviewCount: 0,
        lastReviewDate: null,
        knowledgePoints: ['二次函数', '函数求值']
      },
      {
        id: 2,
        questionContent: '下列哪项不是中国古代四大发明？',
        questionImage: '',
        standardAnswer: 'A. 造纸术 B. 火药 C. 指南针 D. 瓷器 (正确答案：D)',
        userAnswer: 'A. 造纸术 B. 火药 C. 指南针 D. 瓷器 (错误答案：C)',
        errorReason: '记忆错误，四大发明是造纸术、火药、指南针、印刷术',
        category: 'chinese',
        difficulty: 1,
        masteryLevel: 50,
        uploadDate: new Date('2026-02-02'),
        reviewCount: 1,
        lastReviewDate: new Date('2026-02-03'),
        knowledgePoints: ['中国古代史', '四大发明']
      },
      {
        id: 3,
        questionContent: 'What is the capital of France?',
        questionImage: '',
        standardAnswer: 'Paris',
        userAnswer: 'London',
        errorReason: '混淆了法国和英国的首都',
        category: 'english',
        difficulty: 1,
        masteryLevel: 100,
        uploadDate: new Date('2026-02-03'),
        reviewCount: 2,
        lastReviewDate: new Date('2026-02-05'),
        knowledgePoints: ['国家首都', '英语词汇']
      },
      {
        id: 4,
        questionContent: '一个物体从高处自由下落，忽略空气阻力，求下落1秒后的速度（g=9.8m/s²）',
        questionImage: '',
        standardAnswer: 'v = gt = 9.8 * 1 = 9.8 m/s',
        userAnswer: 'v = 1/2 gt² = 4.9 m/s',
        errorReason: '公式错误，速度公式是v=gt，不是位移公式',
        category: 'physics',
        difficulty: 3,
        masteryLevel: 30,
        uploadDate: new Date('2026-02-04'),
        reviewCount: 1,
        lastReviewDate: new Date('2026-02-06'),
        knowledgePoints: ['自由落体', '速度计算']
      },
      {
        id: 5,
        questionContent: '下列哪种物质是酸性氧化物？',
        questionImage: '',
        standardAnswer: 'A. CO2 B. CaO C. Na2O D. MgO (正确答案：A)',
        userAnswer: 'A. CO2 B. CaO C. Na2O D. MgO (错误答案：B)',
        errorReason: '概念不清，酸性氧化物是能与碱反应生成盐和水的氧化物',
        category: 'chemistry',
        difficulty: 2,
        masteryLevel: 60,
        uploadDate: new Date('2026-02-05'),
        reviewCount: 1,
        lastReviewDate: new Date('2026-02-07'),
        knowledgePoints: ['氧化物', '酸性氧化物']
      }
    ]

    const fetchQuestion = async () => {
      try {
        // 模拟API调用
        setTimeout(() => {
          const foundQuestion = mockQuestions.find(q => q.id == questionId)
          question.value = foundQuestion || null
        }, 500)

        // 实际API调用
        /*
        const response = await axios.get(`/api/wrong-questions/${questionId}`)
        question.value = response.data.data.wrongQuestion
        */
      } catch (error) {
        console.error('获取错题详情失败:', error)
        ElMessage.error('获取错题详情失败')
      }
    }

    const deleteQuestion = () => {
      ElMessageBox.confirm('确定要删除这道错题吗？', '警告', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        // 模拟删除
        ElMessage.success('删除成功')
        router.push('/questions')
      }).catch(() => {
        // 取消删除
      })
    }

    const updateMastery = () => {
      // 模拟更新
      ElMessage.success('掌握度更新成功')
    }

    const addReviewRecord = () => {
      // 模拟添加复习记录
      if (question.value) {
        question.value.reviewCount++
        question.value.lastReviewDate = new Date()
        ElMessage.success('已标记为已复习')
      }
    }

    const editQuestion = () => {
      // 编辑功能，这里可以跳转到编辑页面
      ElMessage.info('编辑功能正在开发中')
    }

    const getCategoryType = (category) => {
      const typeMap = {
        math: 'primary',
        chinese: 'success',
        english: 'warning',
        physics: 'danger',
        chemistry: 'info',
        biology: 'purple',
        other: 'default'
      }
      return typeMap[category] || 'default'
    }

    const getCategoryName = (category) => {
      const nameMap = {
        math: '数学',
        chinese: '语文',
        english: '英语',
        physics: '物理',
        chemistry: '化学',
        biology: '生物',
        other: '其他'
      }
      return nameMap[category] || category
    }

    const formatDate = (date) => {
      if (!date) return ''
      return new Date(date).toLocaleString('zh-CN')
    }

    onMounted(() => {
      fetchQuestion()
    })

    return {
      router,
      question,
      deleteQuestion,
      updateMastery,
      addReviewRecord,
      editQuestion,
      getCategoryType,
      getCategoryName,
      formatDate
    }
  }
}
</script>

<style lang="scss">
.question-detail-container {
  padding: 20px;
}

.question-detail-card {
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);

  .question-detail-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 30px;

    h2 {
      margin: 0;
      font-size: 20px;
      font-weight: bold;
      color: #409eff;
    }
  }

  .question-detail-content {
    padding: 0 20px 20px;

    .basic-info {
      margin-bottom: 30px;
      padding: 15px;
      background-color: #f5f7fa;
      border-radius: 8px;
    }

    .question-section,
    .answers-section,
    .error-reason-section,
    .knowledge-section,
    .mastery-section,
    .review-section {
      margin-bottom: 30px;

      h3 {
        margin: 0 0 15px 0;
        font-size: 16px;
        font-weight: bold;
        color: #303133;
        border-left: 4px solid #409eff;
        padding-left: 10px;
      }

      .content-box {
        padding: 15px;
        background-color: #f9f9f9;
        border-radius: 8px;
        border: 1px solid #ebeef5;

        p {
          margin: 0;
          line-height: 1.6;
        }

        .question-image {
          max-width: 100%;
          max-height: 400px;
          margin-top: 15px;
          border-radius: 4px;
        }
      }

      .answers-box {
        display: flex;
        gap: 20px;

        .answer-item {
          flex: 1;
          padding: 15px;
          border-radius: 8px;
          border: 1px solid #ebeef5;

          h4 {
            margin: 0 0 10px 0;
            font-size: 14px;
            font-weight: bold;
          }

          p {
            margin: 0;
            line-height: 1.6;
          }

          &.correct-answer {
            background-color: #f0f9eb;
            border-color: #c2e7b0;

            h4 {
              color: #67c23a;
            }
          }

          &.user-answer {
            background-color: #fef0f0;
            border-color: #fbc4c4;

            h4 {
              color: #f56c6c;
            }
          }
        }
      }

      .knowledge-tags {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;

        .knowledge-tag {
          margin-bottom: 10px;
        }
      }

      .mastery-adjust {
        display: flex;
        align-items: center;
        gap: 20px;

        .el-slider {
          flex: 1;
        }
      }

      .review-info {
        display: flex;
        align-items: center;
        gap: 20px;
        padding: 15px;
        background-color: #f5f7fa;
        border-radius: 8px;

        p {
          margin: 0;
        }

        .el-button {
          margin-left: auto;
        }
      }
    }

    .action-buttons {
      display: flex;
      gap: 10px;
      justify-content: flex-end;
      margin-top: 30px;
    }

    .difficulty-info,
    .upload-date {
      display: flex;
      align-items: center;
      gap: 10px;
    }
  }

  .loading-section {
    padding: 20px;
  }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .question-detail-container {
    padding: 10px;
  }

  .question-detail-card {
    .question-detail-content {
      padding: 0 10px 10px;

      .answers-section {
        .answers-box {
          flex-direction: column;
        }
      }

      .mastery-section {
        .mastery-adjust {
          flex-direction: column;
          align-items: stretch;
          gap: 10px;
        }
      }

      .review-section {
        .review-info {
          flex-direction: column;
          align-items: flex-start;
          gap: 10px;

          .el-button {
            margin-left: 0;
            align-self: flex-start;
          }
        }
      }

      .action-buttons {
        flex-direction: column;

        .el-button {
          width: 100%;
        }
      }

      .basic-info {
        .el-row {
          .el-col {
            margin-bottom: 10px;
          }
        }
      }
    }
  }
}
</style>