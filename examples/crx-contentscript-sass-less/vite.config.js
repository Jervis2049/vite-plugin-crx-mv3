import { defineConfig } from 'vite'
import crx from 'vite-plugin-crx-mv3'

export default defineConfig(({ mode }) => {
  return {
    plugins: [
      crx({
        manifest: './src/manifest.json'
      })
    ],
    build: {
      emptyOutDir: mode == 'production'
    }
  }
})
