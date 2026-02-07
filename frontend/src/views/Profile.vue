<template>
  <div class="profile-container">
    <el-card shadow="hover" class="profile-card">
      <template #header>
        <div class="profile-header">
          <el-button type="primary" plain @click="router.back()">
            返回
          </el-button>
          <h2>个人中心</h2>
          <el-button type="primary" @click="editProfile">
            <el-icon><Edit /></el-icon> 编辑资料
          </el-button>
        </div>
      </template>

      <div class="profile-content" v-if="userInfo">
        <!-- 用户信息 -->
        <div class="user-info-section">
          <div class="user-avatar">
            <img :src="userInfo.avatar" alt="用户头像" />
            <el-button type="primary" size="small" class="avatar-upload-btn">
              <el-icon><Upload /></el-icon> 更换头像
            </el-button>
          </div>
          <div class="user-details">
            <h3>{{ userInfo.username }}</h3>
            <p class="user-email">{{ userInfo.email }}</p>
            <div class="user-meta">
              <span class="user-level">等级 {{ userInfo.level }}</span>
              <span class="user-exp">经验值 {{ userInfo.experience }}/{{ userInfo.nextLevelExperience }}</span>
              <el-progress :percentage="userInfo.experience / userInfo.nextLevelExperience * 100" :color="'#409eff'" />
            </div>
          </div>
        </div>

        <!-- 学习统计 -->
        <div class="stats-section">
          <h3>学习统计</h3>
          <el-row :gutter="20">
            <el-col :span="6">
              <el-card class="stat-card">
                <div class="stat-item">
                  <div class="stat-number">{{ userInfo.stats.totalQuestions }}</div>
                  <div class="stat-label">总错题数</div>
                </div>
              </el-card>
            </el-col>
            <el-col :span="6">
              <el-card class="stat-card">
                <div class="stat-item">
                  <div class="stat-number">{{ userInfo.stats.masteredQuestions }}</div>
                  <div class="stat-label">已掌握</div>
                </div>
              </el-card>
            </el-col>
            <el-col :span="6">
              <el-card class="stat-card">
                <div class="stat-item">
                  <div class="stat-number">{{ userInfo.stats.reviewCount }}</div>
                  <div class="stat-label">复习次数</div>
                </div>
              </el-card>
            </el-col>
            <el-col :span="6">
              <el-card class="stat-card">
                <div class="stat-item">
                  <div class="stat-number">{{ userInfo.stats.averageScore }}%</div>
                  <div class="stat-label">平均正确率</div>
                </div>
              </el-card>
            </el-col>
          </el-row>
        </div>

        <!-- 学习时长 -->
        <div class="study-time-section">
          <h3>学习时长</h3>
          <el-card class="time-card">
            <div class="time-stats">
              <div class="time-item">
                <div class="time-number">{{ userInfo.studyTime.totalHours }}</div>
                <div class="time-label">总学习时长（小时）</div>
              </div>
              <div class="time-item">
                <div class="time-number">{{ userInfo.studyTime.weekHours }}</div>
                <div class="time-label">本周学习时长（小时）</div>
              </div>
              <div class="time-item">
                <div class="time-number">{{ userInfo.studyTime.averageDaily }}</div>
                <div class="time-label">日均学习时长（分钟）</div>
              </div>
            </div>
            <div class="time-chart">
              <div ref="timeChartRef" class="chart" style="width: 100%; height: 200px;"></div>
            </div>
          </el-card>
        </div>

        <!-- 成就徽章 -->
        <div class="achievements-section">
          <h3>成就徽章</h3>
          <div class="badges-container">
            <div 
              v-for="badge in userInfo.achievements" 
              :key="badge.id"
              class="badge-item"
              :class="{ 'unlocked': badge.unlocked }"
            >
              <div class="badge-icon" :style="{ backgroundColor: badge.color }">
                <el-icon>{{ badge.icon }}</el-icon>
              </div>
              <div class="badge-info">
                <h4>{{ badge.name }}</h4>
                <p>{{ badge.description }}</p>
                <div class="badge-progress" v-if="!badge.unlocked">
                  <el-progress :percentage="badge.progress" :color="badge.color" />
                  <span class="progress-text">{{ badge.current }}/{{ badge.target }}</span>
                </div>
                <div class="badge-date" v-else>
                  获得于 {{ badge.unlockedDate }}
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 学习记录 -->
        <div class="activity-section">
          <h3>学习记录</h3>
          <el-card class="activity-card">
            <el-timeline>
              <el-timeline-item
                v-for="(activity, index) in userInfo.recentActivities"
                :key="index"
                :type="activity.type"
                :timestamp="activity.time"
              >
                <el-card>
                  <h4>{{ activity.title }}</h4>
                  <p>{{ activity.description }}</p>
                </el-card>
              </el-timeline-item>
            </el-timeline>
          </el-card>
        </div>

        <!-- 账户设置 -->
        <div class="account-section">
          <h3>账户设置</h3>
          <el-card class="account-card">
            <el-list>
              <el-list-item>
                <template #prefix>
                  <el-icon class="list-icon"><Lock /></el-icon>
                </template>
                <span>修改密码</span>
                <template #suffix>
                  <el-button type="text" @click="changePassword">修改</el-button>
                </template>
              </el-list-item>
              <el-list-item>
                <template #prefix>
                  <el-icon class="list-icon"><Phone /></el-icon>
                </template>
                <span>绑定手机</span>
                <template #suffix>
                  <span class="status">{{ userInfo.phone ? '已绑定' : '未绑定' }}</span>
                  <el-button type="text" @click="bindPhone">
                    {{ userInfo.phone ? '更换' : '绑定' }}
                  </el-button>
                </template>
              </el-list-item>
              <el-list-item>
                <template #prefix>
                  <el-icon class="list-icon"><Notification /></el-icon>
                </template>
                <span>通知设置</span>
                <template #suffix>
                  <el-switch v-model="notificationSettings.enabled" />
                </template>
              </el-list-item>
              <el-list-item>
                <template #prefix>
                  <el-icon class="list-icon"><Delete /></el-icon>
                </template>
                <span class="danger-text">注销账户</span>
                <template #suffix>
                  <el-button type="text" class="danger-btn" @click="deleteAccount">注销</el-button>
                </template>
              </el-list-item>
            </el-list>
          </el-card>
        </div>
      </div>

      <!-- 加载状态 -->
      <div class="loading-section" v-else>
        <el-skeleton :rows="20" animated />
      </div>
    </el-card>
  </div>
