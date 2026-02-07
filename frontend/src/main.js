import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import axios from 'axios'

// 配置axios
axios.defaults.baseURL = '/api'
axios.defaults.timeout = 10000

// 导入全局状态管理
import { useGlobalStore } from './store/modules/global'

// 请求拦截器
axios.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    
    // 显示加载状态
    const globalStore = useGlobalStore()
    globalStore.startLoading()
    
    return config
  },
  error => {
    // 隐藏加载状态
    const globalStore = useGlobalStore()
    globalStore.endLoading()
    
    return Promise.reject(error)
  }
)

// 响应拦截器
axios.interceptors.response.use(
  response => {
    // 隐藏加载状态
    const globalStore = useGlobalStore()
    globalStore.endLoading()
    
    return response
  },
  error => {
    // 隐藏加载状态
    const globalStore = useGlobalStore()
    globalStore.endLoading()
    
    if (error.response && error.response.status === 401) {
      // 未授权，跳转到登录页
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      router.push('/login')
    }
    
    return Promise.reject(error)
  }
)

const app = createApp(App)

app.use(router)
app.use(store)
app.use(ElementPlus)

// 全局属性
app.config.globalProperties.$axios = axios

app.mount('#app')
