import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      'react': path.resolve(__dirname, '../../Ticket_Management/frontend/node_modules/react'),
      'react-dom': path.resolve(__dirname, '../../Ticket_Management/frontend/node_modules/react-dom'),
      '@testing-library/react': path.resolve(__dirname, '../../Ticket_Management/frontend/node_modules/@testing-library/react'),
      '@testing-library/jest-dom': path.resolve(__dirname, '../../Ticket_Management/frontend/node_modules/@testing-library/jest-dom'),
      '@testing-library/user-event': path.resolve(__dirname, '../../Ticket_Management/frontend/node_modules/@testing-library/user-event'),
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    globals: true,
  }
});


