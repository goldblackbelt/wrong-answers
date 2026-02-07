import { defineStore } from 'pinia'
import axios from 'axios'

export const useUserStore = defineStore('user', {
  state: () => ({
    user: null,
    token: localStorage.getItem('token') || '',
    loading: false,
    error: ''
  }),

  getters: {
    isLoggedIn: (state) => !!state.token,
    getUser: (state) => state.user
  },

  actions: {
    // 登录
    async login(credentials) {
      this.loading = true
      this.error = ''
      
      try {
        const response = await axios.post('/auth/login', credentials)
        const { token, user } = response.data.data
        
        // 存储token和用户信息
        localStorage.setItem('token', token)
        localStorage.setItem('user', JSON.stringify(user))
        
        this.token = token
        this.user = user
        
        return response.data
      } catch (error) {
        this.error = error.response?.data?.message || '登录失败，请检查邮箱和密码'
        throw error
      } finally {
        this.loading = false
      }
    },

    // 注册
    async register(userData) {
      this.loading = true
      this.error = ''
      
      try {
        const response = await axios.post('/auth/register', userData)
        const { token, user } = response.data.data
        
        // 存储token和用户信息
        localStorage.setItem('token', token)
        localStorage.setItem('user', JSON.stringify(user))
        
        this.token = token
        this.user = user
        
        return response.data
      } catch (error) {
        this.error = error.response?.data?.message || '注册失败，请检查输入信息'
        throw error
      } finally {
        this.loading = false
      }
    },

    // 获取用户信息
    async getUserInfo() {
      this.loading = true
      this.error = ''
      
      try {
        // 尝试从localStorage获取用户信息
        const storedUser = localStorage.getItem('user')
        if (storedUser) {
          this.user = JSON.parse(storedUser)
        }
        
        // 从服务器获取最新用户信息
        const response = await axios.get('/auth/me')
        const user = response.data.data.user
        
        // 更新localStorage和状态
        localStorage.setItem('user', JSON.stringify(user))
        this.user = user
        
        return user
      } catch (error) {
        // 如果获取失败，清除本地存储
        this.logout()
        throw error
      } finally {
        this.loading = false
      }
    },

    // 退出登录
    logout() {
      // 清除本地存储
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      
      // 重置状态
      this.token = ''
      this.user = null
      this.error = ''
    },

    // 更新用户信息
    async updateUserInfo(userData) {
      this.loading = true
      this.error = ''
      
      try {
        const response = await axios.put('/auth/update', userData)
        const updatedUser = response.data.data.user
        
        // 更新localStorage和状态
        localStorage.setItem('user', JSON.stringify(updatedUser))
        this.user = updatedUser
        
        return updatedUser
      } catch (error) {
        this.error = error.response?.data?.message || '更新用户信息失败'
        throw error
      } finally {
        this.loading = false
      }
    }
  }
})
