import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, type IndexHtmlTransformResult} from 'vite';

const disableHostedHmrClient = {
  name: 'disable-hosted-hmr-client',
  transformIndexHtml(html: string): IndexHtmlTransformResult {
    return html.replace(/<script[^>]+src=["']\/?@vite\/client["'][^>]*><\/script>/g, '');
  },
};

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), disableHostedHmrClient],
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
