import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@mui/material': '@mui/material/index',
      '@mui/icons-material': '@mui/icons-material/index',
    },
  },
  build: {
    rollupOptions: {
      external: ['@emotion/react', '@emotion/styled'],
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          ui: ['@mui/material', '@emotion/react', '@emotion/styled'],
          utils: ['date-fns', 'lodash'],
        }
      }
    },
    // 청크 크기 경고 제한 조정 (선택사항)
    chunkSizeWarningLimit: 1000,
  }
})
