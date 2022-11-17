
# vite-plugin-crx-mv3

> Build a Chrome Extension with Vite.

**English** | [简体中文](./README.zh_CN.md)

## Features

+ Chrome extension pages and injected scripts support the use of vue, react, etc.
+ content_scripts css configuration item supports .scss or .less files; js configuration item supports .js(x) or .ts(x) files.
+ background.service_worker configuration item supports .js or .ts files.
+ In development environments, content_scripts injected pages and Chrome extensions are automatically reloaded after content_scripts and background.service_worker are modified.

## Usage
### Install

```bash
# pnpm
pnpm add vite-plugin-crx-mv3 -D
# npm
npm install vite-plugin-crx-mv3 -D
# yarn
yarn add vite-plugin-crx-mv3 -D
```
### Plugin options

#### port

- **Type:** `number`
- **Default:** `8181`

Create a websocket connection. Notify Chrome extension clients to reload when changes are made to the contentscript and servicework files.

#### manifest

- **Type:** `string`
- **Required :** `true`

Path to the chrome extension's manifest.json

### Configuration

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

### Run

```bash
# development
pnpm dev
# production
pnpm build
```

## Examples
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

## Notices
+ After starting the project, you need to refresh the page manually for the first time, so that the client and the server can establish a websocket connection.
+ You need to restart the project after modifying manifest.json.
