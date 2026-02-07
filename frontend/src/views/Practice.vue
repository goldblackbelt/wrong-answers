<template>
  <div class="practice-container">
    <el-card shadow="hover" class="practice-card">
      <template #header>
        <div class="practice-header">
          <el-button type="primary" plain @click="router.back()">
            返回
          </el-button>
          <h2>练习中心</h2>
          <el-button type="primary" @click="historyVisible = true">
            <el-icon><Time /></el-icon> 练习历史
          </el-button>
        </div>
      </template>

      <!-- 练习模式选择 -->
      <div class="practice-modes" v-if="!isPracticing">
        <h3>选择练习模式</h3>
        <el-row :gutter="20">
          <el-col :span="8">
            <el-card class="mode-card" @click="startPractice('mock')">
              <div class="mode-icon mock-icon">
                <el-icon class="icon"><Document /></el-icon>
              </div>
              <h4>模拟考试</h4>
              <p>按照考试标准设置的完整练习</p>
              <div class="mode-info">
                <span class="duration">60分钟</span>
                <span class="questions">50题</span>
              </div>
            </el-card>
          </el-col>
          <el-col :span="8">
            <el-card class="mode-card" @click="startPractice('专项')">
              <div class="mode-icon subject-icon">
                <el-icon class="icon"><Grid /></el-icon>
              </div>
              <h4>专项练习</h4>
              <p>针对特定知识点的集中练习</p>
              <div class="mode-info">
                <span class="duration">30分钟</span>
                <span class="questions">20题</span>
              </div>
            </el-card>
          </el-col>
          <el-col :span="8">
            <el-card class="mode-card" @click="startPractice('random')">
              <div class="mode-icon random-icon">
                <el-icon class="icon"><Refresh /></el-icon>
              </div>
              <h4>随机练习</h4>
              <p>随机生成的题目练习</p>
              <div class="mode-info">
                <span class="duration">15分钟</span>
                <span class="questions">10题</span>
              </div>
            </el-card>
          </el-col>
        </el-row>
      </div>

      <!-- 专项练习选择 -->
      <div class="subject-selection" v-if="showSubjectSelection">
        <h3>选择专项练习</h3>
        <el-row :gutter="20">
          <el-col :span="6" v-for="subject in subjects" :key="subject.id">
            <el-card class="subject-card" @click="startSubjectPractice(subject)">
              <div class="subject-icon" :style="{ backgroundColor: subject.color }">
                {{ subject.name.charAt(0) }}
              </div>
              <h4>{{ subject.name }}</h4>
              <p>{{ subject.questions }}题</p>
              <el-progress :percentage="subject.mastery" :color="subject.color" />
            </el-card>
          </el-col>
        </el-row>
      </div>

      <!-- 练习界面 -->
      <div class="practice-interface" v-if="isPracticing && currentQuestion">
        <div class="practice-header-info">
          <div class="practice-title">{{ practiceMode === 'mock' ? '模拟考试' : practiceMode === '专项' ? '专项练习' : '随机练习' }}</div>
          <div class="practice-stats">
            <div class="question-count">
              第 {{ currentQuestionIndex + 1 }}/{{ totalQuestions }} 题
            </div>
            <div class="timer" :class="{ 'warning': timeLeft < 600, 'danger': timeLeft < 300 }">
              <el-icon><Timer /></el-icon> {{ formatTime(timeLeft) }}
            </div>
          </div>
        </div>

        <div class="question-content">
          <h3>{{ currentQuestion.question }}</h3>
          <div class="options" v-if="currentQuestion.type === 'multiple'">
            <el-radio-group v-model="selectedOption">
              <el-radio 
                v-for="(option, index) in currentQuestion.options" 
                :key="index" 
                :label="String.fromCharCode(65 + index)"
              >
                {{ String.fromCharCode(65 + index) }}. {{ option }}
              </el-radio>
            </el-radio-group>
          </div>
          <div class="options" v-else-if="currentQuestion.type === 'checkbox'">
            <el-checkbox-group v-model="selectedOptions">
              <el-checkbox 
                v-for="(option, index) in currentQuestion.options" 
                :key="index" 
                :label="String.fromCharCode(65 + index)"
              >
                {{ String.fromCharCode(65 + index) }}. {{ option }}
              </el-checkbox>
            </el-checkbox-group>
          </div>
          <div class="options" v-else-if="currentQuestion.type === 'text'">
            <el-input
              v-model="selectedAnswer"
              type="textarea"
              :rows="4"
              placeholder="请输入答案"
            />
          </div>
        </div>

        <div class="practice-actions">
          <el-button @click="previousQuestion" :disabled="currentQuestionIndex === 0">
            上一题
          </el-button>
          <el-button type="primary" @click="nextQuestion" :disabled="currentQuestionIndex === totalQuestions - 1">
            下一题
          </el-button>
          <el-button type="success" @click="submitPractice">
            提交
          </el-button>
        </div>

        <div class="question-nav">
          <div 
            v-for="(q, index) in totalQuestions" 
            :key="index"
            class="question-nav-item"
            :class="{
              'answered': answeredQuestions.includes(index),
              'current': index === currentQuestionIndex,
              'unanswered': !answeredQuestions.includes(index)
            }"
            @click="goToQuestion(index)"
          >
            {{ index + 1 }}
          </div>
        </div>
      </div>

      <!-- 练习结果 -->
      <div class="practice-result" v-if="showResult">
        <div class="result-header">
          <h3>练习结果</h3>
          <div class="result-score">
            <div class="score">{{ practiceResult.score }}</div>
            <div class="score-label">得分</div>
          </div>
        </div>

        <div class="result-stats">
          <el-row :gutter="20">
            <el-col :span="6">
              <el-card class="result-stat-card">
                <div class="stat-number">{{ practiceResult.correct }}</div>
                <div class="stat-label">正确</div>
              </el-card>
            </el-col>
            <el-col :span="6">
              <el-card class="result-stat-card">
                <div class="stat-number">{{ practiceResult.incorrect }}</div>
                <div class="stat-label">错误</div>
              </el-card>
            </el-col>
            <el-col :span="6">
              <el-card class="result-stat-card">
                <div class="stat-number">{{ practiceResult.unanswered }}</div>
                <div class="stat-label">未答</div>
              </el-card>
            </el-col>
            <el-col :span="6">
              <el-card class="result-stat-card">
                <div class="stat-number">{{ practiceResult.accuracy }}%</div>
                <div class="stat-label">正确率</div>
              </el-card>
            </el-col>
          </el-row>
        </div>

        <div class="result-analysis">
          <h4>答题分析</h4>
          <el-table :data="practiceResult.analysis" style="width: 100%">
            <el-table-column prop="subject" label="科目" width="120" />
            <el-table-column prop="correct" label="正确" width="100" />
            <el-table-column prop="total" label="总数" width="100" />
            <el-table-column prop="accuracy" label="正确率" width="120">
              <template #default="scope">
                <el-progress :percentage="scope.row.accuracy" :color="getAccuracyColor(scope.row.accuracy)" />
              </template>
            </el-table-column>
          </el-table>
        </div>

        <div class="result-actions">
          <el-button @click="viewWrongQuestions">查看错题</el-button>
          <el-button type="primary" @click="restartPractice">重新练习</el-button>
          <el-button type="success" @click="finishPractice">返回首页</el-button>
        </div>
      </div>

      <!-- 练习历史对话框 -->
      <el-dialog
        v-model="historyVisible"
        title="练习历史"
        width="80%"
      >
        <el-table :data="practiceHistory" style="width: 100%">
          <el-table-column prop="date" label="日期" width="150" />
          <el-table-column prop="mode" label="练习模式" width="120" />
          <el-table-column prop="subject" label="科目" width="100" />
          <el-table-column prop="score" label="得分" width="100" />
          <el-table-column prop="accuracy" label="正确率" width="120">
            <template #default="scope">
              <el-progress :percentage="scope.row.accuracy" :color="getAccuracyColor(scope.row.accuracy)" />
            </template>
          </el-table-column>
          <el-table-column prop="time" label="用时" width="100" />
          <el-table-column prop="actions" label="操作" width="150">
            <template #default="scope">
              <el-button size="small" @click="viewHistoryDetail(scope.row.id)">查看详情</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-dialog>
    </el-card>
  </div>
