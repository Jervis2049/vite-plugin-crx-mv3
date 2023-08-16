import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts', 'src/client/sw.ts', 'src/client/content.ts'],
  shims: true,
  format: ['cjs', 'esm'],
  clean: true
  // dts: true
})
