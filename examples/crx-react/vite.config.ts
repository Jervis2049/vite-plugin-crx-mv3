import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import crx from 'vite-plugin-crx-mv3'

export default defineConfig({
  plugins: [
    react(), 
    crx({
      manifest: './src/manifest.json'
    })
  ]
})