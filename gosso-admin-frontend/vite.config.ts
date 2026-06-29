import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const appBasePath = env.VITE_APP_BASE_PATH || '/';

  return {
    base: appBasePath.endsWith('/') ? appBasePath : `${appBasePath}/`,
    plugins: [react()],
    server: {
      port: 8083,
      host: '0.0.0.0',
      proxy: {
        '/readiness': 'http://localhost:8080',
        '/api/v1': 'http://localhost:8080',
        '/oauth2': 'http://localhost:8080',
        '/oidc': 'http://localhost:8080',
        '/.well-known': 'http://localhost:8080',
      },
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks(id: string) {
            if (
              id.includes('node_modules/react') ||
              id.includes('node_modules/react-dom') ||
              id.includes('node_modules/react-router')
            ) {
              return 'vendor';
            }
          },
        },
      },
    },
  };
});
