import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import fs from 'fs'

function chatPersistPlugin(): Plugin {
  const HISTORY_FILE = path.resolve(__dirname, 'chat-history.jsonl');
  return {
    name: 'chat-persist',
    configureServer(server) {
      server.middlewares.use('/api/save-chat', (req, res) => {
        if (req.method !== 'POST') { res.statusCode = 405; res.end(); return; }
        let body = '';
        req.on('data', (c: Buffer) => body += c.toString());
        req.on('end', () => {
          try {
            fs.appendFileSync(HISTORY_FILE, JSON.stringify(JSON.parse(body)) + '\n', 'utf-8');
            res.statusCode = 200; res.end(JSON.stringify({ ok: true }));
          } catch (e: any) {
            res.statusCode = 400; res.end(JSON.stringify({ ok: false, error: e.message }));
          }
        });
      });
    },
  };
}

export default defineConfig({
  plugins: [chatPersistPlugin(), react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    proxy: {
      '/api/deepseek': {
        target: 'https://api.deepseek.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/deepseek/, ''),
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq) => {
            proxyReq.removeHeader('origin');
            proxyReq.removeHeader('referer');
          });
        },
      },
    },
  },
})