</template>

<script>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { Document, Grid, Refresh, Timer, Time } from '@element-plus/icons-vue'

export default {
  name: 'Practice',
  components: {
    Document,
    Grid,
    Refresh,
    Timer,
    Time
  },
  setup() {
    const router = useRouter()
    const isPracticing = ref(false)
    const showSubjectSelection = ref(false)
    const showResult = ref(false)
    const historyVisible = ref(false)
    const practiceMode = ref('')
    const currentQuestionIndex = ref(0)
    const totalQuestions = ref(0)
    const selectedOption = ref('')
    const selectedOptions = ref([])
    const selectedAnswer = ref('')
    const timeLeft = ref(0)
    const timer = ref(null)
    const answeredQuestions = ref([])
    const currentQuestion = ref(null)
    const practiceResult = ref(null)

    // 模拟数据
    const subjects = ref([
      { id: 1, name: '数学', questions: 120, mastery: 75, color: '#409eff' },
      { id: 2, name: '语文', questions: 100, mastery: 80, color: '#67c23a' },
      { id: 3, name: '英语', questions: 90, mastery: 85, color: '#e6a23c' },
      { id: 4, name: '物理', questions: 80, mastery: 65, color: '#f56c6c' },
      { id: 5, name: '化学', questions: 70, mastery: 70, color: '#909399' },
      { id: 6, name: '生物', questions: 60, mastery: 60, color: '#d9363e' }
    ])

    const practiceHistory = ref([
      { id: 1, date: '2024-01-15', mode: '模拟考试', subject: '全部', score: 85, accuracy: 85, time: '55分钟' },
      { id: 2, date: '2024-01-14', mode: '专项练习', subject: '数学', score: 78, accuracy: 78, time: '28分钟' },
      { id: 3, date: '2024-01-13', mode: '随机练习', subject: '综合', score: 92, accuracy: 92, time: '12分钟' },
      { id: 4, date: '2024-01-12', mode: '模拟考试', subject: '全部', score: 75, accuracy: 75, time: '58分钟' },
      { id: 5, date: '2024-01-11', mode: '专项练习', subject: '物理', score: 65, accuracy: 65, time: '25分钟' }
    ])

    const mockQuestions = [
      {
        id: 1,
        question: '下列哪个是二次函数？',
        type: 'multiple',
        options: ['y = 2x + 1', 'y = x² + 2x + 1', 'y = 1/x', 'y = √x'],
        answer: 'B',
        subject: '数学'
      },
      {
        id: 2,
        question: '下列哪些是中国的传统节日？',
        type: 'checkbox',
        options: ['春节', '圣诞节', '中秋节', '愚人节'],
        answer: ['A', 'C'],
        subject: '语文'
      },
      {
        id: 3,
        question: 'What is the capital of France?',
        type: 'multiple',
        options: ['London', 'Paris', 'Berlin', 'Rome'],
        answer: 'B',
        subject: '英语'
      },
      {
        id: 4,
        question: '牛顿第二定律的表达式是什么？',
        type: 'text',
        answer: 'F = ma',
        subject: '物理'
      },
      {
        id: 5,
        question: '下列哪种元素的原子序数是8？',
        type: 'multiple',
        options: ['碳', '氧', '氮', '氢'],
        answer: 'B',
        subject: '化学'
      }
    ]

    const startPractice = (mode) => {
      if (mode === '专项') {
        showSubjectSelection.value = true
      } else {
        practiceMode.value = mode
        isPracticing.value = true
        totalQuestions.value = mode === 'mock' ? 50 : 10
        timeLeft.value = mode === 'mock' ? 3600 : 900
        startTimer()
        loadQuestion(0)
      }
    }

    const startSubjectPractice = (subject) => {
      practiceMode.value = '专项'
      showSubjectSelection.value = false
      isPracticing.value = true
      totalQuestions.value = 20
      timeLeft.value = 1800
      startTimer()
      loadQuestion(0)
    }

    const loadQuestion = (index) => {
      currentQuestionIndex.value = index
      // 模拟加载题目
      currentQuestion.value = mockQuestions[index % mockQuestions.length]
      selectedOption.value = ''
      selectedOptions.value = []
      selectedAnswer.value = ''
    }

    const startTimer = () => {
      timer.value = setInterval(() => {
        if (timeLeft.value > 0) {
          timeLeft.value--
        } else {
          clearInterval(timer.value)
          submitPractice()
        }
      }, 1000)
    }

    const formatTime = (seconds) => {
      const mins = Math.floor(seconds / 60)
      const secs = seconds % 60
      return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }

    const nextQuestion = () => {
      saveAnswer()
      if (currentQuestionIndex.value < totalQuestions.value - 1) {
        loadQuestion(currentQuestionIndex.value + 1)
      }
    }

    const previousQuestion = () => {
      saveAnswer()
      if (currentQuestionIndex.value > 0) {
        loadQuestion(currentQuestionIndex.value - 1)
      }
    }

    const goToQuestion = (index) => {
      saveAnswer()
      loadQuestion(index)
    }

    const saveAnswer = () => {
      if (!answeredQuestions.value.includes(currentQuestionIndex.value)) {
        answeredQuestions.value.push(currentQuestionIndex.value)
      }
    }

    const submitPractice = () => {
      clearInterval(timer.value)
      saveAnswer()
      
      // 模拟计算结果
      practiceResult.value = {
        score: Math.floor(Math.random() * 30) + 70,
        correct: Math.floor(Math.random() * 10) + 40,
        incorrect: Math.floor(Math.random() * 5) + 5,
        unanswered: totalQuestions.value - (Math.floor(Math.random() * 10) + 40 + Math.floor(Math.random() * 5) + 5),
        accuracy: Math.floor(Math.random() * 30) + 70,
        analysis: [
          { subject: '数学', correct: 12, total: 15, accuracy: 80 },
          { subject: '语文', correct: 10, total: 12, accuracy: 83 },
          { subject: '英语', correct: 9, total: 10, accuracy: 90 },
          { subject: '物理', correct: 7, total: 8, accuracy: 87 },
          { subject: '化学', correct: 6, total: 5, accuracy: 120 }
        ]
      }
      
      showResult.value = true
      isPracticing.value = false
    }

    const restartPractice = () => {
      showResult.value = false
      startPractice(practiceMode.value)
    }

    const finishPractice = () => {
      showResult.value = false
      isPracticing.value = false
      currentQuestionIndex.value = 0
      timeLeft.value = 0
      answeredQuestions.value = []
    }

    const viewWrongQuestions = () => {
      router.push('/questions')
    }

    const viewHistoryDetail = (id) => {
      ElMessage.success('查看历史详情功能正在开发中')
    }

    const getAccuracyColor = (accuracy) => {
      if (accuracy < 60) return '#f56c6c'
      if (accuracy < 80) return '#e6a23c'
      return '#67c23a'
    }

    const handleResize = () => {
      // 处理窗口 resize
    }

    onMounted(() => {
      window.addEventListener('resize', handleResize)
    })

    onUnmounted(() => {
      window.removeEventListener('resize', handleResize)
      if (timer.value) {
        clearInterval(timer.value)
      }
    })

    return {
      router,
      isPracticing,
      showSubjectSelection,
      showResult,
      historyVisible,
      practiceMode,
      currentQuestionIndex,
      totalQuestions,
      selectedOption,
      selectedOptions,
      selectedAnswer,
      timeLeft,
      answeredQuestions,
      currentQuestion,
      practiceResult,
      subjects,
      practiceHistory,
      startPractice,
      startSubjectPractice,
      nextQuestion,
      previousQuestion,
      goToQuestion,
      submitPractice,
      restartPractice,
      finishPractice,
      viewWrongQuestions,
      viewHistoryDetail,
      getAccuracyColor,
      formatTime
    }
  }
}
</script>

