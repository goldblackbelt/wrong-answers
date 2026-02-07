<template>
  <div class="analysis-container">
    <el-card shadow="hover" class="analysis-card">
      <template #header>
        <div class="analysis-header">
          <el-button type="primary" plain @click="router.back()">
            返回
          </el-button>
          <h2>分析报告</h2>
          <el-button type="primary" @click="exportReport">
            <el-icon><Download /></el-icon> 导出报告
          </el-button>
        </div>
      </template>

      <div class="analysis-content" v-if="analysisData">
        <!-- 基本统计 -->
        <div class="stats-section">
          <h3>学习统计</h3>
          <el-row :gutter="20">
            <el-col :span="6">
              <el-card class="stat-card">
                <div class="stat-item">
                  <div class="stat-number">{{ analysisData.totalQuestions }}</div>
                  <div class="stat-label">错题总数</div>
                </div>
              </el-card>
            </el-col>
            <el-col :span="6">
              <el-card class="stat-card">
                <div class="stat-item">
                  <div class="stat-number">{{ analysisData.masteredQuestions }}</div>
                  <div class="stat-label">已掌握</div>
                </div>
              </el-card>
            </el-col>
            <el-col :span="6">
              <el-card class="stat-card">
                <div class="stat-item">
                  <div class="stat-number">{{ analysisData.reviewCount }}</div>
                  <div class="stat-label">复习次数</div>
                </div>
              </el-card>
            </el-col>
            <el-col :span="6">
              <el-card class="stat-card">
                <div class="stat-item">
                  <div class="stat-number">{{ analysisData.averageMastery }}%</div>
                  <div class="stat-label">平均掌握度</div>
                </div>
              </el-card>
            </el-col>
          </el-row>
        </div>

        <!-- 错题分类 -->
        <div class="category-section">
          <h3>错题分类</h3>
          <div class="chart-container">
            <div ref="categoryChartRef" class="chart" style="width: 100%; height: 400px;"></div>
          </div>
        </div>

        <!-- 知识点掌握度 -->
        <div class="knowledge-section">
          <h3>知识点掌握度</h3>
          <div class="chart-container">
            <div ref="knowledgeChartRef" class="chart" style="width: 100%; height: 400px;"></div>
          </div>
        </div>

        <!-- 学习趋势 -->
        <div class="trend-section">
          <h3>学习趋势</h3>
          <div class="chart-container">
            <div ref="trendChartRef" class="chart" style="width: 100%; height: 400px;"></div>
          </div>
        </div>

        <!-- 薄弱环节 -->
        <div class="weakness-section">
          <h3>薄弱环节</h3>
          <div class="weakness-list">
            <el-table :data="analysisData.weakPoints" style="width: 100%">
              <el-table-column prop="knowledgePoint" label="知识点" width="200" />
              <el-table-column prop="errorCount" label="错误次数" width="120" />
              <el-table-column prop="masteryLevel" label="掌握度" width="120">
                <template #default="scope">
                  <el-progress :percentage="scope.row.masteryLevel" :color="getMasteryColor(scope.row.masteryLevel)" />
                </template>
              </el-table-column>
              <el-table-column prop="suggestion" label="建议" />
            </el-table>
          </div>
        </div>

        <!-- 学习建议 -->
        <div class="suggestion-section">
          <h3>学习建议</h3>
          <div class="suggestion-content">
            <el-timeline>
              <el-timeline-item
                v-for="(suggestion, index) in analysisData.suggestions"
                :key="index"
                type="primary"
                :timestamp="`建议 ${index + 1}`"
              >
                <el-card>
                  <p>{{ suggestion }}</p>
                </el-card>
              </el-timeline-item>
            </el-timeline>
          </div>
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
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { Download } from '@element-plus/icons-vue'
import * as echarts from 'echarts'

