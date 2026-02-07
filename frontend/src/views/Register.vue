<template>
  <div class="register-container">
    <el-card class="register-card" shadow="hover">
      <template #header>
        <div class="register-header">
          <h2>错题本系统</h2>
          <p>注册新账号</p>
        </div>
      </template>

      <el-form
        :model="registerForm"
        :rules="registerRules"
        ref="registerFormRef"
        label-position="top"
        class="register-form"
      >
        <el-form-item label="用户名" prop="username">
          <el-input
            v-model="registerForm.username"
            placeholder="请输入用户名"
            prefix-icon="el-icon-user"
          />
        </el-form-item>

        <el-form-item label="邮箱" prop="email">
          <el-input
            v-model="registerForm.email"
            placeholder="请输入邮箱"
            prefix-icon="el-icon-message"
            type="email"
          />
        </el-form-item>

        <el-form-item label="密码" prop="password">
          <el-input
            v-model="registerForm.password"
            placeholder="请输入密码（至少6位，包含字母和数字）"
            prefix-icon="el-icon-lock"
            type="password"
            show-password
            @input="checkPasswordStrength"
          />
          <!-- 密码强度指示器 -->
          <div class="password-strength" v-if="registerForm.password">
            <div class="strength-label">密码强度：</div>
            <div class="strength-bars">
              <div 
                class="strength-bar" 
                :class="{ 'weak': passwordStrength < 2, 'medium': passwordStrength === 2, 'strong': passwordStrength === 3 }"
                :style="{ width: passwordStrength * 33.33 + '%' }"
              ></div>
            </div>
            <div class="strength-text" :class="{ 'weak': passwordStrength < 2, 'medium': passwordStrength === 2, 'strong': passwordStrength === 3 }">
              {{ passwordStrengthText }}
            </div>
          </div>
        </el-form-item>

        <el-form-item label="确认密码" prop="confirmPassword">
          <el-input
            v-model="registerForm.confirmPassword"
            placeholder="请再次输入密码"
            prefix-icon="el-icon-lock"
            type="password"
            show-password
          />
        </el-form-item>

        <el-form-item class="register-actions">
          <el-button type="primary" :loading="loading" @click="handleRegister" class="register-button">
            注册
          </el-button>
          <el-button @click="router.push('/login')" class="login-button">
            已有账号？登录
          </el-button>
        </el-form-item>

        <div v-if="error" class="register-error">
          {{ error }}
        </div>
      </el-form>
    </el-card>
  </div>
</template>

<script>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../store/modules/user'

export default {
  name: 'Register',
  setup() {
    const router = useRouter()
    const userStore = useUserStore()
    const registerFormRef = ref(null)
    
    const registerForm = reactive({
      username: '',
      email: '',
      password: '',
      confirmPassword: ''
    })

    const registerRules = {
      username: [
        { required: true, message: '请输入用户名', trigger: 'blur' },
        { min: 2, max: 50, message: '用户名长度应在2-50之间', trigger: 'blur' }
      ],
      email: [
        { required: true, message: '请输入邮箱', trigger: 'blur' },
        { type: 'email', message: '请输入有效的邮箱地址', trigger: 'blur' }
      ],
      password: [
        { required: true, message: '请输入密码', trigger: 'blur' },
        { min: 6, message: '密码长度至少为6位', trigger: 'blur' }
      ],
      confirmPassword: [
        { required: true, message: '请确认密码', trigger: 'blur' },
        {
          validator: (rule, value, callback) => {
            if (value !== registerForm.password) {
              callback(new Error('两次输入的密码不一致'))
            } else {
              callback()
            }
          },
          trigger: 'blur'
        }
      ]
    }

    const loading = ref(false)
    const error = ref('')
    const passwordStrength = ref(0)  // 0-3，0表示未输入，1弱，2中，3强
    const passwordStrengthText = ref('')

    // 检查密码强度
    const checkPasswordStrength = (password) => {
      if (!password) {
        passwordStrength.value = 0
        passwordStrengthText.value = ''
        return
      }
      
      let strength = 0
      
      // 长度检查
      if (password.length >= 6) {
        strength += 1
      }
      
      // 包含数字
      if (/\d/.test(password)) {
        strength += 1
      }
      
      // 包含字母
      if (/[a-zA-Z]/.test(password)) {
        strength += 1
      }
      
      // 包含特殊字符
      if (/[^a-zA-Z0-9]/.test(password)) {
        strength += 1
      }
      
      // 限制强度范围在1-3之间
      strength = Math.min(strength, 3)
      passwordStrength.value = strength
      
      // 更新强度文本
      switch (strength) {
        case 1:
          passwordStrengthText.value = '弱'
          break
        case 2:
          passwordStrengthText.value = '中'
          break
        case 3:
          passwordStrengthText.value = '强'
          break
        default:
          passwordStrengthText.value = ''
      }
    }

    const handleRegister = async () => {
      // 表单验证
      if (!registerFormRef.value) return
      
      try {
        await registerFormRef.value.validate()
        loading.value = true
        error.value = ''

        // 调用注册方法
        const result = await userStore.register({
          username: registerForm.username,
          email: registerForm.email,
          password: registerForm.password
        })

        // 注册成功，跳转到首页
        router.push('/')
      } catch (err) {
        error.value = userStore.error || '注册失败，请检查输入信息'
      } finally {
        loading.value = false
      }
    }

    return {
      router,
      registerForm,
      registerRules,
      registerFormRef,
      loading,
      error,
      passwordStrength,
      passwordStrengthText,
      checkPasswordStrength,
      handleRegister
    }
  }
}
</script>

<style lang="scss">
.register-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

.register-card {
  width: 100%;
  max-width: 400px;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);

  .register-header {
    text-align: center;
    margin-bottom: 20px;

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

  .register-form {
    padding: 0 20px 20px;

    .register-actions {
      display: flex;
      flex-direction: column;
      gap: 10px;
      margin-top: 20px;

      .register-button {
        width: 100%;
        height: 40px;
        font-size: 16px;
      }

      .login-button {
        width: 100%;
        height: 40px;
      }
    }

    .register-error {
      margin-top: 15px;
      padding: 10px;
      background-color: #fef0f0;
      color: #f56c6c;
      border: 1px solid #fbc4c4;
      border-radius: 4px;
      font-size: 14px;
      text-align: center;
    }
    
    .password-strength {
      margin-top: 10px;
      font-size: 14px;
      
      .strength-label {
        margin-bottom: 5px;
        color: #606266;
      }
      
      .strength-bars {
        height: 8px;
        background-color: #f0f0f0;
        border-radius: 4px;
        overflow: hidden;
        margin-bottom: 5px;
        
        .strength-bar {
          height: 100%;
          border-radius: 4px;
          transition: width 0.3s ease, background-color 0.3s ease;
          
          &.weak {
            background-color: #f56c6c;
          }
          
          &.medium {
            background-color: #e6a23c;
          }
          
          &.strong {
            background-color: #67c23a;
          }
        }
      }
      
      .strength-text {
        font-size: 12px;
        
        &.weak {
          color: #f56c6c;
        }
        
        &.medium {
          color: #e6a23c;
        }
        
        &.strong {
          color: #67c23a;
        }
      }
    }
  }
}

/* 响应式设计 */
@media (max-width: 480px) {
  .register-card {
    max-width: 100%;
  }
}
</style>
