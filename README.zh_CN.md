
# vite-plugin-crx-mv3

> 使用 Vite 构建 Chrome 扩展

[English](./README.md) | **简体中文** 

## 功能

+ Chrome扩展页面和内容脚本支持使用vue、react等等；
+ content_scripts的css配置项支持.scss或.less文件；js配置项支持.js(x)或.ts(x)文件；
+ background.service_worker配置项支持.js或.ts文件；
+ 在开发环境，修改content_scripts和background.service_worker之后，content_scripts注入的页面和Chrome扩展程序会自动重载；

## 用法

### 安装

```bash
# npm
npm install vite-plugin-crx-mv3 -D
# or yarn
yarn add vite-plugin-crx-mv3 -D
# or pnpm
pnpm add vite-plugin-crx-mv3 -D
```

### 插件选项

#### port

- **Type:** `number`
- **Default:** `8181`

建立一个websocket连接。在content_scripts和service_worker文件发生变化时，通知Chrome扩展客户端重载。

#### manifest

- **Type:** `string`
- **Required :** `true`

Chrome扩展的manifest.json文件路径。

### 配置
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

### 运行
```bash
# development
pnpm dev
# production
pnpm build
```

## 例子
在本仓库下的examples目录下：

+ crx-basic
+ crx-react
+ crx-solid
+ crx-jquery
+ crx-vue
+ crx-vue-drawer
+ crx-vue-multi-page
+ crx-contentscript-sass-less
+ crx-executescript-function
+ crx-executescript-files
+ crx-insertcss-files
+ crx-vue-newtab-AntdUI

查看这个[GIF](./docs/gif.md)预览效果。

## 注意事项
+ 启动项目后，第一次需要手动刷新页面，这样客户端和服务端便建立了websocket连接。
+ 修改manifest.json后需要重新运行命令启动。
+ html文件需要放在src目录外层。
