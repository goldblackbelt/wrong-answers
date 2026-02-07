<template>
  <div class="questions-container">
    <el-card shadow="hover" class="questions-card">
      <template #header>
        <div class="questions-header">
          <el-button type="primary" plain @click="router.back()">
            返回
          </el-button>
          <h2>错题列表</h2>
          <el-button type="primary" @click="router.push('/upload')">
            <el-icon><Upload /></el-icon> 上传错题
          </el-button>
        </div>
      </template>

      <div class="questions-content">
        <!-- 筛选和搜索 -->
        <div class="filter-section">
          <el-row :gutter="20" class="filter-row">
            <el-col :span="8" class="filter-col">
              <el-select v-model="filters.category" placeholder="按分类筛选">
                <el-option label="全部" value="" />
                <el-option label="数学" value="math" />
                <el-option label="语文" value="chinese" />
                <el-option label="英语" value="english" />
                <el-option label="物理" value="physics" />
                <el-option label="化学" value="chemistry" />
                <el-option label="生物" value="biology" />
                <el-option label="其他" value="other" />
              </el-select>
            </el-col>
            <el-col :span="8" class="filter-col">
              <el-select v-model="filters.difficulty" placeholder="按难度筛选">
                <el-option label="全部" value="" />
                <el-option label="简单" value="1" />
                <el-option label="较简单" value="2" />
                <el-option label="中等" value="3" />
                <el-option label="较困难" value="4" />
                <el-option label="困难" value="5" />
              </el-select>
            </el-col>
            <el-col :span="8" class="filter-col">
              <el-input
                v-model="filters.search"
                placeholder="搜索题目内容"
                prefix-icon="el-icon-search"
                @keyup.enter="fetchQuestions"
              >
                <template #append>
                  <el-button @click="fetchQuestions">搜索</el-button>
                </template>
              </el-input>
            </el-col>
          </el-row>
        </div>

        <!-- 批量操作 -->
        <div class="batch-actions" v-if="selectedQuestions.length > 0">
          <el-button type="danger" @click="batchDelete">
            <el-icon><Delete /></el-icon> 批量删除
          </el-button>
          <el-button type="success" @click="batchMarkMastered">
            <el-icon><Checked /></el-icon> 标记为已掌握
          </el-button>
          <el-button @click="selectedQuestions = []">
            取消选择
          </el-button>
          <span>已选择 {{ selectedQuestions.length }} 道错题</span>
        </div>

        <!-- 错题列表 -->
        <div class="questions-list">
          <el-table
            v-loading="loading"
            :data="questionsData"
            style="width: 100%"
            @selection-change="handleSelectionChange"
          >
            <el-table-column type="selection" width="55" />
            <el-table-column prop="id" label="ID" width="80" />
            <el-table-column prop="questionContent" label="题目内容" min-width="300">
              <template #default="scope">
                <div class="question-content">
                  {{ scope.row.questionContent }}
                  <span v-if="scope.row.questionImage" class="image-indicator">
                    <el-icon><Picture /></el-icon>
                  </span>
                </div>
              </template>
            </el-table-column>
            <el-table-column prop="category" label="分类" width="120">
              <template #default="scope">
                <el-tag :type="getCategoryType(scope.row.category)">{{ getCategoryName(scope.row.category) }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="difficulty" label="难度" width="100">
              <template #default="scope">
                <el-rate v-model="scope.row.difficulty" disabled :max="5" show-score score-template="{{ scope.row.difficulty }}" />
              </template>
            </el-table-column>
            <el-table-column prop="masteryLevel" label="掌握度" width="120">
              <template #default="scope">
                <el-progress :percentage="scope.row.masteryLevel" :color="getMasteryColor(scope.row.masteryLevel)" />
              </template>
            </el-table-column>
            <el-table-column prop="uploadDate" label="上传时间" width="180">
              <template #default="scope">
                {{ formatDate(scope.row.uploadDate) }}
              </template>
            </el-table-column>
            <el-table-column label="操作" width="150" fixed="right">
              <template #default="scope">
                <el-button type="primary" size="small" @click="viewQuestion(scope.row.id)">
                  查看
                </el-button>
                <el-button type="danger" size="small" @click="deleteQuestion(scope.row.id)">
                  删除
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>

        <!-- 分页 -->
        <div class="pagination">
          <el-pagination
            v-model:current-page="pagination.currentPage"
            v-model:page-size="pagination.pageSize"
            :page-sizes="[10, 20, 50, 100]"
            layout="total, sizes, prev, pager, next, jumper"
            :total="pagination.total"
            @size-change="handleSizeChange"
            @current-change="handleCurrentChange"
          />
        </div>
      </div>
    </el-card>
  </div>
</template>

<script>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Upload, Delete, Checked, Picture } from '@element-plus/icons-vue'

