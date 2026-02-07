<template>
  <div class="not-found-container">
    <el-card shadow="hover" class="not-found-card">
      <template #header>
        <div class="not-found-header">
          <el-button type="primary" plain @click="router.push('/')">
            返回首页
          </el-button>
        </div>
      </template>

      <div class="not-found-content">
        <h2>404</h2>
        <p>抱歉，您访问的页面不存在！</p>
        <el-button type="primary" @click="router.push('/')">返回首页</el-button>
      </div>
    </el-card>
  </div>
</template>

<script>
import { useRouter } from 'vue-router'

export default {
  name: 'NotFound',
  setup() {
    const router = useRouter()
    
    return {
      router
    }
  }
}
</script>

<style lang="scss">
.not-found-container {
  padding: 20px;
  min-height: 80vh;
  display: flex;
  align-items: center;
  justify-content: center;
}

.not-found-card {
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 500px;

  .not-found-header {
    margin-bottom: 30px;
  }

  .not-found-content {
    padding: 20px;
    text-align: center;

    h2 {
      font-size: 48px;
      font-weight: bold;
      color: #f56c6c;
      margin: 0 0 20px 0;
    }

    p {
      font-size: 16px;
      color: #606266;
      margin: 0 0 30px 0;
    }
  }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .not-found-container {
    padding: 10px;
  }

  .not-found-card {
    .not-found-content {
      padding: 10px;

      h2 {
        font-size: 36px;
      }
    }
  }
}
</style>