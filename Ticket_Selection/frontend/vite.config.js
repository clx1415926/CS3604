import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    open: false,
    strictPort: false, // 如果端口被占用，自动尝试下一个可用端口
    fs: {
      allow: [
        'd:/HW/CS3601/CS3604/12306_ticket_selection',
        'D:/HW/CS3601/CS3604/12306_ticket_selection',
        'd:/HW/CS3601/CS3604/Ticket_Selection/frontend',
        'D:/HW/CS3601/CS3604/Ticket_Selection/frontend',
        'd:/HW/CS3601/CS3604/Ticket_Selection/frontend/src',
        'D:/HW/CS3601/CS3604/Ticket_Selection/frontend/src'
      ]
    },
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      '/12306_homepage': {
        target: 'http://localhost:8099',
        changeOrigin: true,
      },
    },
  },
});