</template>

<script>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { Edit, Upload, Lock, Phone, Notification, Delete, Trophy, Star, Medal, Calendar } from '@element-plus/icons-vue'
import * as echarts from 'echarts'
import { ElMessage, ElMessageBox } from 'element-plus'

export default {
  name: 'Profile',
  components: {
    Edit,
    Upload,
    Lock,
    Phone,
    Notification,
    Delete,
    Trophy,
    Star,
    Medal,
    Calendar
  },
  setup() {
    const router = useRouter()
    const userInfo = ref(null)
    const timeChartRef = ref(null)
    const timeChart = ref(null)
    const notificationSettings = ref({ enabled: true })

    // 模拟用户数据
    const mockUserInfo = {
      id: 1,
      username: '学生用户',
      email: 'student@example.com',
      avatar: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=user%20avatar%20portrait%20friendly%20student&image_size=square',
      level: 5,
      experience: 350,
      nextLevelExperience: 500,
      stats: {
        totalQuestions: 120,
        masteredQuestions: 85,
        reviewCount: 200,
        averageScore: 75
      },
      studyTime: {
        totalHours: 48,
        weekHours: 8,
        averageDaily: 60,
        dailyData: [2, 3, 1, 4, 2, 5, 3]
      },
      achievements: [
        {
          id: 1,
          name: '初学者',
          description: '完成第一次练习',
          icon: 'Star',
          color: '#e6a23c',
          unlocked: true,
          unlockedDate: '2024-01-01'
        },
        {
          id: 2,
          name: '坚持不懈',
          description: '连续学习7天',
          icon: 'Calendar',
          color: '#409eff',
          unlocked: true,
          unlockedDate: '2024-01-08'
        },
        {
          id: 3,
          name: '学霸',
          description: '正确率达到90%以上',
          icon: 'Trophy',
          color: '#f56c6c',
          unlocked: false,
          progress: 75,
          current: 15,
          target: 20
        },
        {
          id: 4,
          name: '收藏家',
          description: '收集100道错题',
          icon: 'Medal',
          color: '#67c23a',
          unlocked: false,
          progress: 60,
          current: 60,
          target: 100
        }
      ],
      recentActivities: [
        {
          id: 1,
          title: '完成模拟考试',
          description: '获得了85分的好成绩',
          type: 'success',
          time: '2024-01-15 14:30'
        },
        {
          id: 2,
          title: '掌握新知识点',
          description: '成功掌握了函数的定义域和值域',
          type: 'primary',
          time: '2024-01-15 10:15'
        },
        {
          id: 3,
          title: '上传错题',
          description: '上传了5道数学错题',
          type: 'info',
          time: '2024-01-14 16:45'
        },
        {
          id: 4,
          title: '复习计划完成',
          description: '完成了本周的复习计划',
          type: 'warning',
          time: '2024-01-14 09:30'
        }
      ],
      phone: '138****1234'
    }

    const fetchUserInfo = async () => {
      try {
        // 模拟API调用
        setTimeout(() => {
          userInfo.value = mockUserInfo
          initTimeChart()
        }, 1000)

        // 实际API调用
        /*
        const response = await axios.get('/api/user/profile')
        userInfo.value = response.data.data
        initTimeChart()
        */
      } catch (error) {
        console.error('获取用户信息失败:', error)
        ElMessage.error('获取用户信息失败')
      }
    }

    const initTimeChart = () => {
      if (timeChartRef.value) {
        timeChart.value = echarts.init(timeChartRef.value)
        const option = {
          title: {
            text: '本周学习时长',
            left: 'center'
          },
          tooltip: {
            trigger: 'axis',
            formatter: '{b}: {c} 小时'
          },
          xAxis: {
            type: 'category',
            data: ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
          },
          yAxis: {
            type: 'value',
            name: '小时'
          },
          series: [
            {
              data: userInfo.value.studyTime.dailyData,
              type: 'bar',
              itemStyle: {
                color: '#409eff'
              },
              smooth: true
            }
          ]
        }
        timeChart.value.setOption(option)
      }
    }

    const handleResize = () => {
      timeChart.value?.resize()
    }

    const editProfile = () => {
      ElMessage.success('编辑资料功能正在开发中')
    }

    const changePassword = () => {
      ElMessage.success('修改密码功能正在开发中')
    }

    const bindPhone = () => {
      ElMessage.success('绑定手机功能正在开发中')
    }

    const deleteAccount = () => {
      ElMessageBox.confirm('确定要注销账户吗？此操作不可恢复。', '警告', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        ElMessage.success('账户注销功能正在开发中')
      }).catch(() => {
        // 取消操作
      })
    }

    onMounted(() => {
      fetchUserInfo()
      window.addEventListener('resize', handleResize)
    })

    onUnmounted(() => {
      window.removeEventListener('resize', handleResize)
      timeChart.value?.dispose()
    })

    return {
      router,
      userInfo,
      timeChartRef,
      notificationSettings,
      editProfile,
      changePassword,
      bindPhone,
      deleteAccount
    }
  }
}
</script>

