'use strict';

const path = require('path');
const _ = require('lodash');
const dir = require('node-dir');
const Generator = require('yeoman-generator');

const FileUtilities = require('./file-utilities');

const SharedStorageKey = Symbol.for('@ngx-rocket/core');

if (!global[SharedStorageKey]) {
  // Initialize shared storage only once
  global[SharedStorageKey] = {
    props: {},
    instances: 0
  };
}

class CoreGenerator extends Generator {

  /**
   * Creates a new Yeoman generator extending the core ngx-rocket generator.
   * @param options The generator options, defined as such:
   * - baseDir: base directory for your generator templates
   * - generator: your generator base class (optional)
   * - options: generator options, see related section at http://yeoman.io/authoring/user-interactions.html (optional).
   * - prompts: generator prompts, using [Inquirer.js](https://github.com/SBoudrias/Inquirer.js#question) format (optional).
   * - templatesDir: generator templates directory (optional, default: 'templates')
   * - prefixRules: generator template prefix rules (optional, default: defaultPrefixRules)
   * @return A new Yeoman generator derived from the specified options.
   */
  static make(options) {
    if (!options.baseDir) {
      throw new Error('You must provide a \'baseDir\' property');
    }

    return class extends CoreGenerator {
      constructor(args, opts) {
        super(args, opts, options.options, options.prompts);
        global[SharedStorageKey].instances++;

        this._templatesPath = path.join(options.baseDir, options.templatesDir || 'templates');
        this._prefixRules = options.prefixRules || CoreGenerator.defaultPrefixRules;

        // Core methods
        const proto = Object.getPrototypeOf(this);
        ['prompting', 'writing'].forEach(method => {
          proto[method] = super[method];
        });

        // Additional methods
        const generatorBase = options.generator;
        if (generatorBase) {
          Object.getOwnPropertyNames(generatorBase.prototype)
            .filter(method => method.charAt(0) !== '_' && method !== 'constructor')
            .forEach(method => {
              proto[method] = generatorBase.prototype[method];
            });
        }
      }
    };
  }

  /**
   * Gets the default prefix rules.
   * @return The default prefix rules.
   */
  static get defaultPrefixRules() {
    return {
      mobile: props => props.target !== 'web',
      web: props => props.target !== 'mobile',
      bootstrap: props => props.ui === 'bootstrap',
      ionic: props => props.ui === 'ionic',
      auth: props => Boolean(props.auth)
    };
  }

  /**
   * Gets a copy of properties shared between generators.
   * @return A copy of shared properties.
   */
  static get sharedProps() {
    return _.assign({}, global[SharedStorageKey].props);
  }

  /**
   * Sets additional shared properties between generators.
   * To avoid collisions issues, only properties that are currently undefined will be added.
   * @param props The additional shared properties to set.
   */
  static shareProps(props) {
    _.defaults(global[SharedStorageKey].props, props);
  }

  constructor(args, opts, options, prompts) {
    super(args, opts);
    options = options || [];
    prompts = prompts || [];

    // Add given options
    options.forEach(option => {
      this.option(option.name, {
        type: global[option.type],
        required: option.required,
        desc: option.desc,
        defaults: option.defaults
      });
    });

    this._prompts = prompts;
    this.props = {};
  }

  get sharedProps() {
    return CoreGenerator.sharedProps;
  }

  shareProps(props) {
    CoreGenerator.shareProps(props);
  }

  get isStandalone() {
    return global[SharedStorageKey].instances === 1;
  }

  prompting() {
    const processProps = props => {
      props.appName = this.sharedProps.appName || this.props.appName || props.appName || this.options.appName;
      if (!props.appName) {
        throw new Error('appName property must be defined');
      }
      props.projectName = _.kebabCase(props.appName);
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
    return new Promise(resolve => {
      dir.files(this._templatesPath, (err, files) => {
        if (err) {
          throw err;
        }

        FileUtilities
          .prepareFiles(files, this._templatesPath)
          .forEach(file => FileUtilities.writeFile(this, file, this._prefixRules));

        resolve();
      });
    });
  }

}

module.exports = CoreGenerator;