export default {
  name: 'Analysis',
  components: {
    Download
  },
  setup() {
    const router = useRouter()
    const analysisData = ref(null)
    const categoryChartRef = ref(null)
    const knowledgeChartRef = ref(null)
    const trendChartRef = ref(null)
    let categoryChart = null
    let knowledgeChart = null
    let trendChart = null

    // 模拟分析数据
    const mockAnalysisData = {
      totalQuestions: 120,
      masteredQuestions: 45,
      reviewCount: 85,
      averageMastery: 65,
      categoryData: [
        { name: '数学', value: 35 },
        { name: '语文', value: 25 },
        { name: '英语', value: 20 },
        { name: '物理', value: 15 },
        { name: '化学', value: 12 },
        { name: '生物', value: 8 },
        { name: '其他', value: 5 }
      ],
      knowledgeData: {
        categories: ['函数', '几何', '代数', '阅读', '写作', '听力', '语法', '实验', '公式', '概念'],
        data: [70, 55, 65, 80, 60, 75, 85, 45, 65, 50]
      },
      trendData: {
        dates: ['1月', '2月', '3月', '4月', '5月', '6月'],
        errorCount: [25, 20, 15, 12, 8, 5],
        masteryLevel: [30, 40, 50, 55, 65, 70]
      },
      weakPoints: [
        { knowledgePoint: '函数', errorCount: 12, masteryLevel: 30, suggestion: '建议加强函数基础概念的学习，多做相关练习题' },
        { knowledgePoint: '几何', errorCount: 10, masteryLevel: 40, suggestion: '几何证明题需要多练习，注意解题步骤的逻辑性' },
        { knowledgePoint: '实验', errorCount: 8, masteryLevel: 25, suggestion: '实验题要注意细节，多回顾实验原理和操作步骤' },
        { knowledgePoint: '语法', errorCount: 6, masteryLevel: 70, suggestion: '语法基础较好，建议提高在实际语境中的应用能力' },
        { knowledgePoint: '写作', errorCount: 5, masteryLevel: 55, suggestion: '写作需要多积累素材，提高语言表达能力' }
      ],
      suggestions: [
        '加强数学函数部分的学习，这是你的主要薄弱环节',
        '增加物理实验题的练习，提高实验操作和分析能力',
        '保持英语听力和阅读的练习，这是你的优势领域',
        '建立错题定期复习机制，巩固已学知识',
        '制定详细的学习计划，合理分配各科学习时间'
      ]
    }

    const fetchAnalysisData = async () => {
      try {
        // 模拟API调用
        setTimeout(() => {
          analysisData.value = mockAnalysisData
          initCharts()
        }, 1000)

        // 实际API调用
        /*
        const response = await axios.get('/api/analysis')
        analysisData.value = response.data.data
        initCharts()
        */
      } catch (error) {
        console.error('获取分析数据失败:', error)
        ElMessage.error('获取分析数据失败')
      }
    }

    const initCharts = () => {
      // 初始化错题分类饼图
      if (categoryChartRef.value) {
        categoryChart = echarts.init(categoryChartRef.value)
        const categoryOption = {
          title: {
            text: '错题分类分布',
            left: 'center'
          },
          tooltip: {
            trigger: 'item',
            formatter: '{a} <br/>{b}: {c} ({d}%)'
          },
          legend: {
            orient: 'vertical',
            left: 'left',
            data: mockAnalysisData.categoryData.map(item => item.name)
          },
          series: [
            {
              name: '错题分类',
              type: 'pie',
              radius: '50%',
              data: mockAnalysisData.categoryData,
              emphasis: {
                itemStyle: {
                  shadowBlur: 10,
                  shadowOffsetX: 0,
                  shadowColor: 'rgba(0, 0, 0, 0.5)'
                }
              }
            }
          ]
        }
        categoryChart.setOption(categoryOption)
      }

      // 初始化知识点掌握度雷达图
      if (knowledgeChartRef.value) {
        knowledgeChart = echarts.init(knowledgeChartRef.value)
        const knowledgeOption = {
          title: {
            text: '知识点掌握度',
            left: 'center'
          },
          tooltip: {},
          legend: {
            data: ['掌握度'],
            bottom: 0
          },
          radar: {
            indicator: mockAnalysisData.knowledgeData.categories.map(category => ({
              name: category,
              max: 100
            }))
          },
          series: [
            {
              name: '学习情况',
              type: 'radar',
              data: [
                {
                  value: mockAnalysisData.knowledgeData.data,
                  name: '掌握度',
                  areaStyle: {
                    color: 'rgba(64, 158, 255, 0.3)'
                  }
                }
              ]
            }
          ]
        }
        knowledgeChart.setOption(knowledgeOption)
      }

      // 初始化学习趋势折线图
      if (trendChartRef.value) {
        trendChart = echarts.init(trendChartRef.value)
        const trendOption = {
          title: {
            text: '学习趋势',
            left: 'center'
          },
          tooltip: {
            trigger: 'axis'
          },
          legend: {
            data: ['错误次数', '平均掌握度'],
            bottom: 0
          },
          xAxis: {
            type: 'category',
            data: mockAnalysisData.trendData.dates
          },
          yAxis: [
            {
              type: 'value',
              name: '错误次数',
              min: 0
            },
            {
              type: 'value',
              name: '掌握度',
              min: 0,
              max: 100
            }
          ],
          series: [
            {
              name: '错误次数',
              type: 'line',
              data: mockAnalysisData.trendData.errorCount,
              itemStyle: {
                color: '#f56c6c'
              }
            },
            {
              name: '平均掌握度',
              type: 'line',
              yAxisIndex: 1,
              data: mockAnalysisData.trendData.masteryLevel,
              itemStyle: {
                color: '#67c23a'
              }
            }
          ]
        }
        trendChart.setOption(trendOption)
      }
    }

    const handleResize = () => {
      categoryChart?.resize()
      knowledgeChart?.resize()
      trendChart?.resize()
    }

    const exportReport = () => {
      ElMessage.success('报告导出功能正在开发中')
    }

    const getMasteryColor = (level) => {
      if (level < 30) return '#f56c6c'
      if (level < 70) return '#e6a23c'
      return '#67c23a'
    }

    onMounted(() => {
      fetchAnalysisData()
      window.addEventListener('resize', handleResize)
    })

    onUnmounted(() => {
      window.removeEventListener('resize', handleResize)
      categoryChart?.dispose()
      knowledgeChart?.dispose()
      trendChart?.dispose()
    })

    return {
      router,
      analysisData,
      categoryChartRef,
      knowledgeChartRef,
      trendChartRef,
      exportReport,
      getMasteryColor
    }
  }
}
</script>

