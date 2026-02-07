<template>
  <div class="home-container">
    <el-card shadow="hover" class="home-card">
      <template #header>
        <div class="home-header">
          <h2>欢迎使用错题本系统</h2>
          <p>让学习更高效，让错题不再错</p>
        </div>
      </template>

      <div class="home-content">
        <!-- 统计概览 -->
        <el-row :gutter="20" class="stats-row">
          <el-col :span="6" class="stats-col">
            <el-card class="stats-card" @click="router.push('/questions')">
              <div class="stats-item">
                <el-icon class="stats-icon"><Document /></el-icon>
                <div class="stats-info">
                  <div class="stats-number">{{ wrongQuestionCount }}</div>
                  <div class="stats-label">错题总数</div>
                </div>
              </div>
            </el-card>
          </el-col>
          <el-col :span="6" class="stats-col">
            <el-card class="stats-card" @click="router.push('/review')">
              <div class="stats-item">
                <el-icon class="stats-icon"><Timer /></el-icon>
                <div class="stats-info">
                  <div class="stats-number">{{ reviewPlanCount }}</div>
                  <div class="stats-label">复习计划</div>
                </div>
              </div>
            </el-card>
          </el-col>
          <el-col :span="6" class="stats-col">
            <el-card class="stats-card" @click="router.push('/analysis')">
              <div class="stats-item">
                <el-icon class="stats-icon"><DataAnalysis /></el-icon>
                <div class="stats-info">
                  <div class="stats-number">{{ weakPointsCount }}</div>
                  <div class="stats-label">薄弱环节</div>
                </div>
              </div>
            </el-card>
          </el-col>
          <el-col :span="6" class="stats-col">
            <el-card class="stats-card" @click="router.push('/practice')">
              <div class="stats-item">
                <el-icon class="stats-icon"><Checked /></el-icon>
                <div class="stats-info">
                  <div class="stats-number">{{ masteredCount }}</div>
                  <div class="stats-label">已掌握</div>
                </div>
              </div>
            </el-card>
          </el-col>
        </el-row>

        <!-- 快捷操作 -->
        <div class="quick-actions">
          <h3>快捷操作</h3>
          <el-row :gutter="20" class="actions-row">
            <el-col :span="6" class="action-col">
              <el-card class="action-card" @click="router.push('/upload')">
                <div class="action-item">
                  <el-icon class="action-icon"><Upload /></el-icon>
                  <span class="action-label">上传错题</span>
                </div>
              </el-card>
            </el-col>
            <el-col :span="6" class="action-col">
              <el-card class="action-card" @click="router.push('/questions')">
                <div class="action-item">
                  <el-icon class="action-icon"><Document /></el-icon>
                  <span class="action-label">错题列表</span>
                </div>
              </el-card>
            </el-col>
            <el-col :span="6" class="action-col">
              <el-card class="action-card" @click="router.push('/analysis')">
                <div class="action-item">
                  <el-icon class="action-icon"><DataAnalysis /></el-icon>
                  <span class="action-label">分析报告</span>
                </div>
              </el-card>
            </el-col>
            <el-col :span="6" class="action-col">
              <el-card class="action-card" @click="router.push('/review')">
                <div class="action-item">
                  <el-icon class="action-icon"><Timer /></el-icon>
                  <span class="action-label">复习计划</span>
                </div>
              </el-card>
            </el-col>
          </el-row>
        </div>

        <!-- 最近活动 -->
        <div class="recent-activities">
          <h3>最近活动</h3>
          <el-timeline>
            <el-timeline-item
              v-for="(activity, index) in recentActivities"
              :key="index"
              :timestamp="activity.time"
              type="primary"
              placement="top"
            >
              <el-card>
                <h4>{{ activity.title }}</h4>
                <p>{{ activity.description }}</p>
              </el-card>
            </el-timeline-item>
          </el-timeline>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Document, Timer, DataAnalysis, Checked, Upload } from '@element-plus/icons-vue'

export default {
  name: 'Home',
  components: {
    Document,
    Timer,
    DataAnalysis,
    Checked,
    Upload
  },
  setup() {
    const router = useRouter()
    
    // 统计数据（模拟）
    const wrongQuestionCount = ref(0)
    const reviewPlanCount = ref(0)
    const weakPointsCount = ref(0)
    const masteredCount = ref(0)
    
    // 最近活动（模拟）
    const recentActivities = ref([
      {
        title: '登录系统',
        description: '成功登录错题本系统',
        time: new Date().toLocaleString()
      }
    ])
    
    // 模拟加载数据
    onMounted(() => {
      // 实际项目中，这里会从API获取数据
      setTimeout(() => {
        wrongQuestionCount.value = 12
        reviewPlanCount.value = 3
        weakPointsCount.value = 5
        masteredCount.value = 7
      }, 500)
    })
    
    return {
      router,
      wrongQuestionCount,
      reviewPlanCount,
      weakPointsCount,
      masteredCount,
      recentActivities
    }
  }
}
</script>

<style lang="scss">
.home-container {
  padding: 20px;
}

.home-card {
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.home-header {
  text-align: center;
  margin-bottom: 30px;

  h2 {
    margin: 0 0 10px 0;
    font-size: 24px;
    font-weight: bold;
    color: #409eff;
  }

  p {
    margin: 0;
    font-size: 14px;
    color: #606266;
  }
}

.home-content {
  padding: 0 20px 20px;
}

.stats-row {
  margin-bottom: 30px;
}

.stats-col {
  .stats-card {
    border-radius: 8px;
    transition: transform 0.3s, box-shadow 0.3s;

    &:hover {
      transform: translateY(-5px);
      box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
    }

    .stats-item {
      display: flex;
      align-items: center;
      gap: 15px;

      .stats-icon {
        font-size: 24px;
        color: #409eff;
      }

      .stats-info {
        flex: 1;

        .stats-number {
          font-size: 20px;
          font-weight: bold;
          color: #303133;
        }

        .stats-label {
          font-size: 14px;
          color: #606266;
          margin-top: 5px;
        }
      }
    }
  }
}

.quick-actions {
  margin-bottom: 30px;

  h3 {
    margin: 0 0 20px 0;
    font-size: 18px;
    font-weight: bold;
    color: #303133;
  }
}

.actions-row {
  .action-col {
    .action-card {
      border-radius: 8px;
      cursor: pointer;
      transition: transform 0.3s, box-shadow 0.3s;

      &:hover {
        transform: translateY(-5px);
        box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
        border-color: #409eff;
      }

      .action-item {
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 20px 0;

        .action-icon {
          font-size: 32px;
          color: #409eff;
          margin-bottom: 10px;
        }

        .action-label {
          font-size: 14px;
          color: #303133;
        }
      }
    }
  }
}

.recent-activities {
  h3 {
    margin: 0 0 20px 0;
    font-size: 18px;
    font-weight: bold;
    color: #303133;
  }

  .el-timeline {
    .el-timeline-item {
      .el-card {
        margin-top: 10px;
        border-radius: 8px;

        h4 {
          margin: 0 0 10px 0;
          font-size: 16px;
          font-weight: bold;
          color: #303133;
        }

        p {
          margin: 0;
          font-size: 14px;
          color: #606266;
        }
      }
    }
  }
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .stats-col,
  .action-col {
    flex: 1;
    min-width: 150px;
  }
}

@media (max-width: 768px) {
  .home-container {
    padding: 10px;
  }

  .home-card {
    .home-content {
      padding: 0 10px 10px;
    }
  }

  .stats-row,
  .actions-row {
    .el-col {
      margin-bottom: 10px;
    }
  }
}
</style>
