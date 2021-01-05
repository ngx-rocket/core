# :rocket: ngx-rocket/core

[![NPM version](https://img.shields.io/npm/v/@ngx-rocket/core.svg)](https://www.npmjs.com/package/@ngx-rocket/core)
[![Build Status](https://github.com/@ngx-rocket/core/workflows/build/badge.svg)](https://github.com/@ngx-rocket/core/actions)
![Node version](https://img.shields.io/badge/node-%3E%3D8.0.0-brightgreen.svg)
[![XO code style](https://img.shields.io/badge/code_style-XO-5ed9c7.svg)](https://github.com/sindresorhus/xo)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

> Core generator for creating ngX-Rocket add-ons

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
## Table of Contents

- [Usage](#usage)
- [Concepts](#concepts)
  - [Prompts and properties](#prompts-and-properties)
  - [Templates](#templates)
  - [File prefix rules](#file-prefix-rules)
    - [Conditional prefix](#conditional-prefix)
    - [Action prefix](#action-prefix)
  - [Advanced customization](#advanced-customization)
  - [Generating only tools](#generating-only-tools)
  - [Standalone note](#standalone-note)
  - [Fullstack mode](#fullstack-mode)
- [API](#api)
  - [Static methods/properties](#static-methodsproperties)
    - [`Generator.make(options)`](#generatormakeoptions)
    - [`Generator.defaultPrefixRules`](#generatordefaultprefixrules)
    - [`Generator.sharedProps`](#generatorsharedprops)
    - [`Generator.shareProps(props)`](#generatorsharepropsprops)
  - [Instance properties](#instance-properties)
    - [`sharedProps` (read-only)](#sharedprops-read-only)
    - [`shareProps(props)`](#sharepropsprops)
    - [`isStandalone` (read-only)](#isstandalone-read-only)
    - [`isFullstack` (read-only)](#isfullstack-read-only)
    - [`packageManager` (read-only)](#packagemanager-read-only)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

## Usage

This package extends [Yeoman](https://yeoman.io) base generator with all the boilerplate needed to create
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

## Concepts

This package allows you to create advanced [Yeoman](https://yeoman.io) generators that can be used as
[ngX-Rocket](https://github.com/ngx-rocket/generator-ngx-rocket) add-ons or standalone generators.

See this [example addon](https://github.com/ngx-rocket/addon-example), you can use it as a base for your own add-ons.

First it may be helping to be familiar with [Yeoman generators](http://yeoman.io/authoring/), since they have to
follow specific naming and structure rules.

### Prompts and properties

You may want to ask the user some question about what he wants to generate, to do so you have to provide a list of
prompts like this:

```javascript
module.exports = Generator.make({
  baseDir: __dirname,

  // Your generator prompts
  // See https://github.com/sboudrias/Inquirer.js#objects for details
  prompts: [
    {
      type: 'confirm',
      name: 'sayHello',
      message: 'Shall we say hello?',
      default: true
    },
    {
      type: 'input',
      name: 'helloName',
      message: 'To whom shall we say hello?',
      default: 'world',
      // Only ask this one when "yes" is replied to the sayHello prompt
      when: props => props.sayHello
    }
  ]
});
```

You can see in this example that prompts can even be shown conditionally using the property `when`.

After the user has answered your prompts, the results will be exposed as properties of the `props` object.
The `props` object can then be used directly in your [templates](#templates).

To avoid repeating the same questions between core and add-ons generators, these `props` can be shared and retrieved
using [`Generator.shareProps`](#generatorshareprops) and [`Generator.sharedProps`](#generatorsharedprops).
Note that in that goal, prompts name matching already defined properties with be automatically skipped once defined.

### Templates

Your generator templates should go under the `generators/app/templates/` folder.

With its most basic usage, any file put in this folder will be copied as-is in the generated project folder.
But you may often have to customize the file depending of the user [prompts](#prompts-and-properties).

To do so, just prepend an underscore (`_`) to the file name and it will become an [EJS template](http://ejs.co), will
full access to the `props` object:

```ejs
// generators/app/templates/_hello.md

# <%= props.appName // From shared properties %>

<% if (props.sayHello) { -%>
Hello <%= props.helloName %>!
<% } else { -%>
...was not in the mood to say hello :-(
<% }-%>
```

You can then inject strings from the prompts or apply conditions for example.

See the [EJS documentation](http://ejs.co/#docs) for the complete syntax options.

### File prefix rules

To avoid using complex hardcoded logic in generator, prefix-based file naming rules are used.

#### Conditional prefix

There is two ways to conditionally include a file depending of user choices:

- Using a *conditional folder* at root level, with the syntax `__<prefix>/`:
  all files under this folder will be copied if the prefix condition is matched.

  **Example:** `__authentication/my-service.ts` will be copied to `<project-dir>/my-service.ts` only if the user has
  enabled authentication during prompts.

- Using a *conditional prefix* on a specific file, with the syntax `__<prefix>.<filename>`:
  this file will be copied if the prefix condition is matched.

  You can even complete this by adding `_` before the `<filename>` part to also make it an EJS template, ie
  `__<prefix>._<filename>`.

  **Example:** `__authentication.myservice.ts` will be copied to `<project-dir>/my-service.ts` only if the user has
  enabled authentication during prompts.

Multiple conditions are also supported using the `+` character: `__<prefix1>+<prefix2>+<prefixN>.<filename>`.

You can use the [default prefix rules](#generatordefaultprefixrules) and extend them if needed.
These rules match the questions asked by the main generator
([generator-ngx-rocket](https://github.com/ngx-rocket/generator-ngx-rocket)):

- `web`: the user has chosen to make a *web* app as one of its targets
- `cordova`: the user has chosen to make a *mobile* app as one of its targets
- `electron`: the user has chosen to make a *desktop* app as one of its targets
- `pwa`: the user has chosen to add progressive web app support
- `bootstrap`: the user has chosen *Bootstrap* for its UI
- `ionic`: the user has chosen *Ionic* for its UI
- `material`: the user has chosen *Angular Material* for its UI
- `raw`: the user has chosen to not use any UI library
- `universal`: the user has chosen to use *Angular Universal* (Server-Side Rendering)
- `auth`: the user has enabled authentication
- `ios`: the user has chosen to support iOS for its mobile app
- `android`: the user has chosen to support Android for its mobile app
- `windows`: the user has chosen to support Windows (Universal) for its mobile app

#### Action prefix

In addition to conditional prefix, you can specify *how* the file should be copied to the destination folder.

By default files are copied entirely, overwriting previous version if needed (if multiple add-ons are trying to write
the same file, the one finally written will be from the last processed add-on).

To use actions you have to use this syntax `(<action>).<filename>`. This syntax can also be combined with the
conditional/template prefixes like this: `__<conditional-prefix>(<action>)._<filename>`

**Example**: `(merge).package.json` will merge the content with `<project-dir>/package.json`.

This is the list of currently implemented file actions:

- `merge` (only for JSON files): performs a deep merge of the JSON properties, concatenating arrays with unique values.
- `raw`: disable template processing even if filename starts with an underscore (`_`).

### Advanced customization

If your generator needs to perform additional specific actions, you can add code for custom tasks to be executed as
part of the composition lifecycle.

For this you simply create a new class to extend the base `Generator`:
```javascript
// generators/app/templates/index.js

const Generator = require('@ngx-rocket/core');
const pkg = require('../../package.json');

class ExampleGenerator extends Generator {
  // DO NOT add a constructor, it won't be called.
  // Use initializing() method instead.

  initializing() {
    // Setting version allows Yeoman to automatically notify the user of updates
    this.version = pkg.version;
    this.log(`Example generator is running version ${this.version}`);
  }

  end() {
    this.log(`This was nice, see ya!`);
  }
}

module.exports = Generator.make({
  baseDir: __dirname,

  // Your custom generator
  generator: ExampleGenerator
});

```
A complete working example is available here:
[addon-example](https://github.com/ngx-rocket/addon-example/blob/master/generators/app/index.js)

There is a set of specific task names for each part of the project generation lifecycle, for example the `initializing`
task of all generators will be executed before moving on to the next one.

To learn more about Yeoman's run loop and see the list of specific task with their priorities, see the
[running context documentation](http://yeoman.io/authoring/running-context.html). The composability docs also have
[example execution sequence](http://yeoman.io/authoring/composability.html#order) to understand how generators work
with each other.

See also the full Yeoman [Base generator documentation](http://yeoman.io/generator/Base.html) for the list of
available properties and methods you can use in your generator.

> Note: be careful when overriding one of the methods already defined in `@ngx-rocket/core` base Generator (`prompting`
> or `writing`)! To maintain the base behavior along with your additions, you have to manually call the original method
> using `super.<method>()` in your overridden method, like this:

```javascript
class ExampleGenerator extends Generator {
  writing() {
    // Do your stuff here
    console.log('Hey there!');

    // Make sure you call the base method to maintain proper behavior!
    return super.writing();
  }
}
```

### Generating only tools

As part of the update process or if your users are only interested with generating only the toolchain, you can define
filters to exclude template files that are not part of the toolchain.

All generators automatically support the `--tools` option that enable the filters.

To define these filters you have 2 possibilities:

- Create a `.toolsignore` in your generator `baseDir` root to exclude files that are not part of the toolchain.
  It uses the same syntax as a [`.gitignore`](https://git-scm.com/docs/gitignore) file.

- Specify a `toolsFilter` option when [creating your generator instance](#generatormakeoptions). Note that
  setting this option will remplace any rules that may be defined in a `.toolsignore` file.
  This option takes either a string or an array of strings, using the same syntax as a
  [`.gitignore`](https://git-scm.com/docs/gitignore) file.

### Standalone note

If you want your generator to work as a standalone and not only as an ngX-Rocket add-on, you must define the `appName`
propery, either using an argument option:
```javascript
class MyStandaloneGenerator extends Generator {
  initializing() {
    this.argument('appName', {
      desc: 'Name of the app to generate',
      type: String,
      required: true
    });
  }
}
```
or a prompt:
```javascript
module.exports = Generator.make({
  baseDir: __dirname,

  prompts: [
    {
      type: 'input',
      name: 'appName',
      message: 'What\'s the name of your app?'
    }
  ]
});
```
or both :)

### Fullstack mode

By default, an add-on is configured to generate *client* templates, but by setting the `type`
[option](#object-options-configures-your-generator-instance) you can generate *server* templates or *both client and
server* templates.

When any add-on generator is either configured as `server` or `fullstack`, the whole project generation switches to
**fullstack** mode, meaning that the generated output will contain both client and server code.

At any time after the initialization of your generator you can check if fullstack mode is enabled by using the
`isFullstack()` instance method.

The client and server output folders can be modified by the user or forced by your generator through the environment
variables `NGX_CLIENT_PATH` and `NGX_SERVER_PATH`. If not modified, `client` and `server` will be used as default
output folders.

## API

### Static methods/properties

#### `Generator.make(options)`

Creates a new Yeoman generator extending the core ngx-rocket generator.

##### `{object}` *options* Configures your generator instance:

- `baseDir`: base directory for your generator templates
- `generator`: your generator base class (optional)
- `options`: generator options, see related section at http://yeoman.io/authoring/user-interactions.html (optional).
- `prompts`: generator prompts, using [Inquirer.js](https://github.com/SBoudrias/Inquirer.js#question) format (optional).
- `templatesDir`: generator templates directory (optional, default: `'templates'`)
- `prefixRules`: generator template prefix rules (optional, default: `Generator.defaultPrefixRules()`)
- `toolsFilter`: file filter patterns to use when toolchain only option is enabled. If not provided, the generator
  will try to load the `.toolsignore` file inside `baseDir`.
- `type`: generator type, can be `client`, `server` or `fullstack` (optional, default: 'client'). In `fullstack`
  mode, client and server templates must be separated into `client`, `server` and `root` subfolders.

#### `Generator.defaultPrefixRules`

Gets the default prefix rules.

The default rules are these:
```javascript
{
  web: props => props.target.includes('web'),
  cordova: props => props.target.includes('cordova'),
  electron: props => props.target.includes('electron'),
  pwa: props => Boolean(props.pwa),
  bootstrap: props => props.ui === 'bootstrap',
  ionic: props => props.ui === 'ionic',
  raw: props => props.ui === 'raw',
  universal: props => Boolean(props.universal),
  auth: props => Boolean(props.auth),
  ios: props => props.mobile.includes('ios'),
  android: props => props.mobile.includes('android'),
  windows: props => props.mobile.includes('windows')
};
```

You can use this method to extend the default rules with your own, like this:
```javascript
const extentedRules = Object.assign(Generator.defaultPrefixRules, {
  hello: props => Boolean(props.hello)
});
```

#### `Generator.sharedProps`

Gets a copy of properties shared between generators.
To share additional properties, use [`Generator.shareProps`](#generatorshareprops).

Also available on the generator instance.

#### `Generator.shareProps(props)`

Sets additional properties shared between generators.
To avoid collisions issues, only properties that are currently undefined will be added.

Also available on the generator instance.

### Instance properties

#### `sharedProps` (read-only)

See [`Generator.sharedProps`](#generatorsharedprops).

#### `shareProps(props)`

See [`Generator.shareProps`](#generatorshareprops).

#### `isStandalone` (read-only)

Returns `true` if the generator is running standalone or `false` if it is running as an add-on.

#### `isFullstack` (read-only)
`true` if this or a composed generator has declared to be in `server` or `fullstack` mode or `false` if it is running
in client only mode.

#### `packageManager` (read-only)

Returns the package manager to use (either `npm` or `yarn`).
The default value is `npm`, and can be changed either by the `--packageManager` option or the environment variable
`NGX_PACKAGE_MANAGER`.