<style lang="scss">
.analysis-container {
  padding: 20px;
}

.analysis-card {
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);

  .analysis-header {
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

  .analysis-content {
    padding: 0 20px 20px;

    .stats-section {
      margin-bottom: 30px;

      h3 {
        margin: 0 0 20px 0;
        font-size: 16px;
        font-weight: bold;
        color: #303133;
        border-left: 4px solid #409eff;
        padding-left: 10px;
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
    }

    .category-section,
    .knowledge-section,
    .trend-section,
    .weakness-section,
    .suggestion-section {
      margin-bottom: 30px;

      h3 {
        margin: 0 0 20px 0;
        font-size: 16px;
        font-weight: bold;
        color: #303133;
        border-left: 4px solid #409eff;
        padding-left: 10px;
      }

      .chart-container {
        margin-bottom: 20px;
      }

      .chart {
        border: 1px solid #ebeef5;
        border-radius: 8px;
      }
    }

    .suggestion-content {
      .el-timeline {
        .el-timeline-item {
          margin-bottom: 20px;
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
  .analysis-container {
    padding: 10px;
  }

  .analysis-card {
    .analysis-content {
      padding: 0 10px 10px;

      .stats-section {
        .el-row {
          .el-col {
            margin-bottom: 10px;
          }
        }
      }

      .chart-container {
        .chart {
          height: 300px !important;
        }
      }

      .weakness-section {
        .el-table {
          font-size: 12px;

          .el-table__cell {
            padding: 8px;
          }
        }
      }
    }
  }
}
</style>