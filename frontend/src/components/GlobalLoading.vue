<template>
  <div v-if="isLoading" class="global-loading">
    <div class="loading-content">
      <el-icon class="loading-icon"><Loading /></el-icon>
      <p class="loading-text">{{ loadingText }}</p>
    </div>
  </div>
</template>

<script>
import { computed } from 'vue'
import { useGlobalStore } from '../store/modules/global'
import { Loading } from '@element-plus/icons-vue'

export default {
  name: 'GlobalLoading',
  components: {
    Loading
  },
  props: {
    loadingText: {
      type: String,
      default: '加载中...'
    }
  },
  setup() {
    const globalStore = useGlobalStore()
    const isLoading = computed(() => globalStore.isLoading)
    
    return {
      isLoading
    }
  }
}
</script>

<style lang="scss">
.global-loading {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(255, 255, 255, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  backdrop-filter: blur(2px);
  
  .loading-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 20px;
    padding: 40px;
    background-color: white;
    border-radius: 12px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
    
    .loading-icon {
      font-size: 48px;
      color: #409eff;
      animation: spin 1s linear infinite;
    }
    
    .loading-text {
      font-size: 16px;
      color: #303133;
      margin: 0;
    }
  }
  
  @keyframes spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }
  
  // 深色模式
  .dark & {
    background-color: rgba(0, 0, 0, 0.9);
    
    .loading-content {
      background-color: #1f1f1f;
      
      .loading-text {
        color: #e0e0e0;
      }
    }
  }
}
</style>
