<template>
  <div class="login-container">
    <el-card class="login-card" shadow="hover">
      <template #header>
        <div class="login-header">
          <h2>错题本系统</h2>
          <p>登录账号</p>
        </div>
      </template>

      <el-form
        :model="loginForm"
        :rules="loginRules"
        ref="loginFormRef"
        label-position="top"
        class="login-form"
      >
        <el-form-item label="邮箱" prop="email">
          <el-input
            v-model="loginForm.email"
            placeholder="请输入邮箱"
            prefix-icon="el-icon-message"
            type="email"
          />
        </el-form-item>

        <el-form-item label="密码" prop="password">
          <el-input
            v-model="loginForm.password"
            placeholder="请输入密码"
            prefix-icon="el-icon-lock"
            type="password"
            show-password
          />
        </el-form-item>

        <el-form-item class="login-actions">
          <el-button type="primary" :loading="loading" @click="handleLogin" class="login-button">
            登录
          </el-button>
          <el-button @click="router.push('/register')" class="register-button">
            注册新账号
          </el-button>
        </el-form-item>

        <div v-if="error" class="login-error">
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
  name: 'Login',
  setup() {
    const router = useRouter()
    const userStore = useUserStore()
    const loginFormRef = ref(null)
    
    const loginForm = reactive({
      email: '',
      password: ''
    })

    const loginRules = {
      email: [
        { required: true, message: '请输入邮箱', trigger: 'blur' },
        { type: 'email', message: '请输入有效的邮箱地址', trigger: 'blur' }
      ],
      password: [
        { required: true, message: '请输入密码', trigger: 'blur' },
        { min: 6, message: '密码长度至少为6位', trigger: 'blur' }
      ]
    }

    const loading = ref(false)
    const error = ref('')

    const handleLogin = async () => {
      // 表单验证
      if (!loginFormRef.value) return
      
      try {
        await loginFormRef.value.validate()
        loading.value = true
        error.value = ''

        // 调用登录方法
        const result = await userStore.login({
          email: loginForm.email,
          password: loginForm.password
        })

        // 登录成功，跳转到首页
        router.push('/')
      } catch (err) {
        error.value = userStore.error || '登录失败，请检查邮箱和密码'
      } finally {
        loading.value = false
      }
    }

    return {
      router,
      loginForm,
      loginRules,
      loginFormRef,
      loading,
      error,
      handleLogin
    }
  }
}
</script>

<style lang="scss">
.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

.login-card {
  width: 100%;
  max-width: 400px;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);

  .login-header {
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

  .login-form {
    padding: 0 20px 20px;

    .login-actions {
      display: flex;
      flex-direction: column;
      gap: 10px;
      margin-top: 20px;

      .login-button {
        width: 100%;
        height: 40px;
        font-size: 16px;
      }

      .register-button {
        width: 100%;
        height: 40px;
      }
    }

    .login-error {
      margin-top: 15px;
      padding: 10px;
      background-color: #fef0f0;
      color: #f56c6c;
      border: 1px solid #fbc4c4;
      border-radius: 4px;
      font-size: 14px;
      text-align: center;
    }
  }
}

/* 响应式设计 */
@media (max-width: 480px) {
  .login-card {
    max-width: 100%;
  }
}
</style>
