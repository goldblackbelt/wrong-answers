<template>
  <div class="app-container">
    <!-- 全局加载状态 -->
    <GlobalLoading />
    
    <!-- 导航栏 -->
    <el-header height="60px" class="app-header">
      <div class="header-left">
        <!-- 移动端菜单按钮 -->
        <el-button
          type="text"
          class="mobile-menu-button"
          @click="toggleMobileMenu"
          v-if="user"
        >
          <el-icon><Menu /></el-icon>
        </el-button>
        <h1 class="app-title">错题本系统</h1>
      </div>
      <div class="header-right">
        <el-dropdown v-if="user" @command="handleCommand">
          <span class="user-info">
            {{ user.username }}
            <el-icon class="el-icon--right"><ArrowDown /></el-icon>
          </span>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="profile">个人中心</el-dropdown-item>
              <el-dropdown-item command="settings">设置</el-dropdown-item>
              <el-dropdown-item command="logout" divided>退出登录</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
        <el-button v-else type="primary" @click="router.push('/login')">登录</el-button>
      </div>
    </el-header>

    <!-- 移动端侧边栏 -->
    <div class="mobile-sidebar-overlay" v-if="mobileMenuOpen" @click="toggleMobileMenu"></div>
    <el-aside width="250px" class="app-sidebar mobile-sidebar" v-if="user && mobileMenuOpen">
      <div class="mobile-sidebar-header">
        <h3>菜单</h3>
        <el-button type="text" @click="toggleMobileMenu">
          <el-icon><Close /></el-icon>
        </el-button>
      </div>
      <el-menu
        :default-active="activeMenu"
        class="sidebar-menu"
        router
        @select="handleMenuSelect"
      >
        <el-menu-item index="/">
          <el-icon><House /></el-icon>
          <span>首页</span>
        </el-menu-item>
        <el-menu-item index="/upload">
          <el-icon><Upload /></el-icon>
          <span>上传错题</span>
        </el-menu-item>
        <el-menu-item index="/questions">
          <el-icon><Document /></el-icon>
          <span>错题列表</span>
        </el-menu-item>
        <el-menu-item index="/analysis">
          <el-icon><DataAnalysis /></el-icon>
          <span>分析报告</span>
        </el-menu-item>
        <el-menu-item index="/review">
          <el-icon><Timer /></el-icon>
          <span>复习计划</span>
        </el-menu-item>
        <el-menu-item index="/practice">
          <el-icon><Checked /></el-icon>
          <span>练习中心</span>
        </el-menu-item>
      </el-menu>
    </el-aside>

    <!-- 主体内容 -->
    <el-container class="app-main">
      <!-- 侧边栏 -->
      <el-aside width="200px" class="app-sidebar desktop-sidebar" v-if="user">
        <el-menu
          :default-active="activeMenu"
          class="sidebar-menu"
          router
          @select="handleMenuSelect"
        >
          <el-menu-item index="/">
            <el-icon><House /></el-icon>
            <span>首页</span>
          </el-menu-item>
          <el-menu-item index="/upload">
            <el-icon><Upload /></el-icon>
            <span>上传错题</span>
          </el-menu-item>
          <el-menu-item index="/questions">
            <el-icon><Document /></el-icon>
            <span>错题列表</span>
          </el-menu-item>
          <el-menu-item index="/analysis">
            <el-icon><DataAnalysis /></el-icon>
            <span>分析报告</span>
          </el-menu-item>
          <el-menu-item index="/review">
            <el-icon><Timer /></el-icon>
            <span>复习计划</span>
          </el-menu-item>
          <el-menu-item index="/practice">
            <el-icon><Checked /></el-icon>
            <span>练习中心</span>
          </el-menu-item>
        </el-menu>
      </el-aside>

      <!-- 内容区域 -->
      <el-main class="app-content">
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </el-main>
    </el-container>

    <!-- 页脚 -->
    <el-footer height="40px" class="app-footer">
      <p>© 2024 错题本系统 - 帮助学生高效学习</p>
    </el-footer>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useUserStore } from './store/modules/user'
import { useGlobalStore } from './store/modules/global'
import GlobalLoading from './components/GlobalLoading.vue'
import { ArrowDown, House, Upload, Document, DataAnalysis, Timer, Checked, Menu, Close } from '@element-plus/icons-vue'

export default {
  name: 'App',
  components: {
    ArrowDown,
    House,
    Upload,
    Document,
    DataAnalysis,
    Timer,
    Checked,
    Menu,
    Close,
    GlobalLoading
  },
  setup() {
    const router = useRouter()
    const route = useRoute()
    const userStore = useUserStore()
    const globalStore = useGlobalStore()
    
    const user = computed(() => userStore.user)
    const mobileMenuOpen = ref(false)
    
    const activeMenu = computed(() => {
      return route.path || '/' 
    })

    const handleCommand = (command) => {
      switch (command) {
        case 'profile':
          router.push('/profile')
          break
        case 'settings':
          router.push('/settings')
          break
        case 'logout':
          userStore.logout()
          router.push('/login')
          break
        default:
          break
      }
    }

    const handleMenuSelect = (key, keyPath) => {
      // 菜单选择处理
      // 在移动端，选择菜单后关闭菜单
      if (mobileMenuOpen.value) {
        mobileMenuOpen.value = false
      }
    }

    const toggleMobileMenu = () => {
      mobileMenuOpen.value = !mobileMenuOpen.value
    }

    onMounted(() => {
      // 初始化深色模式
      globalStore.initDarkMode()
      
      // 检查登录状态
      const token = localStorage.getItem('token')
      if (token) {
        userStore.getUserInfo()
      }
    })

    return {
      user,
      router,
      activeMenu,
      handleCommand,
      handleMenuSelect,
      mobileMenuOpen,
      toggleMobileMenu
    }
  }
}
</script>

<style lang="scss">
.app-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: #f5f7fa;
}

.app-header {
  background-color: #409eff;
  color: white;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  position: relative;
  z-index: 100;

  .header-left {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .app-title {
    margin: 0;
    font-size: 18px;
    font-weight: bold;
  }

  .mobile-menu-button {
    color: white;
    font-size: 20px;
    display: none;

    .el-icon {
      font-size: 24px;
    }
  }

  .header-right {
    display: flex;
    align-items: center;

    .user-info {
      cursor: pointer;
      padding: 0 10px;
      height: 40px;
      line-height: 40px;
      border-radius: 20px;
      transition: background-color 0.3s;

      &:hover {
        background-color: rgba(255, 255, 255, 0.1);
      }
    }
  }
}

.app-main {
  flex: 1;
  display: flex;
  margin: 20px;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  background-color: white;
}

/* 桌面端侧边栏 */
.desktop-sidebar {
  background-color: #f0f2f5;
  border-right: 1px solid #e4e7ed;

  .sidebar-menu {
    height: 100%;
    border-right: none;

    .el-menu-item {
      height: 60px;
      line-height: 60px;
      margin: 5px 0;

      &:hover {
        background-color: rgba(64, 158, 255, 0.1);
      }

      &.is-active {
        color: #409eff;
        background-color: rgba(64, 158, 255, 0.1);
        border-right: 3px solid #409eff;
      }
    }
  }
}

/* 移动端侧边栏 */
.mobile-sidebar-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 999;
  transition: opacity 0.3s ease;
}

.mobile-sidebar {
  position: fixed;
  top: 0;
  left: 0;
  height: 100vh;
  width: 250px;
  background-color: white;
  box-shadow: 2px 0 10px rgba(0, 0, 0, 0.1);
  z-index: 1000;
  transition: transform 0.3s ease;
  display: flex;
  flex-direction: column;

  .mobile-sidebar-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 15px 20px;
    border-bottom: 1px solid #e4e7ed;

    h3 {
      margin: 0;
      font-size: 16px;
      font-weight: bold;
    }

    .el-button {
      color: #606266;

      .el-icon {
        font-size: 20px;
      }
    }
  }

  .sidebar-menu {
    flex: 1;
    border-right: none;

    .el-menu-item {
      height: 50px;
      line-height: 50px;
      margin: 0;

      &:hover {
        background-color: rgba(64, 158, 255, 0.1);
      }

      &.is-active {
        color: #409eff;
        background-color: rgba(64, 158, 255, 0.1);
        border-right: 3px solid #409eff;
      }
    }
  }
}

.app-content {
  padding: 20px;
  overflow-y: auto;
}

.app-footer {
  background-color: #f0f2f5;
  color: #606266;
  text-align: center;
  line-height: 40px;
  font-size: 12px;
  border-top: 1px solid #e4e7ed;
}

/* 过渡动画 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .app-header {
    .mobile-menu-button {
      display: flex;
      align-items: center;
    }

    .app-title {
      font-size: 16px;
    }

    .header-right {
      .el-button {
        padding: 0 12px;
        font-size: 14px;
      }

      .user-info {
        font-size: 14px;
        padding: 0 8px;
      }
    }
  }

  .app-main {
    margin: 10px;
  }

  .app-content {
    padding: 10px;
  }

  /* 隐藏桌面端侧边栏，显示移动端菜单 */
  .desktop-sidebar {
    display: none;
  }

  /* 确保内容区域占满宽度 */
  .app-main {
    flex-direction: column;
  }

  /* 调整页脚字体大小 */
  .app-footer {
    font-size: 10px;
  }
}

/* 平板设备响应式设计 */
@media (min-width: 769px) and (max-width: 1024px) {
  .app-header {
    padding: 0 15px;

    .app-title {
      font-size: 16px;
    }
  }

  .app-main {
    margin: 15px;
  }

  .app-content {
    padding: 15px;
  }

  .desktop-sidebar {
    width: 180px !important;

    .el-menu-item {
      font-size: 14px;
    }
  }
}
</style>
