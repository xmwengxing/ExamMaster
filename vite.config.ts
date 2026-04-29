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
            target: 'http://localhost:3301',
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
        // 代码分割优化（保守策略，避免模块依赖问题）
        rollupOptions: {
          output: {
            manualChunks: {
              // React 相关库单独打包
              'react-vendor': ['react', 'react-dom'],
              // 图表库单独打包
              'chart-vendor': ['recharts'],
              // Markdown 库
              'markdown-vendor': ['marked'],
            }
          }
        },
        // 提高 chunk 大小警告阈值到 3000 KB（消除警告）
        chunkSizeWarningLimit: 3000,
        // 启用 CSS 代码分割
        cssCodeSplit: true,
        // 不生成 sourcemap（减小文件大小）
        sourcemap: false,
        // 使用 esbuild 压缩（更快）
        minify: 'esbuild',
        // 目标浏览器（支持现代浏览器，生成更小的代码）
        target: 'es2015',
      }
    };
});
