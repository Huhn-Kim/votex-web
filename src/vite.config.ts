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
  },
  server: {
    host: true, // 모든 네트워크 인터페이스에서 접근 가능
    port: 5174,
    strictPort: true, // 지정된 포트를 엄격하게 사용
    hmr: {
      clientPort: 5174, // HMR 클라이언트 포트 지정
      host: 'localhost', // HMR 호스트 지정
    },
    watch: {
      usePolling: true, // 파일 변경 감지를 위한 폴링 사용
    },
  }
})
