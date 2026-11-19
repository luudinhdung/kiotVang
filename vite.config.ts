import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'kiotviet-express-api',
      async configureServer(server) {
        const { createApiMiddleware } = await import('./server/api');
        server.middlewares.use(createApiMiddleware());
      },
      async configurePreviewServer(server) {
        const { createApiMiddleware } = await import('./server/api');
        server.middlewares.use(createApiMiddleware());
      }
    }
  ],
  server: {
    port: Number(process.env.PORT) || 5173,
    host: true,
    allowedHosts: true
  },
  preview: {
    port: Number(process.env.PORT) || 5173,
    host: true,
    allowedHosts: true
  }
});
