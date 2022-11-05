import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import crx from 'vite-plugin-crx-mv3'
import { resolve } from 'path'

export default ({mode})=>{
  return defineConfig({
    build: {
      emptyOutDir: mode == 'production',
      rollupOptions: {
        input: ['./popup.html'],
      },  
    },
    resolve: {
        alias: {
          '@': resolve(__dirname, './src')
        }
    },
    plugins: [
      react(), 
      crx({
        manifest: './src/manifest.json'
      })
    ]
  })
}