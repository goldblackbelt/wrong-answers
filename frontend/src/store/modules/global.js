import { defineStore } from 'pinia'

export const useGlobalStore = defineStore('global', {
  state: () => ({
    // 加载状态
    loading: false,
    loadingCount: 0,
    // 错误状态
    error: null,
    // 消息提示
    message: null,
    messageType: 'info',
    // 深色模式
    darkMode: false
  }),
  
  getters: {
    isLoading: (state) => state.loadingCount > 0
  },
  
  actions: {
    // 开始加载
    startLoading() {
      this.loadingCount++
      this.loading = true
    },
    
    // 结束加载
    endLoading() {
      if (this.loadingCount > 0) {
        this.loadingCount--
      }
      if (this.loadingCount === 0) {
        this.loading = false
      }
    },
    
    // 设置错误
    setError(error) {
      this.error = error
    },
    
    // 清除错误
    clearError() {
      this.error = null
    },
    
    // 显示消息
    showMessage(message, type = 'info') {
      this.message = message
      this.messageType = type
      // 3秒后自动清除消息
      setTimeout(() => {
        this.clearMessage()
      }, 3000)
    },
    
    // 清除消息
    clearMessage() {
      this.message = null
      this.messageType = 'info'
    },
    
    // 切换深色模式
    toggleDarkMode() {
      this.darkMode = !this.darkMode
      this.updateDarkModeClass()
      // 保存到本地存储
      localStorage.setItem('darkMode', this.darkMode)
    },
    
    // 更新深色模式类
    updateDarkModeClass() {
      if (this.darkMode) {
        document.documentElement.classList.add('dark')
      } else {
        document.documentElement.classList.remove('dark')
      }
    },
    
    // 初始化深色模式
    initDarkMode() {
      const savedMode = localStorage.getItem('darkMode')
      if (savedMode !== null) {
        this.darkMode = savedMode === 'true'
      } else {
        // 检测系统偏好
        this.darkMode = window.matchMedia('(prefers-color-scheme: dark)').matches
      }
      this.updateDarkModeClass()
    }
  }
})
