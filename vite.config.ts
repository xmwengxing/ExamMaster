import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 5173,
        host: '0.0.0.0',
        proxy: {
          '/api': {
            target: 'http://localhost:3001',
            changeOrigin: true,
            secure: false
          }
        }
      },
      plugins: [react()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      build: {
        // 代码分割优化
        rollupOptions: {
          output: {
            manualChunks: {
              // React 相关库单独打包
              'react-vendor': ['react', 'react-dom'],
              // 图表库单独打包（如果使用）
              'chart-vendor': ['recharts'],
              // 其他大型库
              'utils': ['marked'],
            }
          }
        },
        // 提高 chunk 大小警告阈值到 1000KB
        chunkSizeWarningLimit: 1000,
        // 启用 CSS 代码分割
        cssCodeSplit: true,
        // 生成 sourcemap（可选，用于调试）
        sourcemap: false,
        // 使用默认的 esbuild 压缩（更快）
        minify: 'esbuild',
      }
    };
});
