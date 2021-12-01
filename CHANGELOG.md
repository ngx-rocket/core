## [7.0.3](https://github.com/ngx-rocket/core/compare/7.0.2...7.0.3) (2021-12-01)


### Bug Fixes

* wrong process module import ([bef7e4d](https://github.com/ngx-rocket/core/commit/bef7e4d387138278ca7529e1ff928445aaf06cde))

## [7.0.2](https://github.com/ngx-rocket/core/compare/7.0.1...7.0.2) (2021-11-30)

## [7.0.1](https://github.com/ngx-rocket/core/compare/7.0.0...7.0.1) (2021-07-21)


### Bug Fixes

* raw action files copy ([27e6f1e](https://github.com/ngx-rocket/core/commit/27e6f1ea7dba437bd782f7c632af6ecbe4f001ba))

# [7.0.0](https://github.com/ngx-rocket/core/compare/6.0.1...7.0.0) (2021-07-20)


### Bug Fixes

* update deps ([008d8f3](https://github.com/ngx-rocket/core/commit/008d8f3b74b3051dbda7104c9e058f921b94bcff))


### Features

* provide features param to base constructor ([8bfe827](https://github.com/ngx-rocket/core/commit/8bfe827af92f3b2e4c97b485eb67808b89a615f8))
* restore install actions ([69bf709](https://github.com/ngx-rocket/core/commit/69bf709ab944b2290d8ad1d94b4d8db552491166))
* update to yeoman-generator@5 ([0af0fe0](https://github.com/ngx-rocket/core/commit/0af0fe090f32c59b496b9ba36b2b88d978e102f3))


### BREAKING CHANGES

* update to yeoman-generator@5

## [6.0.1](https://github.com/ngx-rocket/core/compare/6.0.0...6.0.1) (2021-01-07)

# 6.0.0
- Fix double prompt issue (#25)
- Update dependencies

### Breaking change
- Now requires Node.js >= 10 (dropped Node.js 8 support)

# 5.0.2
- Display error message when automate json fails to load

# 5.0.1
- Fix documentation regarding sharedProps and bump dependencies

# 5.0.0
- Updated to `yeoman-generator@4`

### Breaking change
- Now requires Node.js >= 8 (dropped Node.js 6 support)

# 4.1.0
- Added root templates path for fullstack mode
- Updated dependencies

# 4.0.1
- Fixed issue when matching action prefix

# 4.0.0
- Updated dependencies and fixed vulnerabilities
- Fixed documentation TOC
- Migrated from Jasmine to Jest for unit tests
- Migrated from ESlint to xo + prettier for linting and formatting

### Breaking change
- Updated to `yeoman-generator@3` which has some [breaking changes](https://github.com/yeoman/generator/releases/tag/v3.0.0)

# 3.2.1
- Fixed missing `ignore` module

# 3.2.0
- Added new prefixes: `raw` and `universal` to support new generator features
- Added `--tools` generator option to filter files using `.toolsignore` or `toolsFilter` option (https://github.com/ngx-rocket/generator-ngx-rocket/issues/144)

# 3.1.0
- Added support for Yarn (https://github.com/ngx-rocket/generator-ngx-rocket/issues/49)

# 3.0.1
- Fixed bug when both conditional prefixes and action are used
- Fixed bug when both folder prefix and action are used

# 3.0.0
- Added default prefix for Angular Material UI

### Breaking change
- Updated to `yeoman-generator@2` which has some [breaking changes](https://github.com/yeoman/generator/releases/tag/v2.0.0)

# 2.1.0
- Added mobile platforms default prefixes (related to https://github.com/ngx-rocket/generator-ngx-rocket/issues/78)
- Fixed documentation

# 2.0.1
- Fixed bug with folder conditional prefixes

# 2.0.0
### Breaking change
- Updated default prefixes to match support for multiple targets

# 1.2.1
- Added `pwa` (progressive web app) to default prefixes
- Fixed folder conditional prefixes

# 1.2.0
- Added support for multiple file conditions
- Updated dependencies

# 1.1.1
- Documentation: added note on standalone usage

# 1.1.0
- Added `raw` action to disable template processing

# 1.0.1
- Added automation option

# 1.0.0
- First public version
