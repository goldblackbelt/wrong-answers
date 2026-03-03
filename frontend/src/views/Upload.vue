<template>
  <div class="upload-container">
    <el-card shadow="hover" class="upload-card">
      <template #header>
        <div class="upload-header">
          <el-button type="primary" plain @click="router.back()">
            返回
          </el-button>
          <h2>上传错题</h2>
        </div>
      </template>

      <div class="upload-content">
        <!-- 第一步：上传图片 -->
        <div class="step-section" v-if="currentStep === 1">
          <div class="step-title">
            <el-tag type="primary" size="large">第一步</el-tag>
            <span>上传错题图片（推荐）</span>
          </div>
          
          <div 
            class="upload-area"
            :class="{ 'is-dragover': isDragover }"
            @dragover.prevent="isDragover = true"
            @dragleave.prevent="isDragover = false"
            @drop.prevent="handleDrop"
          >
            <el-upload
              class="image-uploader"
              :auto-upload="false"
              :show-file-list="false"
              :on-change="handleFileChange"
              :limit="1"
              accept="image/*"
              drag
              ref="imageUpload"
            >
              <div v-if="!previewImage" class="upload-placeholder">
                <el-icon class="upload-icon"><Picture /></el-icon>
                <div class="upload-text">
                  <div class="upload-text-main">点击或拖拽图片到这里</div>
                  <div class="upload-text-sub">支持 JPG、PNG、GIF 格式，大小不超过 10MB</div>
                </div>
              </div>
              <div v-else class="image-preview-wrapper">
                <img :src="previewImage" alt="题目图片" />
                <div class="image-actions">
                  <el-button type="danger" size="small" @click.stop="removeImage">
                    <el-icon><Delete /></el-icon> 重新上传
                  </el-button>
                </div>
              </div>
            </el-upload>
          </div>

          <div class="step-actions">
            <el-button @click="skipToManual">
              <el-icon><Edit /></el-icon> 直接填写文字（不使用图片）
            </el-button>
            <el-button 
              type="primary" 
              size="large" 
              :disabled="!previewImage"
              @click="analyzeImage"
              :loading="analyzing"
            >
              <el-icon v-if="!analyzing"><MagicStick /></el-icon>
              {{ analyzing ? '正在智能分析...' : '智能分析并继续' }}
            </el-button>
          </div>
        </div>

        <!-- 第二步：填写/编辑信息 -->
        <div class="step-section" v-if="currentStep === 2">
          <div class="step-title">
            <el-tag type="success" size="large">第二步</el-tag>
            <span>完善错题信息</span>
          </div>

          <!-- 智能分析结果提示 -->
          <el-alert
            v-if="analysisResult"
            :title="analysisResult.title"
            :type="analysisResult.type"
            :description="analysisResult.description"
            show-icon
            class="analysis-alert"
            :closable="false"
          />

          <el-form :model="uploadForm" :rules="uploadRules" ref="uploadFormRef" label-width="100px" class="upload-form">
            <!-- 图片预览 -->
            <el-form-item label="题目图片" v-if="previewImage">
              <div class="form-image-preview">
                <img :src="previewImage" alt="题目图片" />
              </div>
            </el-form-item>

            <el-form-item label="题目内容" prop="questionContent">
              <div class="question-content-wrapper">
                <el-input
                  v-model="uploadForm.questionContent"
                  type="textarea"
                  :rows="4"
                  placeholder="请输入题目内容"
                />
                <el-button 
                  type="success" 
                  :disabled="!uploadForm.questionContent"
                  :loading="solving"
                  @click="solveQuestion"
                  class="solve-button"
                >
                  <el-icon><MagicStick /></el-icon> 智能解题
                </el-button>
              </div>
              <div v-if="aiSolution" class="ai-solution">
                <el-divider content-position="left">
                  <el-tag type="success">智能解题</el-tag>
                </el-divider>
                <el-card class="solution-card">
                  <div class="solution-section">
                    <div class="section-title">
                      <el-icon><Document /></el-icon> 解题思路
                    </div>
                    <div class="section-content">{{ aiSolution.solution }}</div>
                  </div>
                  <el-divider v-if="aiSolution.explanation" />
                  <div class="solution-section">
                    <div class="section-title">
                      <el-icon><Star /></el-icon> 解题说明
                    </div>
                    <div class="section-content">{{ aiSolution.explanation }}</div>
                  </div>
                  <el-divider v-if="aiSolution.knowledgePoints && aiSolution.knowledgePoints.length > 0" />
                  <div v-if="aiSolution.knowledgePoints && aiSolution.knowledgePoints.length > 0" class="solution-section">
                    <div class="section-title">
                      <el-icon><Collection /></el-icon> 推荐知识点
                    </div>
                    <div class="knowledge-tags">
                      <el-tag 
                        v-for="point in aiSolution.knowledgePoints" 
                        :key="point"
                        class="knowledge-tag"
                        @click="addKnowledgePointFromAI(point)"
                      >
                        {{ point }}
                      </el-tag>
                    </div>
                  </div>
                  <div class="solution-actions">
                    <el-button type="primary" size="small" @click="applySolution">
                      <el-icon><Check /></el-icon> 应用到表单
                    </el-button>
                  </div>
                </el-card>
              </div>
            </el-form-item>

            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="分类" prop="category">
                  <el-select v-model="uploadForm.category" placeholder="请选择分类" style="width: 100%">
                    <el-option label="数学" value="math" />
                    <el-option label="语文" value="chinese" />
                    <el-option label="英语" value="english" />
                    <el-option label="物理" value="physics" />
                    <el-option label="化学" value="chemistry" />
                    <el-option label="生物" value="biology" />
                    <el-option label="其他" value="other" />
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="难度" prop="difficulty">
                  <el-slider v-model="uploadForm.difficulty" :min="1" :max="5" :marks="{ 1: '简单', 3: '中等', 5: '困难' }" />
                </el-form-item>
              </el-col>
            </el-row>

            <el-form-item label="标准答案" prop="standardAnswer">
              <el-input
                v-model="uploadForm.standardAnswer"
                type="textarea"
                :rows="3"
                placeholder="请输入标准答案"
              />
            </el-form-item>

            <el-form-item label="我的答案" prop="userAnswer">
              <el-input
                v-model="uploadForm.userAnswer"
                type="textarea"
                :rows="3"
                placeholder="请输入您的答案"
              />
            </el-form-item>

            <el-form-item label="错误原因" prop="errorReason">
              <el-input
                v-model="uploadForm.errorReason"
                type="textarea"
                :rows="2"
                placeholder="请输入错误原因"
              />
            </el-form-item>

            <!-- 快捷错误原因 -->
            <el-form-item label="快捷标签">
              <div class="quick-tags">
                <el-tag 
                  v-for="tag in quickErrorTags" 
                  :key="tag"
                  class="quick-tag"
                  @click="addQuickTag(tag)"
                  effect="plain"
                  :type="uploadForm.errorReason.includes(tag) ? 'primary' : 'info'"
                >
                  {{ tag }}
                </el-tag>
              </div>
            </el-form-item>

            <el-form-item label="知识点">
              <el-tag
                v-for="tag in uploadForm.knowledgePoints"
                :key="tag"
                closable
                @close="removeKnowledgePoint(tag)"
                class="knowledge-tag"
              >
                {{ tag }}
              </el-tag>
              <el-input
                v-model="newKnowledgePoint"
                placeholder="输入知识点并按Enter添加"
                @keyup.enter="addKnowledgePoint"
                class="knowledge-input"
              />
            </el-form-item>

            <el-form-item>
              <el-button @click="goBack">
                <el-icon><ArrowLeft /></el-icon> 返回上一步
              </el-button>
              <el-button type="primary" @click="submitForm" :loading="loading" size="large">
                <el-icon><Check /></el-icon> 上传错题
              </el-button>
              <el-button @click="resetForm">
                重置
              </el-button>
            </el-form-item>
          </el-form>
        </div>

        <!-- 上传成功提示 -->
        <div class="success-section" v-if="currentStep === 3">
          <div class="success-icon">
            <el-icon :size="80" color="#67c23a"><CircleCheck /></el-icon>
          </div>
          <h2>上传成功！</h2>
          <p>您的错题已成功保存到错题本</p>
          <div class="success-actions">
            <el-button @click="router.push('/questions')">
              查看错题列表
            </el-button>
            <el-button type="primary" @click="startNewUpload">
              继续上传新错题
            </el-button>
          </div>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { 
  Picture, 
  Delete, 
  Edit, 
  MagicStick, 
  ArrowLeft, 
  Check, 
  CircleCheck,
  Document,
  Star,
  Collection
} from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import axios from 'axios'

