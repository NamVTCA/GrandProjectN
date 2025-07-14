import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // Định nghĩa '@' là đường dẫn tắt đến thư mục 'src'
      '@': path.resolve(__dirname, './src'),
    },
  },
  // --- PHẦN QUAN TRỌNG NHẤT ĐỂ SỬA LỖI ---
  css: {
    preprocessorOptions: {
      scss: {
        // Tự động import các biến vào mọi tệp SCSS.
        // Giờ đây bạn không cần phải @use ở đầu mỗi tệp nữa.
        additionalData: `@import "@/styles/_variables.scss";`
      }
    }
  }
})
