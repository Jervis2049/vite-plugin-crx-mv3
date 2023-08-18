import { defineConfig } from 'vite'
import crx from 'vite-plugin-crx-mv3'

export default  defineConfig({
  plugins: [
    crx({
      manifest: './src/manifest.json'
    }),
  ],
})
 

