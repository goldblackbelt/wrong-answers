<template>
  <div class="review-container">
    <el-card shadow="hover" class="review-card">
      <template #header>
        <div class="review-header">
          <el-button type="primary" plain @click="router.back()">
            返回
          </el-button>
          <h2>复习计划</h2>
        </div>
      </template>

      <div class="review-content">
        <p>该功能正在开发中，敬请期待！</p>
      </div>
    </el-card>
  </div>
</template>

<script>
import { useRouter } from 'vue-router'
import { ArrowLeft } from '@element-plus/icons-vue'

export default {
  name: 'Review',
  components: {
    ArrowLeft
  },
  setup() {
    const router = useRouter()
    
    return {
      router
    }
  }
}
</script>

<style lang="scss">
.review-container {
  padding: 20px;
}

.review-card {
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);

  .review-header {
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

  .review-content {
    padding: 0 20px 20px;
    text-align: center;

    p {
      font-size: 16px;
      color: #606266;
      margin: 40px 0;
    }
  }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .review-container {
    padding: 10px;
  }

  .review-card {
    .review-content {
      padding: 0 10px 10px;
    }
  }
}
</style>