export default {
  name: 'Upload',
  components: {
    Picture,
    Delete,
    Edit,
    MagicStick,
    ArrowLeft,
    Check,
    CircleCheck,
    Document,
    Star,
    Collection
  },
  setup() {
    const router = useRouter()
    const uploadFormRef = ref(null)
    const imageUpload = ref(null)
    
    const currentStep = ref(1)
    const loading = ref(false)
    const solving = ref(false)
    const analyzing = ref(false)
    const isDragover = ref(false)
    const newKnowledgePoint = ref('')
    const previewImage = ref('')
    const analysisResult = ref(null)
    const aiSolution = ref(null)

    const uploadForm = reactive({
      questionContent: '',
      questionImage: '',
      standardAnswer: '',
      userAnswer: '',
      errorReason: '',
      category: '',
      difficulty: 3,
      knowledgePoints: []
    })

    const uploadRules = {
      questionContent: [
        { required: true, message: '请输入题目内容', trigger: 'blur' }
      ],
      standardAnswer: [
        { required: true, message: '请输入标准答案', trigger: 'blur' }
      ],
      category: [
        { required: true, message: '请选择分类', trigger: 'change' }
      ]
    }

    const quickErrorTags = [
      '计算错误',
      '概念不清',
      '公式记错',
      '审题错误',
      '思路错误',
      '知识遗忘',
      '粗心大意'
    ]

    const handleFileChange = (file) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        previewImage.value = e.target.result
      }
      reader.readAsDataURL(file.raw)
    }

    const handleDrop = (e) => {
      isDragover.value = false
      const files = e.dataTransfer.files
      if (files && files.length > 0) {
        const file = files[0]
        if (file.type.startsWith('image/')) {
          handleFileChange({ raw: file })
        }
      }
    }

    const removeImage = () => {
      previewImage.value = ''
      if (imageUpload.value) {
        imageUpload.value.clearFiles()
      }
    }

    const analyzeImage = async () => {
      analyzing.value = true
      analysisResult.value = null

      try {
        await new Promise(resolve => setTimeout(resolve, 2000))

        const mockAnalysis = {
          title: '智能分析完成',
          type: 'success',
          description: '已根据图片内容自动填充了部分信息，请核对并补充完整。',
          suggestedContent: '这是一道关于二次函数的题目，要求求解函数在给定点的值。',
          suggestedCategory: 'math',
          suggestedDifficulty: 3,
          suggestedKnowledgePoints: ['二次函数', '函数求值']
        }

        if (!uploadForm.questionContent) {
          uploadForm.questionContent = mockAnalysis.suggestedContent
        }
        if (!uploadForm.category) {
          uploadForm.category = mockAnalysis.suggestedCategory
        }
        uploadForm.difficulty = mockAnalysis.suggestedDifficulty
        mockAnalysis.suggestedKnowledgePoints.forEach(point => {
          if (!uploadForm.knowledgePoints.includes(point)) {
            uploadForm.knowledgePoints.push(point)
          }
        })

        analysisResult.value = mockAnalysis
        currentStep.value = 2
      } catch (error) {
        ElMessage.error('分析失败，请手动填写')
        currentStep.value = 2
      } finally {
        analyzing.value = false
      }
    }

    const skipToManual = () => {
      currentStep.value = 2
    }

    const goBack = () => {
      currentStep.value = 1
      analysisResult.value = null
    }

    const addKnowledgePoint = () => {
      if (newKnowledgePoint.value && !uploadForm.knowledgePoints.includes(newKnowledgePoint.value)) {
        uploadForm.knowledgePoints.push(newKnowledgePoint.value)
        newKnowledgePoint.value = ''
      }
    }

    const removeKnowledgePoint = (tag) => {
      uploadForm.knowledgePoints = uploadForm.knowledgePoints.filter(item => item !== tag)
    }

    const addQuickTag = (tag) => {
      if (!uploadForm.errorReason) {
        uploadForm.errorReason = tag
      } else if (!uploadForm.errorReason.includes(tag)) {
        uploadForm.errorReason += (uploadForm.errorReason ? '、' : '') + tag
      }
    }

    const solveQuestion = async () => {
      if (!uploadForm.questionContent) {
        ElMessage.warning('请先输入题目内容')
        return
      }

      solving.value = true
      aiSolution.value = null

      try {
        const response = await axios.post('/ai/solve', {
          questionContent: uploadForm.questionContent,
          category: uploadForm.category,
          difficulty: uploadForm.difficulty
        })

        if (response.data.status === 'success') {
          aiSolution.value = response.data.data
          ElMessage.success('智能解题完成！')
        }
      } catch (error) {
        console.error('智能解题失败:', error)
        ElMessage.error('智能解题失败，请重试')
      } finally {
        solving.value = false
      }
    }

    const addKnowledgePointFromAI = (point) => {
      if (!uploadForm.knowledgePoints.includes(point)) {
        uploadForm.knowledgePoints.push(point)
        ElMessage.success(`已添加知识点: ${point}`)
      }
    }

    const applySolution = () => {
      if (aiSolution.value) {
        if (!uploadForm.standardAnswer && aiSolution.value.solution) {
          uploadForm.standardAnswer = aiSolution.value.solution
        }
        if (aiSolution.value.knowledgePoints) {
          aiSolution.value.knowledgePoints.forEach(point => {
            if (!uploadForm.knowledgePoints.includes(point)) {
              uploadForm.knowledgePoints.push(point)
            }
          })
        }
        ElMessage.success('已应用智能解题结果！')
      }
    }

    const submitForm = async () => {
      if (!uploadFormRef.value) return
      
      try {
        await uploadFormRef.value.validate()
        loading.value = true

        const formData = new FormData()
        formData.append('questionContent', uploadForm.questionContent)
        formData.append('standardAnswer', uploadForm.standardAnswer)
        formData.append('userAnswer', uploadForm.userAnswer)
        formData.append('errorReason', uploadForm.errorReason)
        formData.append('category', uploadForm.category)
        formData.append('difficulty', uploadForm.difficulty)
        formData.append('knowledgePoints', JSON.stringify(uploadForm.knowledgePoints))
        
        if (imageUpload.value && imageUpload.value.uploadFiles.length > 0) {
          const file = imageUpload.value.uploadFiles[0].raw
          formData.append('questionImage', file)
        }

        const token = localStorage.getItem('token')
        
        const headers = {}
        if (token) {
          headers['Authorization'] = `Bearer ${token}`
        }
        
        const response = await axios.post('/wrong-questions/upload', formData, {
          headers: headers
        })

        if (response.data.status === 'success') {
          loading.value = false
          currentStep.value = 3
        } else {
          loading.value = false
          ElMessage.error(response.data.message || '上传失败')
        }
      } catch (error) {
        loading.value = false
        console.error('上传失败:', error)
        if (error.response && error.response.data) {
          if (error.response.status === 401) {
            ElMessage.error('请先登录后再上传错题')
          } else {
            ElMessage.error(error.response.data.message || '上传失败')
          }
        } else {
          ElMessage.error('上传失败，请重试')
        }
      }
    }

    const resetForm = () => {
      if (uploadFormRef.value) {
        uploadFormRef.value.resetFields()
      }
      uploadForm.knowledgePoints = []
      uploadForm.questionImage = ''
      uploadForm.difficulty = 3
      newKnowledgePoint.value = ''
      previewImage.value = ''
      analysisResult.value = null
      aiSolution.value = null
      currentStep.value = 1
      removeImage()
    }

    const startNewUpload = () => {
      resetForm()
    }

    return {
      router,
      currentStep,
      uploadFormRef,
      imageUpload,
      loading,
      solving,
      analyzing,
      isDragover,
      newKnowledgePoint,
      previewImage,
      analysisResult,
      aiSolution,
      uploadForm,
      uploadRules,
      quickErrorTags,
      handleFileChange,
      handleDrop,
      removeImage,
      analyzeImage,
      skipToManual,
      goBack,
      addKnowledgePoint,
      removeKnowledgePoint,
      addQuickTag,
      solveQuestion,
      addKnowledgePointFromAI,
      applySolution,
      submitForm,
      resetForm,
      startNewUpload
    }
  }
}
</script>

