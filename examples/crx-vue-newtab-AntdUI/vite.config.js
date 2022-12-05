import { defineConfig } from 'vite'
import path from 'path'
import vue from '@vitejs/plugin-vue'
import crx from 'vite-plugin-crx-mv3'
import Components from 'unplugin-vue-components/vite';
import { AntDesignVueResolver } from 'unplugin-vue-components/resolvers';

const pathResolve = (pathStr) => {
  return path.resolve(__dirname, pathStr)
}

export default defineConfig(({ mode }) => {
  return {
    resolve: {
      alias: {
        '@': pathResolve('./src')
      }
    },
    plugins: [
      vue(),
      crx({
        manifest: './src/manifest.json'
      }),
      Components({
        resolvers: [
          AntDesignVueResolver(),
        ],
      }),
    ],
    build: {
      emptyOutDir: mode == 'production',
      minify: 'esbuild',
      chunkSizeWarningLimit: 64000,
      rollupOptions: {
        input: ['index.html'],
        output: {
          manualChunks (id) {
            if (id.includes('node_modules')) {
              if (id.includes('ant-design-vue')) {
                return 'vendor'
              }
            }
          }
        }
      },
    },
  }
})
