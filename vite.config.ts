import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import electron from 'vite-plugin-electron';

// https://vite.dev/config/
export default defineConfig({
  base: './',
  plugins: [
    react(),
    electron([
      {
        // Main-process entrypoint of the Electron App.
        entry: 'electron/main.ts',
      },
      {
        entry: 'electron/preload.ts',
        onstart(options) {
          options.reload();
        },
      },
    ]),
  ],
});
