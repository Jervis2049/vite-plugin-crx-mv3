## 0.0.7 (2023-3-15)
+ feat: support for js, css compilation in web_accessible_resources [#5](https://github.com/Jervis2049/vite-plugin-crx-mv3/issues/5)

## 0.0.6 (2023-2-9)
+ refactor(input):  In the options phase of rollup, the html path of the manifest is used as the rollup input.
+ fix: The input configuration of rollup is allowed to be empty.
+ chore: code optimization

## 0.0.5 (2022-12-26)
+ fix: Page does not reload after modifying content_scripts's sass/less.
+ fix: Cannot remove dynamically injected CSS.

## 0.0.4 (2022-12-23)
+ feat: Support devtools_page configuration in manifest.json. 
+ fix: The content_scripts path is no longer restricted.
+ fix: Set `apply` to `build`.
+ chore: Listen for changes to manifest.json and re-fetch the contents of manifest.json.

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
+ In development mode, Chrome extensions are automatically reloaded after modifying files.