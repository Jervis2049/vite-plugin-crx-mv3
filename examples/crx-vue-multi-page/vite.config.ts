import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import crx from 'vite-plugin-crx-mv3'

export default defineConfig(({ mode }) => {
  return {
    plugins: [
      vue(),
      crx({
        manifest: './src/manifest.json'
      }),
    ],
    build: {
      emptyOutDir: mode == 'production',
    },
  }
})
