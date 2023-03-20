import { defineConfig, splitVendorChunkPlugin } from 'vite'
import path from 'path'
import vue from '@vitejs/plugin-vue'
import crx from 'vite-plugin-crx-mv3'
import Components from 'unplugin-vue-components/vite'
import { AntDesignVueResolver } from 'unplugin-vue-components/resolvers'

const pathResolve = (pathStr) => {
  return path.resolve(__dirname, pathStr)
}

export default defineConfig(({ mode }) => {
  const isProd = mode === 'production'
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
        resolvers: [AntDesignVueResolver()]
      }),
      splitVendorChunkPlugin()
    ],
    build: {
      // emptyOutDir: isProd,
      minify: isProd ? 'esbuild' : false
      // chunkSizeWarningLimit: 64000,
      // rollupOptions: {
      //   output: {
      //     manualChunks(id) {
      //       if (id.includes('node_modules')) {
      //         if (id.includes('ant-design-vue')) {
      //           return 'vendor'
      //         }
      //       }
      //     }
      //   }
      // }
    }
  }
})
