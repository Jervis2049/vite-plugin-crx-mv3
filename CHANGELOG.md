## 0.1.2 (2023-5-5)
+ fix: production build never ends. (#17) ([28117f](https://github.com/Jervis2049/vite-plugin-crx-mv3/commit/28117f)), closes [#17](https://github.com/Jervis2049/vite-plugin-crx-mv3/issues/17)

## 0.1.1 (2023-4-10)
+ fix: background.type should not be ignored in manifest.json (#14) ([845150d](https://github.com/Jervis2049/vite-plugin-crx-mv3/commit/845150d)), closes [#14](https://github.com/Jervis2049/vite-plugin-crx-mv3/issues/14)

## 0.1.0 (2023-4-1)

+ feat: allow the version and name fields of manifest.json to be missing or filled with `auto`, and get the fields of package.json as a supplement, closes [#8](https://github.com/Jervis2049/vite-plugin-crx-mv3/issues/8)
+ refactor(content_scripts): optimize the way content_scripts are loaded , closes [#4](https://github.com/Jervis2049/vite-plugin-crx-mv3/issues/4) [#7](https://github.com/Jervis2049/vite-plugin-crx-mv3/issues/7)
+ perf: optimize packing speed with caching

## 0.0.7 (2023-3-15)
+ feat: support for js, css compilation in web_accessible_resources [#5](https://github.com/Jervis2049/vite-plugin-crx-mv3/issues/5)

## 0.0.6 (2023-2-9)
+ refactor(input):  In the options phase of rollup, the html path of the manifest is used as the rollup input.
+ feat: allow rollupOptions.input to be empty.

## 0.0.5 (2022-12-26)
+ fix: page reload after modifying content_scripts's sass/less.
+ fix: remove dynamically injected CSS.

## 0.0.4 (2022-12-23)
+ feat: support devtools_page configuration in manifest.json. 
+ fix: content_scripts path (#2) ([70e0c84](https://github.com/Jervis2049/vite-plugin-crx-mv3/commit/70e0c84)), closes [#2](https://github.com/Jervis2049/vite-plugin-crx-mv3/issues/2)
+ fix: set `apply` to `build`.
+ chore: listen for changes to manifest.json and re-fetch the contents of manifest.json.

## 0.0.3 (2022-11-27)

+ feat: support dynamic insertion of scripts and css files.
+ chore: optimized code structure.

## 0.0.2 (2022-11-18)

+ fix: Set the configuration item shims of tsup to true to solve the problem that import.meta.url is undefined.
+ fix: Use require to load sass and less
+ chore: package.json adds engines option

## 0.0.1 (2022-11-17)
### Features

+ Support Manifest V3.
+ Support Typescript.
+ Support sass/less in manifest.json.
+ Support for multiple frameworks or libraries, such as vue, react, etc.
+ Live Reload
