import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: [],
    // S4/S5 Engine 重构后，engine 测试依赖真实 API，排除
    // memory/self_improve 测试为旧 tsx 格式，排除
    exclude: [
      'test/engine.test.ts',
      'test/memory.test.ts',
      'test/self_improve.test.ts',
      'test/tools/integration.test.ts',
      'node_modules/**',
    ],
  },
});
