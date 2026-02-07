import { createRouter, createWebHistory } from 'vue-router'

// 路由配置
const routes = [
  {
    path: '/',
    name: 'Home',
    component: () => import('../views/Home.vue'),
    meta: { requiresAuth: false, title: '首页' }
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/Login.vue'),
    meta: { title: '登录' }
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('../views/Register.vue'),
    meta: { title: '注册' }
  },
  // 其他路由
  {
    path: '/upload',
    name: 'Upload',
    component: () => import(/* webpackChunkName: "upload" */ '../views/Upload.vue'),
    meta: { requiresAuth: false, title: '上传错题' }
  },
  {
    path: '/questions',
    name: 'Questions',
    component: () => import(/* webpackChunkName: "questions" */ '../views/Questions.vue'),
    meta: { requiresAuth: false, title: '错题列表' }
  },
  {
    path: '/question/:id',
    name: 'QuestionDetail',
    component: () => import(/* webpackChunkName: "question-detail" */ '../views/QuestionDetail.vue'),
    meta: { requiresAuth: false, title: '错题详情' }
  },
  {
    path: '/analysis',
    name: 'Analysis',
    component: () => import(/* webpackChunkName: "analysis" */ '../views/Analysis.vue'),
    meta: { requiresAuth: false, title: '分析报告' }
  },
  {
    path: '/review',
    name: 'Review',
    component: () => import(/* webpackChunkName: "review" */ '../views/Review.vue'),
    meta: { requiresAuth: false, title: '复习计划' }
  },
  {
    path: '/practice',
    name: 'Practice',
    component: () => import(/* webpackChunkName: "practice" */ '../views/Practice.vue'),
    meta: { requiresAuth: false, title: '练习中心' }
  },
  {
    path: '/profile',
    name: 'Profile',
    component: () => import(/* webpackChunkName: "profile" */ '../views/Profile.vue'),
    meta: { requiresAuth: false, title: '个人中心' }
  },
  {
    path: '/settings',
    name: 'Settings',
    component: () => import(/* webpackChunkName: "settings" */ '../views/Settings.vue'),
    meta: { requiresAuth: false, title: '设置' }
  },
  // 404页面
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import(/* webpackChunkName: "not-found" */ '../views/NotFound.vue'),
    meta: { title: '页面不存在' }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 路由守卫
router.beforeEach((to, from, next) => {
  // 设置页面标题
  document.title = to.meta.title || '错题本系统'

  // 检查是否需要认证
  if (to.meta.requiresAuth) {
    const token = localStorage.getItem('token')
    if (!token) {
      // 未登录，跳转到登录页
      next({ name: 'Login' })
    } else {
      // 已登录，继续导航
      next()
    }
  } else {
    // 不需要认证的页面，直接导航
    next()
  }
})

export default router
