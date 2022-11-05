import { build, defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import crxHotReload from 'vite-plugin-crx-mv3'
import { resolve } from 'path'

let _config
export default ({ mode }) => {  
  return defineConfig({
      // base: 'chrome-extension://__MSG_@@extension_id__',
      plugins: [
        vue(),
        crxHotReload({
          input: './src/manifest.json'
        }),
      ],
      resolve: {
        alias: {
          '@': resolve(__dirname, './src')
        }
      },
      build: {
        // emptyOutDir: mode == 'production',
        rollupOptions: {
          input: ['./popup.html'],
        },  
      },
    })
}

 