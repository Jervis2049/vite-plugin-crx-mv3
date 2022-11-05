import { defineConfig } from 'vite';
import solidPlugin from 'vite-plugin-solid';
import crx from 'vite-plugin-crx-mv3'

export default defineConfig({
  plugins: [
    solidPlugin(),
    crx({
      manifest: './src/manifest.json'
    })
  ],
  build:{
    rollupOptions: {
      input: ['./popup.html'],
    },  
  }
});
