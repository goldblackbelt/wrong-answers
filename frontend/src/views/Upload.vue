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
        <el-form :model="uploadForm" :rules="uploadRules" ref="uploadFormRef" label-width="120px" class="upload-form">
          <el-form-item label="题目内容" prop="questionContent">
            <el-input
              v-model="uploadForm.questionContent"
              type="textarea"
              :rows="4"
              placeholder="请输入题目内容"
            />
          </el-form-item>

          <el-form-item label="题目图片">
            <el-upload
              class="upload-demo"
              :action="'/api/wrong-questions/upload'"
              :on-success="handleImageUploadSuccess"
              :on-error="handleImageUploadError"
              :auto-upload="false"
              :show-file-list="false"
              ref="imageUpload"
            >
              <template #trigger>
                <el-button type="primary">
                  <el-icon><Upload /></el-icon> 选择图片
                </el-button>
              </template>
              <template #tip>
                <div class="el-upload__tip">
                  支持 JPG、PNG 格式，大小不超过 2MB
                </div>
              </template>
            </el-upload>
            <div v-if="uploadForm.questionImage" class="image-preview">
              <img :src="uploadForm.questionImage" alt="题目图片" />
              <el-button type="danger" size="small" @click="removeImage">
                删除图片
              </el-button>
            </div>
          </el-form-item>

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

          <el-form-item label="分类" prop="category">
            <el-select v-model="uploadForm.category" placeholder="请选择分类">
              <el-option label="数学" value="math" />
              <el-option label="语文" value="chinese" />
              <el-option label="英语" value="english" />
              <el-option label="物理" value="physics" />
              <el-option label="化学" value="chemistry" />
              <el-option label="生物" value="biology" />
              <el-option label="其他" value="other" />
            </el-select>
          </el-form-item>

          <el-form-item label="难度" prop="difficulty">
            <el-slider v-model="uploadForm.difficulty" :min="1" :max="5" :marks="{ 1: '简单', 3: '中等', 5: '困难' }" />
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
            <el-button type="primary" @click="submitForm" :loading="loading">
              上传错题
            </el-button>
            <el-button @click="resetForm">
              重置
            </el-button>
          </el-form-item>
        </el-form>
      </div>
    </el-card>
  </div>
</template>

<script>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { Upload } from '@element-plus/icons-vue'

export default {
  name: 'Upload',
  components: {
    Upload
  },
  setup() {
    const router = useRouter()
    const uploadFormRef = ref(null)
    const imageUpload = ref(null)
    const loading = ref(false)
    const newKnowledgePoint = ref('')

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
        { required: true, message: '请选择分类', trigger: 'blur' }
      ]
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

    const handleImageUploadSuccess = (response) => {
      if (response.status === 'success') {
        uploadForm.questionImage = response.data.wrongQuestion.questionImage
      }
    }

    const handleImageUploadError = (error) => {
      console.error('图片上传失败:', error)
      ElMessage.error('图片上传失败，请重试')
    }

    const removeImage = () => {
      uploadForm.questionImage = ''
    }

    const submitForm = async () => {
      if (!uploadFormRef.value) return
      
      try {
        await uploadFormRef.value.validate()
        loading.value = true

        // 模拟API调用
        setTimeout(() => {
          loading.value = false
          ElMessage.success('错题上传成功')
          resetForm()
        }, 1000)

        // 实际API调用
        /*
        const formData = new FormData()
        formData.append('questionContent', uploadForm.questionContent)
        formData.append('standardAnswer', uploadForm.standardAnswer)
        formData.append('userAnswer', uploadForm.userAnswer)
        formData.append('errorReason', uploadForm.errorReason)
        formData.append('category', uploadForm.category)
        formData.append('difficulty', uploadForm.difficulty)
        formData.append('knowledgePoints', JSON.stringify(uploadForm.knowledgePoints))

        const response = await axios.post('/api/wrong-questions/upload', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        })

        if (response.data.status === 'success') {
          ElMessage.success('错题上传成功')
          resetForm()
        }
        */
      } catch (error) {
        loading.value = false
        console.error('上传失败:', error)
        ElMessage.error('上传失败，请重试')
      }
    }

    const resetForm = () => {
      if (uploadFormRef.value) {
        uploadFormRef.value.resetFields()
      }
      uploadForm.knowledgePoints = []
      uploadForm.questionImage = ''
      newKnowledgePoint.value = ''
    }

    return {
      router,
      uploadFormRef,
      imageUpload,
      loading,
      uploadForm,
      uploadRules,
      newKnowledgePoint,
      addKnowledgePoint,
      removeKnowledgePoint,
      handleImageUploadSuccess,
      handleImageUploadError,
      removeImage,
      submitForm,
      resetForm
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
    margin-bottom: 30px;

    h2 {
      margin: 0;
      font-size: 20px;
      font-weight: bold;
      color: #409eff;
    }
  }

  .upload-content {
    padding: 0 20px 20px;

    .upload-form {
      max-width: 800px;

      .knowledge-tag {
        margin-right: 10px;
        margin-bottom: 10px;
      }

      .knowledge-input {
        width: 300px;
        margin-top: 10px;
      }

      .image-preview {
        margin-top: 10px;
        display: flex;
        align-items: center;
        gap: 10px;

        img {
          max-width: 200px;
          max-height: 150px;
          border-radius: 4px;
        }
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

      .upload-form {
        .el-form-item {
          label-width: 80px;
        }

        .knowledge-input {
          width: 100%;
        }

        .image-preview {
          flex-direction: column;
          align-items: flex-start;

          img {
            max-width: 100%;
          }
        }
      }
    }
  }
}
</style>