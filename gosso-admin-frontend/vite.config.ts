import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { defineConfig, loadEnv, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

const require = createRequire(import.meta.url);
const gounoUiBootstrap = readFileSync(require.resolve('@gouno/ui/bootstrap.js'), 'utf8');
const gossoAdminFavicon = readFileSync(
  require.resolve('@gouno/ui/brand-icons/gosso-admin.svg'),
  'utf8'
);

function gounoUiRuntimeAssets(): Plugin {
  return {
    name: 'gouno-ui-runtime-assets',
    configureServer(server) {
      server.middlewares.use((request, response, next) => {
        const pathname = request.url
          ? new URL(request.url, 'http://localhost').pathname
          : '';
        if (!pathname.endsWith('/gosso-admin.svg')) {
          next();
          return;
        }
        response.statusCode = 200;
        response.setHeader('Content-Type', 'image/svg+xml; charset=utf-8');
        response.end(gossoAdminFavicon);
      });
    },
    buildStart() {
      this.emitFile({
        type: 'asset',
        fileName: 'gosso-admin.svg',
        source: gossoAdminFavicon,
      });
    },
    transformIndexHtml() {
      return [
        {
          tag: 'script',
          attrs: {
            'data-storage-key': 'gosso-admin:theme',
            'data-brand': 'gosso-admin',
          },
          children: gounoUiBootstrap,
          injectTo: 'head-prepend',
        },
      ];
    },
  };
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const appBasePath = env.VITE_APP_BASE_PATH || '/';

  return {
    base: appBasePath.endsWith('/') ? appBasePath : `${appBasePath}/`,
    plugins: [gounoUiRuntimeAssets(), tailwindcss(), react()],
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
