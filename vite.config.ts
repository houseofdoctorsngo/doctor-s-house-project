import { defineConfig, loadEnv } from 'vite';
import { tanstackStart } from '@tanstack/react-start/plugin/vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import tsconfigPaths from 'vite-tsconfig-paths';
import { nitro } from 'nitro/vite';

export default defineConfig(({ mode }) => {
  // Server variables are read at runtime; only VITE_* is exposed to client code.
  const local = loadEnv(mode, process.cwd(), '');
  for (const [key, value] of Object.entries(local)) if (process.env[key] === undefined) process.env[key] = value;
  return {
    plugins: [tsconfigPaths(), tailwindcss(), tanstackStart({ server: { entry: 'server' } }), nitro({ preset: 'node-server' }), react()],
    server: { host: '127.0.0.1', port: 3000 },
  };
});