export default {
  name: 'Questions',
  components: {
    Upload,
    Delete,
    Checked,
    Picture
  },
  setup() {
    const router = useRouter()
    const loading = ref(false)
    const selectedQuestions = ref([])

    const filters = reactive({
      category: '',
      difficulty: '',
      search: ''
    })

    const pagination = reactive({
      currentPage: 1,
      pageSize: 10,
      total: 0
    })

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

    const questionsData = ref(mockQuestions)
    pagination.total = mockQuestions.length

    const fetchQuestions = async () => {
      loading.value = true
      try {
        // 模拟API调用
        setTimeout(() => {
          // 这里可以根据筛选条件过滤数据
          let filteredQuestions = [...mockQuestions]
          
          if (filters.category) {
            filteredQuestions = filteredQuestions.filter(q => q.category === filters.category)
          }
          
          if (filters.difficulty) {
            filteredQuestions = filteredQuestions.filter(q => q.difficulty == filters.difficulty)
          }
          
          if (filters.search) {
            filteredQuestions = filteredQuestions.filter(q => 
              q.questionContent.includes(filters.search)
            )
          }
          
          questionsData.value = filteredQuestions
          pagination.total = filteredQuestions.length
          pagination.currentPage = 1
          loading.value = false
        }, 500)

        // 实际API调用
        /*
        const response = await axios.get('/api/wrong-questions/list', {
          params: {
            page: pagination.currentPage,
            limit: pagination.pageSize,
            category: filters.category,
            difficulty: filters.difficulty,
            search: filters.search
          }
        })

        questionsData.value = response.data.data.wrongQuestions
        pagination.total = response.data.data.pagination.total
        loading.value = false
        */
      } catch (error) {
        console.error('获取错题列表失败:', error)
        loading.value = false
      }
    }

    const handleSizeChange = (size) => {
      pagination.pageSize = size
      fetchQuestions()
    }

    const handleCurrentChange = (current) => {
      pagination.currentPage = current
      fetchQuestions()
    }

    const handleSelectionChange = (val) => {
      selectedQuestions.value = val
    }

    const viewQuestion = (id) => {
      router.push(`/question/${id}`)
    }

    const deleteQuestion = (id) => {
      ElMessageBox.confirm('确定要删除这道错题吗？', '警告', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        // 模拟删除
        questionsData.value = questionsData.value.filter(q => q.id !== id)
        pagination.total = questionsData.value.length
        ElMessage.success('删除成功')
      }).catch(() => {
        // 取消删除
      })
    }

    const batchDelete = () => {
      if (selectedQuestions.value.length === 0) return

      ElMessageBox.confirm(`确定要删除选中的 ${selectedQuestions.value.length} 道错题吗？`, '警告', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        // 模拟批量删除
        const ids = selectedQuestions.value.map(q => q.id)
        questionsData.value = questionsData.value.filter(q => !ids.includes(q.id))
        pagination.total = questionsData.value.length
        selectedQuestions.value = []
        ElMessage.success('批量删除成功')
      }).catch(() => {
        // 取消删除
      })
    }

    const batchMarkMastered = () => {
      if (selectedQuestions.value.length === 0) return

      // 模拟批量标记
      selectedQuestions.value.forEach(q => {
        const question = questionsData.value.find(item => item.id === q.id)
        if (question) {
          question.masteryLevel = 100
        }
      })
      selectedQuestions.value = []
      ElMessage.success('批量标记成功')
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

    const getMasteryColor = (level) => {
      if (level < 30) return '#f56c6c'
      if (level < 70) return '#e6a23c'
      return '#67c23a'
    }

    const formatDate = (date) => {
      if (!date) return ''
      return new Date(date).toLocaleString('zh-CN')
    }

    onMounted(() => {
      fetchQuestions()
    })

    return {
      router,
      loading,
      filters,
      questionsData,
      pagination,
      selectedQuestions,
      fetchQuestions,
      handleSizeChange,
      handleCurrentChange,
      handleSelectionChange,
      viewQuestion,
      deleteQuestion,
      batchDelete,
      batchMarkMastered,
      getCategoryType,
      getCategoryName,
      getMasteryColor,
      formatDate
    }
  }
}
</script>

<style lang="scss">
.questions-container {
  padding: 20px;
}

.questions-card {
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);

  .questions-header {
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

  .questions-content {
    padding: 0 20px 20px;

    .filter-section {
      margin-bottom: 20px;
    }

    .batch-actions {
      margin-bottom: 20px;
      padding: 10px;
      background-color: #f5f7fa;
      border-radius: 4px;
      display: flex;
      align-items: center;
      gap: 10px;

      span {
        margin-left: auto;
        color: #606266;
      }
    }

    .questions-list {
      margin-bottom: 20px;

      .question-content {
        display: flex;
        align-items: center;
        gap: 5px;

        .image-indicator {
          color: #409eff;
        }
      }
    }

    .pagination {
      display: flex;
      justify-content: flex-end;
    }
  }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .questions-container {
    padding: 10px;
  }

  .questions-card {
    .questions-content {
      padding: 0 10px 10px;

      .filter-section {
        .filter-row {
          .filter-col {
            margin-bottom: 10px;
          }
        }
      }

      .questions-list {
        .el-table {
          font-size: 12px;

          .el-table__cell {
            padding: 8px;
          }
        }
      }

      .pagination {
        .el-pagination {
          font-size: 12px;

          .el-pagination__sizes {
            margin-right: 10px;
          }
        }
      }
    }
  }
}
</style>