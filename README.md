
# vite-plugin-crx-mv3

Build a Chrome Extension with Vite.

**English** | [简体中文](./README.zh_CN.md)

### Features

+ Chrome extension pages and injected scripts support the use of vue, react, etc.
+ content_scripts css configuration item supports .scss or .less files; js configuration item supports .js(x) or .ts(x) files.
+ background.service_worker configuration item supports .js or .ts files.
+ In development environments, content_scripts injected pages and Chrome extensions are automatically reloaded after content_scripts and background.service_worker are modified.

### Usage
#### Install

```bash
# pnpm
pnpm add vite-plugin-crx-mv3 -D
# npm
npm install vite-plugin-crx-mv3 -D
# yarn
yarn add vite-plugin-crx-mv3 -D
```

#### Configuration

```js
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import crx from 'vite-plugin-crx-mv3'

export default defineConfig({
  plugins: [
    vue(),
    crx({
      manifest: './src/manifest.json'
    }),
  ],
})
```
#### Run

```bash
# development
pnpm dev
# production
pnpm build
```

### Examples
Check out the examples in this repo.

+ crx-contentscript-sass-less
+ crx-executescript-function
+ crx-jquery
+ crx-react
+ crx-solid
+ crx-vue
+ crx-vue-drawer
+ crx-vue-mult-page

Check out this [GIF](./docs/gif.md) preview.