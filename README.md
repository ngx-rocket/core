# ngx-rocket/core

[![NPM version](https://img.shields.io/npm/v/@ngx-rocket/core.svg)](https://www.npmjs.com/package/@ngx-rocket/core)
![Node version](https://img.shields.io/badge/node-%3E%3D6.0.0-brightgreen.svg)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

> Core generator for creating ngX Rocket add-ons

## Usage

This generator extends [Yeoman](https://yeoman.io) base generator with all the boilerplate needed to create [ngX Rocket add-ons](), and even more.

First install the dependency:
```bash
npm install -S @ngx-rocket/core
```

Then create a new add-on generator like this:
```javascript
'use strict';
const Generator = require('@ngx-rocket/core');
module.exports = Generator.make();
```

Add some template files in a `templates/` folder and you're done, congratulations on making your first generator! :tada:
