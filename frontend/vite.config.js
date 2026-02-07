import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'
import { visualizer } from 'rollup-plugin-visualizer'

// https://vitejs.dev/config/
export default defineConfig({
  root: path.resolve(__dirname),
  plugins: [
    vue(),
    // 构建分析插件，仅在需要时启用
    process.env.ANALYZE === 'true' && visualizer({
      open: true,
      gzipSize: true,
      brotliSize: true
    })
  ].filter(Boolean),
  server: {
    port: 8080,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true
      }
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src')
    }
  },
  build: {
    outDir: './dist',
    assetsDir: 'assets',
    minify: 'terser',
    sourcemap: false,
    // 添加资源哈希，用于缓存优化
    rollupOptions: {
      output: {
        manualChunks: {
          // 分离第三方库
          vendor: ['vue', 'vue-router', 'pinia'],
          // 分离Element Plus
          elementPlus: ['element-plus'],
          // 分离ECharts
          echarts: ['echarts']
        },
        // 资源哈希命名
        entryFileNames: 'assets/js/[name]-[hash].js',
        chunkFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: 'assets/[ext]/[name]-[hash].[ext]'
      }
    },
    // CSS优化
    cssCodeSplit: true,
    // 生产环境移除console和debugger
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    }
  }
})