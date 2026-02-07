<template>
  <div class="review-plan-container">
    <el-card shadow="hover" class="review-plan-card">
      <template #header>
        <div class="review-plan-header">
          <el-button type="primary" plain @click="router.back()">
            返回
          </el-button>
          <h2>复习计划</h2>
          <el-button type="primary" @click="generatePlan">
            <el-icon><Refresh /></el-icon> 生成计划
          </el-button>
        </div>
      </template>

      <div class="review-plan-content" v-if="reviewData">
        <!-- 今日复习 -->
        <div class="today-section">
          <h3>今日复习</h3>
          <el-card class="today-card">
            <div class="today-info">
              <div class="date">{{ todayDate }}</div>
              <div class="stats">
                <el-progress :percentage="todayProgress" :color="getProgressColor(todayProgress)" />
                <div class="progress-text">已完成 {{ todayCompleted }}/{{ todayTotal }} 题</div>
              </div>
            </div>
            <div class="today-tasks" v-if="reviewData.todayTasks.length">
              <el-collapse>
                <el-collapse-item title="今日任务列表">
                  <div class="task-list">
                    <el-checkbox-group v-model="completedTasks">
                      <el-checkbox 
                        v-for="task in reviewData.todayTasks" 
                        :key="task.id" 
                        :label="task.id"
                        @change="updateTaskStatus"
                      >
                        <div class="task-item">
                          <div class="task-info">
                            <div class="task-subject">{{ task.subject }}</div>
                            <div class="task-question">{{ task.question }}</div>
                            <div class="task-difficulty" :class="`difficulty-${task.difficulty}`">
                              {{ task.difficulty === 'easy' ? '简单' : task.difficulty === 'medium' ? '中等' : '困难' }}
                            </div>
                          </div>
                          <div class="task-actions">
                            <el-button type="primary" size="small" @click="viewQuestion(task.id)">
                              查看
                            </el-button>
                          </div>
                        </div>
                      </el-checkbox>
                    </el-checkbox-group>
                  </div>
                </el-collapse-item>
              </el-collapse>
            </div>
            <div class="no-tasks" v-else>
              <el-empty description="今日无复习任务" />
            </div>
          </el-card>
        </div>

        <!-- 每周计划 -->
        <div class="weekly-section">
          <h3>每周计划</h3>
          <div class="weekly-calendar">
            <div 
              v-for="day in weekDays" 
              :key="day.date"
              class="week-day"
              :class="{ 'today': day.isToday, 'has-tasks': day.taskCount > 0 }"
            >
              <div class="day-date">{{ day.date }}</div>
              <div class="day-week">{{ day.weekday }}</div>
              <div class="day-tasks" v-if="day.taskCount > 0">
                {{ day.taskCount }} 题
              </div>
              <div class="day-tasks" v-else>
                无
              </div>
            </div>
          </div>
        </div>

        <!-- 复习统计 -->
        <div class="stats-section">
          <h3>复习统计</h3>
          <el-row :gutter="20">
            <el-col :span="8">
              <el-card class="stat-card">
                <div class="stat-item">
                  <div class="stat-number">{{ reviewData.totalReviews }}</div>
                  <div class="stat-label">总复习次数</div>
                </div>
              </el-card>
            </el-col>
            <el-col :span="8">
              <el-card class="stat-card">
                <div class="stat-item">
                  <div class="stat-number">{{ reviewData.completedReviews }}</div>
                  <div class="stat-label">已完成复习</div>
                </div>
              </el-card>
            </el-col>
            <el-col :span="8">
              <el-card class="stat-card">
                <div class="stat-item">
                  <div class="stat-number">{{ reviewData.averageScore }}%</div>
                  <div class="stat-label">平均正确率</div>
                </div>
              </el-card>
            </el-col>
          </el-row>
        </div>

        <!-- 复习历史 -->
        <div class="history-section">
          <h3>复习历史</h3>
          <el-table :data="reviewData.reviewHistory" style="width: 100%">
            <el-table-column prop="date" label="日期" width="120" />
            <el-table-column prop="subject" label="科目" width="100" />
            <el-table-column prop="questions" label="复习题目" />
            <el-table-column prop="score" label="正确率" width="120">
              <template #default="scope">
                <el-progress :percentage="scope.row.score" :color="getProgressColor(scope.row.score)" />
              </template>
            </el-table-column>
            <el-table-column prop="time" label="用时" width="100" />
          </el-table>
        </div>

        <!-- 复习设置 -->
        <div class="settings-section">
          <h3>复习设置</h3>
          <el-card class="settings-card">
            <el-form :model="reviewSettings" label-width="120px">
              <el-form-item label="每日复习目标">
                <el-slider v-model="reviewSettings.dailyTarget" :min="5" :max="50" :step="5" />
                <span class="setting-value">{{ reviewSettings.dailyTarget }} 题</span>
              </el-form-item>
              <el-form-item label="复习提醒时间">
                <el-time-select v-model="reviewSettings.reminderTime" :start="'08:00'" :step="'00:30'" :end="'22:00'" />
              </el-form-item>
              <el-form-item label="复习模式">
                <el-radio-group v-model="reviewSettings.reviewMode">
                  <el-radio label="spaced">间隔重复</el-radio>
                  <el-radio label="intensive">集中复习</el-radio>
                  <el-radio label="mixed">混合模式</el-radio>
                </el-radio-group>
              </el-form-item>
              <el-form-item label="难度偏好">
                <el-checkbox-group v-model="reviewSettings.difficultyLevels">
                  <el-checkbox label="easy">简单</el-checkbox>
                  <el-checkbox label="medium">中等</el-checkbox>
                  <el-checkbox label="hard">困难</el-checkbox>
                </el-checkbox-group>
              </el-form-item>
              <el-form-item>
                <el-button type="primary" @click="saveSettings">保存设置</el-button>
              </el-form-item>
            </el-form>
          </el-card>
        </div>
      </div>

      <!-- 加载状态 -->
      <div class="loading-section" v-else>
        <el-skeleton :rows="15" animated />
      </div>
    </el-card>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Refresh } from '@element-plus/icons-vue'

