import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  css: {
    preprocessorOptions: {
      scss: {
        // Tự động NẠP các module vào MỌI tệp SCSS bằng @use.
        // Dòng này sẽ cung cấp tất cả biến, mixin và cả sass:color
        // cho toàn bộ dự án.
        additionalData: `@use "@/styles/index.scss" as *;`
      }
    }
  }
})