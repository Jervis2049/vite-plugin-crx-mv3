
# vite-plugin-crx-mv3

使用 Vite 构建 Chrome 扩展

[English](./README.md) | **简体中文** 

### 特性

+ Chrome扩展页面和注入脚本支持使用vue、react等等；
+ Content_scripts的css配置项支持.scss或.less文件；js配置项支持.js(x)或.ts(x)文件；
+ background.service_worker配置项支持.js或.ts文件；
+ 在开发环境，修改content_scripts和background.service_worker之后，content_scripts注入的页面和Chrome扩展程序会自动重载；

### 用法

#### 安装

```bash
# pnpm
pnpm add vite-plugin-crx-mv3 -D
# npm
npm install vite-plugin-crx-mv3 -D
# yarn
yarn add vite-plugin-crx-mv3 -D
```

#### 配置
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

### 例子
在本仓库下的examples目录下：

+ crx-contentscript-sass-less
+ crx-executeScript-function
+ crx-jquery
+ crx-react
+ crx-solid
+ crx-vue
+ crx-vue-drawer
+ crx-vue-mult-page

查看这个[GIF](./docs/gif.md)预览效果。