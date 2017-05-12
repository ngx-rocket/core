# :rocket: ngx-rocket/core

[![NPM version](https://img.shields.io/npm/v/@ngx-rocket/core.svg)](https://www.npmjs.com/package/@ngx-rocket/core)
[![Build status](https://img.shields.io/travis/ngx-rocket/core/master.svg)](https://travis-ci.org/ngx-rocket/core)
![Node version](https://img.shields.io/badge/node-%3E%3D6.0.0-brightgreen.svg)
[![XO code style](https://img.shields.io/badge/code_style-XO-5ed9c7.svg)](https://github.com/sindresorhus/xo)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

> Core generator for creating ngX-Rocket add-ons

## Usage

This generator extends [Yeoman](https://yeoman.io) base generator with all the boilerplate needed to create
[ngX-Rocket add-ons](https://github.com/ngx-rocket/addon-example), and even more.

First install the dependency:
```bash
npm install --save @ngx-rocket/core
```

Then create a new add-on generator like this:
```javascript
'use strict';
const Generator = require('@ngx-rocket/core');
module.exports = Generator.make({ baseDir: __dirname });
```

Add some template files in a `templates/` folder and you're done.
 
Congratulations on making your first Yeoman generator! :tada:
