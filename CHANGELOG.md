## 0.0.3 (2022-11-27)

+ feat: support dynamic insertion of scripts and css files.
+ chore: optimized code structure.

## 0.0.2 (2022-11-18)

+ fix: Set the configuration item shims of tsup to true to solve the problem that import.meta.url is undefined.
+ fix: Use require to load sass and less
+ chore: package.json adds engines option

## 0.0.1 (2022-11-17)
### Features

+ Chrome extension pages and injected scripts support the use of vue, react, etc.
+ content_scripts css configuration item supports .scss or .less files; js configuration item supports .js(x) or .ts(x) files.
+ background.service_worker configuration item supports .js or .ts files.
+ In development environments, content_scripts injected pages and Chrome extensions are automatically reloaded after content_scripts and background.service_worker are modified.

