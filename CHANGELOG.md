
## 0.1.7 (2024-1-11)
+ fix: preserve original source maps  (#35) ([d0c02c](https://github.com/Jervis2049/vite-plugin-crx-mv3/commit/d0c02c)), closes [#35](https://github.com/Jervis2049/vite-plugin-crx-mv3/issues/35)


## 0.1.6 (2023-10-8)
+ fix:  the `web_accessible_resources` in manifest.json dynamically introduces the path to the file (#31) ([55ebf7](https://github.com/Jervis2049/vite-plugin-crx-mv3/commit/55ebf7)), closes [#31](https://github.com/Jervis2049/vite-plugin-crx-mv3/issues/31)

## 0.1.5 (2023-8-18)
+ fix: url for special characters in manifest name (#29) ([d0906a](https://github.com/Jervis2049/vite-plugin-crx-mv3/commit/d0906a)), closes [#29](https://github.com/Jervis2049/vite-plugin-crx-mv3/pull/29)
+ fix: `readFile` causes `emitFile` not to work, replace with `readFileSync` ([b8a683](https://github.com/Jervis2049/vite-plugin-crx-mv3/commit/b8a683))
+ fix: the `mkdir` method allows recursive creation of directories ([d605f88](https://github.com/Jervis2049/vite-plugin-crx-mv3/commit/d605f88))
+ perf: optimise content matching for chrome.scripting related APIs ([d519751](https://github.com/Jervis2049/vite-plugin-crx-mv3/commit/d519751))

## 0.1.4 (2023-8-10)
+ feat: support i18n (#27) ([e77867f](https://github.com/Jervis2049/vite-plugin-crx-mv3/commit/1bfcc91)), closes [#27](https://github.com/Jervis2049/vite-plugin-crx-mv3/issues/27)
+ build: support both cjs and esm (#28) ([e77867f](https://github.com/Jervis2049/vite-plugin-crx-mv3/commit/1f9dd59)), closes [#28](https://github.com/Jervis2049/vite-plugin-crx-mv3/issues/28)

## 0.1.3 (2023-5-11)
+ feat: Add the `reloadPage` option to control whether the page that contentScripts acts on is reloaded in the dev env. (#20) ([e77867f](https://github.com/Jervis2049/vite-plugin-crx-mv3/commit/e77867f)), closes [#20](https://github.com/Jervis2049/vite-plugin-crx-mv3/issues/20)

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
