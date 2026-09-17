import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // Google AI Studio and the hosted preview do not provide a stable
      // WebSocket endpoint for Vite HMR. Disable the client and watcher so
      // the app does not keep retrying a socket that can never open.
      hmr: false,
      watch: null,
    },
  };
});
