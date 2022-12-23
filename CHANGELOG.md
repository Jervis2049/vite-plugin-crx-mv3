## 0.0.4 (2022-12-28)
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

+ Chrome extension pages and content scripts supporting the use of vue, react, etc.
+ Support sass/less in manifest.json.
+ Support Typescript.
+ In development environments, content_scripts injected pages and Chrome extensions are automatically reloaded after content_scripts and background.service_worker are modified.