<style lang="scss">
.practice-container {
  padding: 20px;
}

.practice-card {
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);

  .practice-header {
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

  .practice-modes,
  .subject-selection,
  .practice-interface,
  .practice-result {
    padding: 0 20px 20px;

    h3 {
      margin: 0 0 20px 0;
      font-size: 16px;
      font-weight: bold;
      color: #303133;
      border-left: 4px solid #409eff;
      padding-left: 10px;
    }
  }

  .mode-card,
  .subject-card {
    cursor: pointer;
    transition: transform 0.3s, box-shadow 0.3s;
    text-align: center;

    &:hover {
      transform: translateY(-5px);
      box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
    }

    .mode-icon {
      width: 80px;
      height: 80px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 15px;

      .icon {
        font-size: 32px;
        color: white;
      }

      &.mock-icon {
        background-color: #409eff;
      }

      &.subject-icon {
        background-color: #67c23a;
      }

      &.random-icon {
        background-color: #e6a23c;
      }
    }

    .subject-icon {
      width: 60px;
      height: 60px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 15px;
      font-size: 24px;
      font-weight: bold;
      color: white;
    }

    h4 {
      margin: 0 0 10px 0;
      font-size: 16px;
      font-weight: bold;
      color: #303133;
    }

    p {
      margin: 0 0 15px 0;
      font-size: 14px;
      color: #606266;
    }

    .mode-info {
      display: flex;
      justify-content: space-around;
      font-size: 14px;
      color: #909399;

      .duration,
      .questions {
        display: flex;
        align-items: center;
      }
    }
  }

  .practice-interface {
    .practice-header-info {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
      padding-bottom: 15px;
      border-bottom: 1px solid #ebeef5;

      .practice-title {
        font-size: 18px;
        font-weight: bold;
        color: #303133;
      }

      .practice-stats {
        display: flex;
        align-items: center;
        gap: 30px;

        .question-count {
          font-size: 14px;
          color: #606266;
        }

        .timer {
          font-size: 16px;
          font-weight: bold;
          color: #409eff;

          &.warning {
            color: #e6a23c;
          }

          &.danger {
            color: #f56c6c;
          }
        }
      }
    }

    .question-content {
      margin-bottom: 30px;

      h3 {
        margin: 0 0 20px 0;
        font-size: 16px;
        font-weight: bold;
        color: #303133;
        border-left: none;
        padding-left: 0;
      }

      .options {
        .el-radio,
        .el-checkbox {
          display: block;
          margin-bottom: 10px;
        }
      }
    }

    .practice-actions {
      display: flex;
      justify-content: center;
      gap: 20px;
      margin-bottom: 30px;
    }

    .question-nav {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;

      .question-nav-item {
        width: 30px;
        height: 30px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 14px;
        cursor: pointer;
        transition: all 0.3s;

        &.answered {
          background-color: #67c23a;
          color: white;
        }

        &.current {
          background-color: #409eff;
          color: white;
          font-weight: bold;
        }

        &.unanswered {
          background-color: #ebeef5;
          color: #606266;
        }

        &:hover {
          transform: scale(1.1);
        }
      }
    }
  }

  .practice-result {
    .result-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 30px;

      h3 {
        border-left: none;
        padding-left: 0;
      }

      .result-score {
        text-align: center;

        .score {
          font-size: 48px;
          font-weight: bold;
          color: #409eff;
        }

        .score-label {
          font-size: 14px;
          color: #606266;
        }
      }
    }

    .result-stats {
      margin-bottom: 30px;

      .result-stat-card {
        text-align: center;

        .stat-number {
          font-size: 24px;
          font-weight: bold;
          color: #409eff;
          margin-bottom: 5px;
        }

        .stat-label {
          font-size: 14px;
          color: #606266;
        }
      }
    }

    .result-analysis {
      margin-bottom: 30px;

      h4 {
        margin: 0 0 20px 0;
        font-size: 16px;
        font-weight: bold;
        color: #303133;
      }
    }

    .result-actions {
      display: flex;
      justify-content: center;
      gap: 20px;
    }
  }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .practice-container {
    padding: 10px;
  }

  .practice-card {
    .practice-modes,
    .subject-selection,
    .practice-interface,
    .practice-result {
      padding: 0 10px 10px;
    }

    .mode-card,
    .subject-card {
      margin-bottom: 10px;
    }

    .practice-interface {
      .practice-header-info {
        flex-direction: column;
        align-items: flex-start;
        gap: 10px;

        .practice-stats {
          width: 100%;
          justify-content: space-between;
        }
      }

      .question-nav {
        .question-nav-item {
          width: 25px;
          height: 25px;
          font-size: 12px;
        }
      }

      .practice-actions {
        flex-direction: column;
        align-items: center;

        .el-button {
          width: 200px;
        }
      }
    }

    .practice-result {
      .result-header {
        flex-direction: column;
        align-items: center;
        gap: 20px;
      }

      .result-actions {
        flex-direction: column;
        align-items: center;

        .el-button {
          width: 200px;
        }
      }
    }
  }
}
</style>