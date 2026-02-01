import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const backendHost = env.BACKEND_HOST || 'localhost';
  const backendPort = env.BACKEND_PORT || '8000';
  const backendUrl = `http://${backendHost}:${backendPort}`;

  return {
    plugins: [react()],
    server: {
      proxy: {
        '/api': backendUrl,
      }
    },
    preview: {
      proxy: {
        '/api': backendUrl,
      }
    }
  }
})
