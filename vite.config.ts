import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    chunkSizeWarningLimit: 1000, // 경고 제한 상향 조정
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          mui: ['@mui/material', '@mui/icons-material'],
          utils: ['date-fns'],
          supabase: ['@supabase/supabase-js'], // supabase 청크 추가
          charts: ['chart.js', 'react-chartjs-2'] // 차트 관련 라이브러리 별도 청크로 분리
        }
      }
    },
    target: ['es2020', 'edge88', 'firefox78', 'chrome87', 'safari14'], // 최신 브라우저 지원
    minify: 'terser', // 더 효율적인 압축
    terserOptions: {
      compress: {
        drop_console: false, // 콘솔 로그 유지 (디버깅 필요시 true로 변경)
        drop_debugger: true
      }
    }
  },
  optimizeDeps: {
    include: ['chart.js', 'react-chartjs-2'] // 차트 관련 라이브러리 최적화 대상에 추가
  }
}) 