<style lang="scss">
.profile-container {
  padding: 20px;
}

.profile-card {
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);

  .profile-header {
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

  .profile-content {
    padding: 0 20px 20px;

    .user-info-section {
      display: flex;
      align-items: center;
      margin-bottom: 40px;
      padding-bottom: 30px;
      border-bottom: 1px solid #ebeef5;

      .user-avatar {
        position: relative;
        margin-right: 30px;

        img {
          width: 120px;
          height: 120px;
          border-radius: 50%;
          object-fit: cover;
          border: 3px solid #409eff;
        }

        .avatar-upload-btn {
          position: absolute;
          bottom: 0;
          right: 0;
          transform: translate(25%, 25%);
        }
      }

      .user-details {
        flex: 1;

        h3 {
          margin: 0 0 10px 0;
          font-size: 24px;
          font-weight: bold;
          color: #303133;
        }

        .user-email {
          margin: 0 0 20px 0;
          font-size: 14px;
          color: #606266;
        }

        .user-meta {
          .user-level {
            display: inline-block;
            padding: 2px 10px;
            background-color: #ecf5ff;
            color: #409eff;
            border-radius: 10px;
            font-size: 14px;
            margin-right: 20px;
          }

          .user-exp {
            display: block;
            font-size: 14px;
            color: #606266;
            margin-top: 10px;
            margin-bottom: 10px;
          }
        }
      }
    }

    .stats-section,
    .study-time-section,
    .achievements-section,
    .activity-section,
    .account-section {
      margin-bottom: 40px;

      h3 {
        margin: 0 0 20px 0;
        font-size: 16px;
        font-weight: bold;
        color: #303133;
        border-left: 4px solid #409eff;
        padding-left: 10px;
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

    .time-card {
      .time-stats {
        display: flex;
        justify-content: space-around;
        margin-bottom: 30px;

        .time-item {
          text-align: center;

          .time-number {
            font-size: 24px;
            font-weight: bold;
            color: #409eff;
            margin-bottom: 5px;
          }

          .time-label {
            font-size: 14px;
            color: #606266;
          }
        }
      }

      .time-chart {
        .chart {
          border: 1px solid #ebeef5;
          border-radius: 8px;
        }
      }
    }

    .badges-container {
      display: flex;
      flex-wrap: wrap;
      gap: 20px;

      .badge-item {
        flex: 0 0 calc(50% - 10px);
        display: flex;
        align-items: center;
        padding: 20px;
        border-radius: 8px;
        background-color: #f5f7fa;
        transition: all 0.3s;

        &:hover {
          transform: translateY(-5px);
          box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
        }

        &.unlocked {
          background-color: #f0f9eb;
          border: 1px solid #e1f5d0;
        }

        .badge-icon {
          width: 60px;
          height: 60px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-right: 20px;
          font-size: 24px;
          color: white;
        }

        .badge-info {
          flex: 1;

          h4 {
            margin: 0 0 5px 0;
            font-size: 16px;
            font-weight: bold;
            color: #303133;
          }

          p {
            margin: 0 0 10px 0;
            font-size: 14px;
            color: #606266;
          }

          .badge-progress {
            margin-top: 10px;

            .progress-text {
              display: block;
              font-size: 12px;
              color: #909399;
              text-align: right;
              margin-top: 5px;
            }
          }

          .badge-date {
            font-size: 12px;
            color: #909399;
            margin-top: 10px;
          }
        }
      }
    }

    .activity-card {
      .el-timeline {
        .el-timeline-item {
          margin-bottom: 20px;
        }
      }
    }

    .account-card {
      .el-list {
        .el-list-item {
          border-bottom: 1px solid #ebeef5;

          &:last-child {
            border-bottom: none;
          }

          .list-icon {
            font-size: 18px;
            color: #409eff;
          }

          .status {
            margin-right: 20px;
            font-size: 14px;
            color: #67c23a;
          }

          .danger-text {
            color: #f56c6c;
          }

          .danger-btn {
            color: #f56c6c;
          }
        }
      }
    }
  }

  .loading-section {
    padding: 20px;
  }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .profile-container {
    padding: 10px;
  }

  .profile-card {
    .profile-content {
      padding: 0 10px 10px;

      .user-info-section {
        flex-direction: column;
        align-items: center;
        text-align: center;

        .user-avatar {
          margin-right: 0;
          margin-bottom: 20px;
        }

        .user-details {
          width: 100%;
        }
      }

      .stats-section {
        .el-row {
          .el-col {
            margin-bottom: 10px;
          }
        }
      }

      .time-card {
        .time-stats {
          flex-direction: column;
          gap: 10px;

          .time-item {
            margin-bottom: 10px;
          }
        }

        .time-chart {
          .chart {
            height: 200px !important;
          }
        }
      }

      .badges-container {
        .badge-item {
          flex: 0 0 100%;
        }
      }

      .activity-card {
        .el-timeline {
          .el-timeline-item {
            margin-bottom: 15px;
          }
        }
      }
    }
  }
}
</style>