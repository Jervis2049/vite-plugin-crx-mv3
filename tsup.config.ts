import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts', 'src/client/background.ts', 'src/client/content.ts'],
  shims: true,
  format: ['cjs', 'esm']
  // dts: true
})