export default {
  name: 'ReviewPlan',
  components: {
    Refresh
  },
  setup() {
    const router = useRouter()
    const reviewData = ref(null)
    const completedTasks = ref([])
    const reviewSettings = ref({
      dailyTarget: 15,
      reminderTime: '18:00',
      reviewMode: 'spaced',
      difficultyLevels: ['easy', 'medium', 'hard']
    })

    // 模拟复习数据
    const mockReviewData = {
      todayTasks: [
        {
          id: 1,
          subject: '数学',
          question: '函数的定义域和值域',
          difficulty: 'medium',
          completed: false
        },
        {
          id: 2,
          subject: '英语',
          question: '现在完成时的用法',
          difficulty: 'easy',
          completed: true
        },
        {
          id: 3,
          subject: '物理',
          question: '牛顿第二定律的应用',
          difficulty: 'hard',
          completed: false
        },
        {
          id: 4,
          subject: '化学',
          question: '化学反应方程式的配平',
          difficulty: 'medium',
          completed: false
        },
        {
          id: 5,
          subject: '语文',
          question: '文言文阅读',
          difficulty: 'medium',
          completed: false
        }
      ],
      totalReviews: 120,
      completedReviews: 85,
      averageScore: 75,
      reviewHistory: [
        {
          date: '2024-01-15',
          subject: '数学',
          questions: '函数、几何',
          score: 80,
          time: '25分钟'
        },
        {
          date: '2024-01-14',
          subject: '英语',
          questions: '语法、听力',
          score: 90,
          time: '20分钟'
        },
        {
          date: '2024-01-13',
          subject: '物理',
          questions: '力学、电学',
          score: 65,
          time: '30分钟'
        },
        {
          date: '2024-01-12',
          subject: '化学',
          questions: '化学反应、元素周期表',
          score: 70,
          time: '22分钟'
        },
        {
          date: '2024-01-11',
          subject: '语文',
          questions: '文言文、作文',
          score: 75,
          time: '28分钟'
        }
      ]
    }

    const todayDate = computed(() => {
      const now = new Date()
      return now.toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'long'
      })
    })

    const todayTotal = computed(() => {
      return reviewData.value?.todayTasks.length || 0
    })

    const todayCompleted = computed(() => {
      return completedTasks.value.length
    })

    const todayProgress = computed(() => {
      if (todayTotal.value === 0) return 0
      return Math.round((todayCompleted.value / todayTotal.value) * 100)
    })

    const weekDays = computed(() => {
      const days = []
      const now = new Date()
      
      for (let i = 0; i < 7; i++) {
        const date = new Date(now)
        date.setDate(now.getDate() + i)
        
        days.push({
          date: date.getDate(),
          weekday: ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][date.getDay()],
          isToday: i === 0,
          taskCount: Math.floor(Math.random() * 10) + 5
        })
      }
      
      return days
    })

    const fetchReviewData = async () => {
      try {
        // 模拟API调用
        setTimeout(() => {
          reviewData.value = mockReviewData
          // 初始化已完成任务
          completedTasks.value = mockReviewData.todayTasks
            .filter(task => task.completed)
            .map(task => task.id)
        }, 1000)

        // 实际API调用
        /*
        const response = await axios.get('/api/review-plan')
        reviewData.value = response.data.data
        completedTasks.value = response.data.data.todayTasks
          .filter(task => task.completed)
          .map(task => task.id)
        */
      } catch (error) {
        console.error('获取复习计划失败:', error)
        ElMessage.error('获取复习计划失败')
      }
    }

    const generatePlan = () => {
      ElMessage.success('正在生成新的复习计划...')
      // 模拟生成计划
      setTimeout(() => {
        ElMessage.success('复习计划生成成功')
        fetchReviewData()
      }, 1500)
    }

    const updateTaskStatus = () => {
      // 模拟更新任务状态
      console.log('更新任务状态:', completedTasks.value)
    }

    const saveSettings = () => {
      ElMessage.success('复习设置保存成功')
      // 模拟保存设置
      console.log('保存复习设置:', reviewSettings.value)
    }

    const viewQuestion = (taskId) => {
      // 跳转到题目详情
      router.push(`/question/${taskId}`)
    }

    const getProgressColor = (progress) => {
      if (progress < 30) return '#f56c6c'
      if (progress < 70) return '#e6a23c'
      return '#67c23a'
    }

    onMounted(() => {
      fetchReviewData()
    })

    return {
      router,
      reviewData,
      completedTasks,
      reviewSettings,
      todayDate,
      todayProgress,
      todayCompleted,
      todayTotal,
      weekDays,
      generatePlan,
      updateTaskStatus,
      saveSettings,
      viewQuestion,
      getProgressColor
    }
  }
}
</script>

