'use strict';

const path = require('path');
const fs = require('fs');
const _ = require('lodash');
const Generator = require('yeoman-generator');

const FileUtilities = require('./file-utilities');

const SharedStorageKey = Symbol.for('@ngx-rocket/core');

if (!global[SharedStorageKey]) {
  // Initialize shared storage only once
  global[SharedStorageKey] = {
    props: {},
    fullstack: false,
    instances: 0
  };
}

class CoreGenerator extends Generator {
  /**
   * Creates a new Yeoman generator extending the core ngx-rocket generator.
   * @param {object} options Configures your generator instance:
   * - `baseDir`: base directory for your generator templates
   * - `generator`: your generator base class (optional)
   * - `options`: generator options, see related section at http://yeoman.io/authoring/user-interactions.html (optional).
   * - `prompts`: generator prompts, using [Inquirer.js](https://github.com/SBoudrias/Inquirer.js#question) format (optional).
   * - `templatesDir`: generator templates directory (optional, default: 'templates')
   * - `prefixRules`: generator template prefix rules (optional, default: defaultPrefixRules)
   * - `toolsFilter`: file filter patterns to use when toolchain only option is enabled. If not provided, the generator
   *    will try to load the `.toolsignore` file inside `baseDir`.
   * - `type`: generator type, can be `client`, `server` or `fullstack` (optional, default: 'client'). In `fullstack`
   * mode, client and server templates must be separated into `client` and `server` subfolders.
   * @return {Generator} A new Yeoman generator derived from the specified options.
   */
  static make(options) {
    if (!options.baseDir) {
      throw new Error("You must provide a 'baseDir' property");
    }

    return class extends CoreGenerator {
      constructor(args, opts) {
        super(args, opts, options.options, options.prompts);
        global[SharedStorageKey].instances++;

        if (options.type === 'server' || options.type === 'fullstack') {
          global[SharedStorageKey].fullstack = true;
        } else {
          options.type = 'client';
        }

        this._type = options.type;
        this._templatesPath = path.join(
          options.baseDir,
          options.templatesDir || 'templates'
        );
        this._prefixRules =
          options.prefixRules || CoreGenerator.defaultPrefixRules;

        if (opts.tools) {
          const ignoreFile = path.join(options.baseDir, '.toolsignore');
          if (options.toolsFilter) {
            // Use filter patterns provided via options
            this._toolsFilter = options.toolsFilter;
          } else if (fs.existsSync(ignoreFile)) {
            this._toolsFilter = fs.readFileSync(ignoreFile).toString();
          }
        }

        // Core methods
        const proto = Object.getPrototypeOf(this);
        ['prompting', 'writing'].forEach(method => {
          proto[method] = super[method];
        });

        // Additional methods
        const generatorBase = options.generator;
        if (generatorBase) {
          Object.getOwnPropertyNames(generatorBase.prototype)
            .filter(
              method => method.charAt(0) !== '_' && method !== 'constructor'
            )
            .forEach(method => {
              proto[method] = generatorBase.prototype[method];
            });
        }
      }
    };
  }

  /**
   * Gets the default prefix rules.
   * @return {Object} The default prefix rules.
   */
  static get defaultPrefixRules() {
    return {
      web: props => props.target.includes('web'),
      cordova: props => props.target.includes('cordova'),
      electron: props => props.target.includes('electron'),
      pwa: props => Boolean(props.pwa),
      bootstrap: props => props.ui === 'bootstrap',
      ionic: props => props.ui === 'ionic',
      material: props => props.ui === 'material',
      raw: props => props.ui === 'raw',
      universal: props => Boolean(props.universal),
      auth: props => Boolean(props.auth),
      ios: props => props.mobile.includes('ios'),
      android: props => props.mobile.includes('android'),
      windows: props => props.mobile.includes('windows')
    };
  }

  /**
   * Gets a copy of properties shared between generators.
   * @return {Object} A copy of shared properties.
   */
  static get sharedProps() {
    return _.assign({}, global[SharedStorageKey].props);
  }

  /**
   * Sets additional shared properties between generators.
   * To avoid collisions issues, only properties that are currently undefined will be added.
   * @param {Object} props The additional shared properties to set.
   */
  static shareProps(props) {
    _.defaults(global[SharedStorageKey].props, props);
  }

