<template>
  <div class="settings-container">
    <el-card shadow="hover" class="settings-card">
      <template #header>
        <div class="settings-header">
          <el-button type="primary" plain @click="router.back()">
            返回
          </el-button>
          <h2>设置</h2>
          <el-button type="primary" @click="saveAllSettings">
            <el-icon><Check /></el-icon> 保存所有设置
          </el-button>
        </div>
      </template>

      <div class="settings-content">
        <!-- 应用设置 -->
        <div class="setting-section">
          <h3>应用设置</h3>
          <el-card class="section-card">
            <el-form :model="appSettings" label-width="150px">
              <el-form-item label="语言">
                <el-select v-model="appSettings.language" placeholder="选择语言">
                  <el-option label="简体中文" value="zh-CN" />
                  <el-option label="English" value="en-US" />
                </el-select>
              </el-form-item>
              <el-form-item label="主题">
                <el-select v-model="appSettings.theme" placeholder="选择主题">
                  <el-option label="默认" value="default" />
                  <el-option label="深色" value="dark" />
                  <el-option label="浅色" value="light" />
                </el-select>
              </el-form-item>
              <el-form-item label="字体大小">
                <el-slider v-model="appSettings.fontSize" :min="12" :max="18" :step="1" />
                <span class="setting-value">{{ appSettings.fontSize }}px</span>
              </el-form-item>
              <el-form-item label="动画效果">
                <el-switch v-model="appSettings.animation" />
              </el-form-item>
              <el-form-item label="自动保存">
                <el-switch v-model="appSettings.autoSave" />
              </el-form-item>
            </el-form>
          </el-card>
        </div>

        <!-- 通知设置 -->
        <div class="setting-section">
          <h3>通知设置</h3>
          <el-card class="section-card">
            <el-form :model="notificationSettings" label-width="150px">
              <el-form-item label="启用通知">
                <el-switch v-model="notificationSettings.enabled" />
              </el-form-item>
              <el-form-item label="复习提醒">
                <el-switch v-model="notificationSettings.reviewReminder" />
              </el-form-item>
              <el-form-item label="提醒时间">
                <el-time-select v-model="notificationSettings.reminderTime" :start="'08:00'" :step="'00:30'" :end="'22:00'" />
              </el-form-item>
              <el-form-item label="练习完成通知">
                <el-switch v-model="notificationSettings.practiceComplete" />
              </el-form-item>
              <el-form-item label="成就解锁通知">
                <el-switch v-model="notificationSettings.achievementUnlock" />
              </el-form-item>
              <el-form-item label="系统通知">
                <el-switch v-model="notificationSettings.systemNotification" />
              </el-form-item>
            </el-form>
          </el-card>
        </div>

        <!-- 数据管理 -->
        <div class="setting-section">
          <h3>数据管理</h3>
          <el-card class="section-card">
            <el-form label-width="150px">
              <el-form-item label="数据备份">
                <el-button type="primary" @click="backupData">
                  <el-icon><Download /></el-icon> 导出数据
                </el-button>
                <p class="help-text">将所有错题数据导出为JSON文件</p>
              </el-form-item>
              <el-form-item label="数据恢复">
                <el-upload
                  class="upload-btn"
                  action="#"
                  :auto-upload="false"
                  :on-change="handleFileUpload"
                  accept=".json"
                >
                  <el-button type="primary">
                    <el-icon><Upload /></el-icon> 导入数据
                  </el-button>
                </el-upload>
                <p class="help-text">从JSON文件导入错题数据</p>
              </el-form-item>
              <el-form-item label="清除数据">
                <el-button type="danger" @click="clearData">
                  <el-icon><Delete /></el-icon> 清除所有数据
                </el-button>
                <p class="help-text">此操作不可恢复，请谨慎操作</p>
              </el-form-item>
              <el-form-item label="数据同步">
                <el-switch v-model="syncSettings.enabled" />
                <p class="help-text">启用云端同步功能</p>
              </el-form-item>
              <el-form-item label="同步频率">
                <el-select v-model="syncSettings.frequency" placeholder="选择同步频率">
                  <el-option label="每次修改" value="realtime" />
                  <el-option label="每小时" value="hourly" />
                  <el-option label="每天" value="daily" />
                </el-select>
              </el-form-item>
            </el-form>
          </el-card>
        </div>

        <!-- 学习设置 -->
        <div class="setting-section">
          <h3>学习设置</h3>
          <el-card class="section-card">
            <el-form :model="studySettings" label-width="150px">
              <el-form-item label="每日学习目标">
                <el-input-number v-model="studySettings.dailyGoal" :min="5" :max="100" :step="5" />
                <span class="setting-value">题/天</span>
              </el-form-item>
              <el-form-item label="复习间隔">
                <el-select v-model="studySettings.reviewInterval" placeholder="选择复习间隔">
                  <el-option label="1天" value="1" />
                  <el-option label="3天" value="3" />
                  <el-option label="7天" value="7" />
                  <el-option label="14天" value="14" />
                </el-select>
              </el-form-item>
              <el-form-item label="题目排序">
                <el-select v-model="studySettings.questionSort" placeholder="选择题目排序">
                  <el-option label="时间倒序" value="time_desc" />
                  <el-option label="时间正序" value="time_asc" />
                  <el-option label="难度倒序" value="difficulty_desc" />
                  <el-option label="难度正序" value="difficulty_asc" />
                </el-select>
              </el-form-item>
              <el-form-item label="自动标记已掌握">
                <el-switch v-model="studySettings.autoMarkMastered" />
              </el-form-item>
              <el-form-item label="掌握度阈值">
                <el-slider v-model="studySettings.masteryThreshold" :min="60" :max="90" :step="5" />
                <span class="setting-value">{{ studySettings.masteryThreshold }}%</span>
              </el-form-item>
            </el-form>
          </el-card>
        </div>

        <!-- 关于 -->
        <div class="setting-section">
          <h3>关于</h3>
          <el-card class="section-card">
            <div class="about-content">
              <div class="app-info">
                <h4>错题管理系统</h4>
                <p class="version">版本 1.0.0</p>
                <p class="description">
                  一个专为学生设计的错题管理和学习分析系统，帮助学生更高效地管理错题，提高学习成绩。
                </p>
              </div>
              <div class="developer-info">
                <h5>开发者信息</h5>
                <p>邮箱: support@example.com</p>
                <p>网站: https://example.com</p>
              </div>
              <div class="copyright">
                <p>© 2024 错题管理系统 版权所有</p>
              </div>
              <div class="actions">
                <el-button type="primary" @click="checkUpdate">检查更新</el-button>
                <el-button @click="feedback">意见反馈</el-button>
                <el-button @click="privacyPolicy">隐私政策</el-button>
              </div>
            </div>
          </el-card>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Check, Download, Upload, Delete } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'