<style lang="scss">
.upload-container {
  padding: 20px;
}

.upload-card {
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);

  .upload-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 20px;

    h2 {
      margin: 0;
      font-size: 20px;
      font-weight: bold;
      color: #409eff;
    }
  }

  .upload-content {
    padding: 0 20px 20px;

    .step-section {
      .step-title {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 24px;
        font-size: 18px;
        font-weight: 600;
        color: #303133;
      }

      .upload-area {
        border: 2px dashed #d9d9d9;
        border-radius: 12px;
        padding: 40px;
        text-align: center;
        transition: all 0.3s;
        background-color: #fafafa;

        &.is-dragover {
          border-color: #409eff;
          background-color: #ecf5ff;
        }

        .image-uploader {
          width: 100%;

          :deep(.el-upload-dragger) {
            border: none;
            background: transparent;
          }

          .upload-placeholder {
            .upload-icon {
              font-size: 64px;
              color: #c0c4cc;
              margin-bottom: 16px;
            }

            .upload-text {
              .upload-text-main {
                font-size: 18px;
                color: #606266;
                margin-bottom: 8px;
              }

              .upload-text-sub {
                font-size: 14px;
                color: #909399;
              }
            }
          }

          .image-preview-wrapper {
            position: relative;
            display: inline-block;

            img {
              max-width: 100%;
              max-height: 400px;
              border-radius: 8px;
            }

            .image-actions {
              position: absolute;
              bottom: 16px;
              left: 50%;
              transform: translateX(-50%);
            }
          }
        }
      }

      .step-actions {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-top: 24px;
        padding-top: 24px;
        border-top: 1px solid #f0f0f0;
      }

      .analysis-alert {
        margin-bottom: 24px;
      }

      .upload-form {
        max-width: 800px;
        margin: 0 auto;

        .form-image-preview {
          img {
            max-width: 300px;
            max-height: 200px;
            border-radius: 8px;
            border: 1px solid #e4e7ed;
          }
        }

        .quick-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;

          .quick-tag {
            cursor: pointer;
            transition: all 0.2s;

            &:hover {
              transform: translateY(-2px);
            }
          }
        }

        .knowledge-tag {
          margin-right: 8px;
          margin-bottom: 8px;
        }

        .knowledge-input {
          width: 300px;
          margin-top: 8px;
        }

        .question-content-wrapper {
          display: flex;
          gap: 12px;
          align-items: flex-start;

          .el-textarea {
            flex: 1;
          }

          .solve-button {
            white-space: nowrap;
          }
        }

        .ai-solution {
          margin-top: 16px;

          .solution-card {
            background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
            border: 1px solid #bae6fd;

            .solution-section {
              .section-title {
                display: flex;
                align-items: center;
                gap: 6px;
                font-weight: 600;
                color: #0369a1;
                margin-bottom: 8px;
              }

              .section-content {
                color: #0c4a6e;
                line-height: 1.6;
                white-space: pre-wrap;
              }
            }

            .knowledge-tags {
              display: flex;
              flex-wrap: wrap;
              gap: 8px;

              .knowledge-tag {
                cursor: pointer;
                transition: all 0.2s;

                &:hover {
                  transform: scale(1.05);
                }
              }
            }

            .solution-actions {
              margin-top: 16px;
              display: flex;
              justify-content: flex-end;
            }
          }
        }
      }
    }

    .success-section {
      text-align: center;
      padding: 60px 20px;

      .success-icon {
        margin-bottom: 24px;
      }

      h2 {
        margin: 0 0 12px 0;
        font-size: 24px;
        color: #303133;
      }

      p {
        margin: 0 0 32px 0;
        font-size: 16px;
        color: #606266;
      }

      .success-actions {
        display: flex;
        justify-content: center;
        gap: 16px;
      }
    }
  }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .upload-container {
    padding: 10px;
  }

  .upload-card {
    .upload-content {
      padding: 0 10px 10px;

      .step-section {
        .upload-area {
          padding: 20px;
        }

        .step-actions {
          flex-direction: column;
          gap: 12px;

          .el-button {
            width: 100%;
          }
        }

        .upload-form {
          .knowledge-input {
            width: 100%;
          }
        }
      }
    }
  }
}
</style>