  constructor(args, opts, options, prompts) {
    super(args, opts);
    options = options || [];
    prompts = prompts || [];

    // Default options for all generators
    options = options.concat([
      {
        name: 'update',
        type: 'Boolean',
        required: false,
        description: 'Update existing project',
        defaults: true
      },
      {
        name: 'automate',
        type: 'String',
        required: false,
        description: 'Automate prompt answers using the specified JSON file',
        defaults: ''
      },
      {
        name: 'packageManager',
        type: value => {
          if (value !== 'yarn' && value !== 'npm') {
            console.error(
              'Invalid package manager: can be either "yarn" or "npm"'
            );
            // eslint-disable-next-line unicorn/no-process-exit
            process.exit(-1);
          }
          return value;
        },
        description: 'Choose Yarn or NPM as package manager',
        defaults: process.env.NGX_PACKAGE_MANAGER || 'npm'
      },
      {
        name: 'tools',
        type: 'Boolean',
        required: false,
        description: 'Generate only the toolchain',
        defaults: false
      }
    ]);

    // Add given options
    options.forEach(option => {
      this.option(option.name, {
        type:
          typeof option.type === 'function' ? option.type : global[option.type],
        required: option.required,
        description: option.description || option.desc,
        defaults: option.defaults
      });
    });

    this._prompts = prompts;
    this.props = {};
  }

  /**
   * Gets a copy of properties shared between generators.
   * @return {Object} A copy of shared properties.
   */
  get sharedProps() {
    return CoreGenerator.sharedProps;
  }

  /**
   * Sets additional shared properties between generators.
   * To avoid collisions issues, only properties that are currently undefined will be added.
   * @param {Object} props The additional shared properties to set.
   */
  shareProps(props) {
    CoreGenerator.shareProps(props);
  }

  /**
   * Checks if the generator is running standalone.
   * @return {boolean} `true` if the generator is running standalone or `false` if it is running as an add-on.
   */
  get isStandalone() {
    return global[SharedStorageKey].instances === 1;
  }

  /**
   * Checks if this or a composed generator has declared to be in `server` or `fullstack` mode.
   * @return {boolean} `true` if this or a composed generator has declared to be in `server` or `fullstack` mode or `false` if it
   *   is running in client only mode.
   */
  get isFullstack() {
    return global[SharedStorageKey].fullstack;
  }

  /**
   * Gets the the package manager to use.
   * @return {'npm'|'yarn'} Returns the package manager to use (either `npm` or `yarn`)
   */
  get packageManager() {
    return this.options.packageManager || 'npm';
  }

  prompting() {
    // Load saved props if updating
    if (this.options.update) {
      this.props = this.config.get('props') || {};
    }

    const processProps = props => {
      props.appName =
        this.sharedProps.appName ||
        this.props.appName ||
        props.appName ||
        this.options.appName;
      if (!props.appName) {
        throw new Error('appName property must be defined');
      }
      props.projectName = _.kebabCase(props.appName);
      props.packageManager = this.packageManager;
      _.assign(this.props, props);
    };

    if (this.options.automate) {
      // Do no prompt, use json file instead
      const props = require(path.resolve(this.options.automate));
      processProps(props);
    } else {
      const namePrompt = _.find(this._prompts, {name: 'appName'});
      if (namePrompt) {
        namePrompt.default = this.appname;
        namePrompt.when = () => !this.options.appName;
      }

      // Remove prompts for already defined properties
      _.remove(this._prompts, p => this.props[p.name] !== undefined);

      return this.prompt(this._prompts).then(processProps);
    }

    // Make sure we always return a promise
    return Promise.resolve();
  }

  writing() {
    if (this.version) {
      this.config.set('version', this.version);
    }
    if (this.props) {
      this.config.set('props', this.props);
    }
    this.config.save();

    if (
      process.env.NGX_CLIENT_PATH === null ||
      process.env.NGX_CLIENT_PATH === undefined
    ) {
      process.env.NGX_CLIENT_PATH = 'client';
    }
    if (
      process.env.NGX_SERVER_PATH === null ||
      process.env.NGX_SERVER_PATH === undefined
    ) {
      process.env.NGX_SERVER_PATH = 'server';
    }

    return FileUtilities.getFiles(this._templatesPath, this._type).then(
      allFiles => {
        let files = FileUtilities.prepareFiles(
          allFiles.client,
          this._templatesPath,
          this.isFullstack ? process.env.NGX_CLIENT_PATH : null,
          this._type === 'fullstack' ? FileUtilities.ClientTemplatesPath : null
        );
        files = files.concat(
          FileUtilities.prepareFiles(
            allFiles.server,
            this._templatesPath,
            this.isFullstack ? process.env.NGX_SERVER_PATH : null,
            this._type === 'fullstack'
              ? FileUtilities.ServerTemplatesPath
              : null
          )
        );
        if (this._toolsFilter) {
          files = FileUtilities.filterFiles(files, this._toolsFilter);
        }
        files.forEach(file =>
          FileUtilities.writeFile(this, file, this._prefixRules)
        );
      }
    );
  }
}

module.exports = CoreGenerator;
