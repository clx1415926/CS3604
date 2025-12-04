import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    open: false,
    strictPort: false, // 如果端口被占用，自动尝试下一个可用端口
    fs: {
      allow: [
        resolve(__dirname, '../..'), // 项目根目录
        resolve(__dirname, '.'),     // 当前目录
        resolve(__dirname, 'src'),   // src目录
        resolve(__dirname, 'public') // public目录
      ]
    },
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      '/12306_homepage': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
});