export default {
  name: 'Settings',
  components: {
    Check,
    Download,
    Upload,
    Delete
  },
  setup() {
    const router = useRouter()
    const appSettings = ref({
      language: 'zh-CN',
      theme: 'default',
      fontSize: 14,
      animation: true,
      autoSave: true
    })
    const notificationSettings = ref({
      enabled: true,
      reviewReminder: true,
      reminderTime: '18:00',
      practiceComplete: true,
      achievementUnlock: true,
      systemNotification: true
    })
    const syncSettings = ref({
      enabled: true,
      frequency: 'daily'
    })
    const studySettings = ref({
      dailyGoal: 15,
      reviewInterval: '3',
      questionSort: 'time_desc',
      autoMarkMastered: true,
      masteryThreshold: 80
    })

    const saveAllSettings = () => {
      // 模拟保存设置
      setTimeout(() => {
        ElMessage.success('所有设置已保存')
      }, 1000)
    }

    const backupData = () => {
      ElMessage.success('数据导出功能正在开发中')
    }

    const handleFileUpload = (file) => {
      ElMessage.success('数据导入功能正在开发中')
    }

    const clearData = () => {
      ElMessageBox.confirm('确定要清除所有数据吗？此操作不可恢复。', '警告', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        ElMessage.success('数据清除功能正在开发中')
      }).catch(() => {
        // 取消操作
      })
    }

    const checkUpdate = () => {
      ElMessage.success('当前已是最新版本')
    }

    const feedback = () => {
      ElMessage.success('意见反馈功能正在开发中')
    }

    const privacyPolicy = () => {
      ElMessage.success('隐私政策功能正在开发中')
    }

    onMounted(() => {
      // 可以在这里加载用户的保存设置
    })

    return {
      router,
      appSettings,
      notificationSettings,
      syncSettings,
      studySettings,
      saveAllSettings,
      backupData,
      handleFileUpload,
      clearData,
      checkUpdate,
      feedback,
      privacyPolicy
    }
  }
}
</script>

<style lang="scss">
.settings-container {
  padding: 20px;
}

.settings-card {
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);

  .settings-header {
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

  .settings-content {
    .setting-section {
      margin-bottom: 40px;

      h3 {
        margin: 0 0 20px 0;
        font-size: 16px;
        font-weight: bold;
        color: #303133;
        border-left: 4px solid #409eff;
        padding-left: 10px;
      }

      .section-card {
        .help-text {
          margin: 10px 0 0 0;
          font-size: 12px;
          color: #909399;
        }

        .setting-value {
          margin-left: 10px;
          color: #409eff;
          font-weight: bold;
        }

        .upload-btn {
          margin-right: 20px;
        }

        .about-content {
          .app-info {
            margin-bottom: 30px;

            h4 {
              margin: 0 0 10px 0;
              font-size: 18px;
              font-weight: bold;
              color: #303133;
            }

            .version {
              margin: 0 0 15px 0;
              font-size: 14px;
              color: #409eff;
            }

            .description {
              margin: 0;
              font-size: 14px;
              color: #606266;
              line-height: 1.5;
            }
          }

          .developer-info {
            margin-bottom: 20px;

            h5 {
              margin: 0 0 10px 0;
              font-size: 16px;
              font-weight: bold;
              color: #303133;
            }

            p {
              margin: 5px 0;
              font-size: 14px;
              color: #606266;
            }
          }

          .copyright {
            margin-bottom: 30px;

            p {
              margin: 0;
              font-size: 14px;
              color: #909399;
            }
          }

          .actions {
            display: flex;
            gap: 20px;
          }
        }
      }
    }
  }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .settings-container {
    padding: 10px;
  }

  .settings-card {
    .settings-content {
      .setting-section {
        .section-card {
          .el-form {
            label-width: 120px;

            .el-form-item {
              margin-bottom: 15px;
            }
          }

          .about-content {
            .actions {
              flex-direction: column;
              gap: 10px;

              .el-button {
                width: 100%;
              }
            }
          }
        }
      }
    }
  }
}
</style>