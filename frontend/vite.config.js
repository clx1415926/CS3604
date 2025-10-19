import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.js',
    // 添加Jest兼容性
    includeSource: ['src/**/*.{js,ts,jsx,tsx}'],
    // 配置测试文件匹配模式
    include: ['test/**/*.{test,spec}.{js,ts,jsx,tsx}'],
  },
});