<style lang="scss">
.review-plan-container {
  padding: 20px;
}

.review-plan-card {
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);

  .review-plan-header {
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

  .review-plan-content {
    padding: 0 20px 20px;

    .today-section,
    .weekly-section,
    .stats-section,
    .history-section,
    .settings-section {
      margin-bottom: 30px;

      h3 {
        margin: 0 0 20px 0;
        font-size: 16px;
        font-weight: bold;
        color: #303133;
        border-left: 4px solid #409eff;
        padding-left: 10px;
      }
    }

    .today-card {
      .today-info {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 20px;

        .date {
          font-size: 16px;
          font-weight: bold;
          color: #409eff;
        }

        .stats {
          flex: 1;
          margin-left: 30px;

          .progress-text {
            margin-top: 5px;
            font-size: 14px;
            color: #606266;
            text-align: right;
          }
        }
      }

      .task-list {
        .task-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 10px;
          border-bottom: 1px solid #ebeef5;

          .task-info {
            flex: 1;

            .task-subject {
              font-size: 12px;
              color: #409eff;
              margin-bottom: 5px;
            }

            .task-question {
              font-size: 14px;
              color: #303133;
              margin-bottom: 5px;
            }

            .task-difficulty {
              font-size: 12px;
              padding: 2px 8px;
              border-radius: 10px;
              display: inline-block;

              &.difficulty-easy {
                background-color: #f0f9eb;
                color: #67c23a;
              }

              &.difficulty-medium {
                background-color: #fdf6ec;
                color: #e6a23c;
              }

              &.difficulty-hard {
                background-color: #fef0f0;
                color: #f56c6c;
              }
            }
          }

          .task-actions {
            margin-left: 20px;
          }
        }
      }

      .no-tasks {
        padding: 40px 0;
        text-align: center;
      }
    }

    .weekly-calendar {
      display: flex;
      justify-content: space-between;
      gap: 10px;

      .week-day {
        flex: 1;
        text-align: center;
        padding: 15px;
        border-radius: 8px;
        background-color: #f5f7fa;
        transition: all 0.3s;

        &:hover {
          transform: translateY(-5px);
          box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
        }

        &.today {
          background-color: #ecf5ff;
          border: 1px solid #d9ecff;
        }

        &.has-tasks {
          background-color: #f0f9eb;
          border: 1px solid #e1f5d0;
        }

        .day-date {
          font-size: 18px;
          font-weight: bold;
          color: #303133;
          margin-bottom: 5px;
        }

        .day-week {
          font-size: 14px;
          color: #606266;
          margin-bottom: 10px;
        }

        .day-tasks {
          font-size: 12px;
          color: #909399;
        }
      }
    }

    .stat-card {
      transition: transform 0.3s, box-shadow 0.3s;

      &:hover {
        transform: translateY(-5px);
        box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
      }

      .stat-item {
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

    .settings-card {
      .setting-value {
        margin-left: 10px;
        color: #409eff;
        font-weight: bold;
      }
    }
  }

  .loading-section {
    padding: 20px;
  }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .review-plan-container {
    padding: 10px;
  }

  .review-plan-card {
    .review-plan-content {
      padding: 0 10px 10px;

      .today-section {
        .today-card {
          .today-info {
            flex-direction: column;
            align-items: flex-start;

            .stats {
              margin-left: 0;
              margin-top: 15px;
              width: 100%;
            }
          }

          .task-item {
            flex-direction: column;
            align-items: flex-start;

            .task-actions {
              margin-left: 0;
              margin-top: 10px;
            }
          }
        }
      }

      .weekly-calendar {
        flex-wrap: wrap;

        .week-day {
          flex: 0 0 calc(33.333% - 7px);
          margin-bottom: 10px;
        }
      }

      .stats-section {
        .el-row {
          .el-col {
            margin-bottom: 10px;
          }
        }
      }

      .history-section {
        .el-table {
          font-size: 12px;

          .el-table__cell {
            padding: 8px;
          }
        }
      }

      .settings-section {
        .settings-card {
          .el-form {
            label-width: 100px;

            .el-form-item {
              margin-bottom: 15px;
            }
          }
        }
      }
    }
  }
}
</style>