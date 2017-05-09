'use strict';

const _ = require('lodash');
const chalk = require('chalk');
const dir = require('node-dir');
const path = require('path');
const Generator = require('yeoman-generator');

const SharedStorageKey = Symbol.for('@ngx-rocket/core');
const FileExclusions = ['.DS_Store', 'Thumbs.db'];

if (!global[SharedStorageKey]) {
  // Initialize shared storage only once
  global[SharedStorageKey] = {
    props: {},
    instances: 0
  };
}

// TODO: detect standalone

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
        ['prompting', 'writing'].forEach(method => proto[method] = super[method]);

        // Additional methods
        const generatorBase = options.generator;
        if (generatorBase) {
          Object.getOwnPropertyNames(generatorBase.prototype)
            .filter(method => method.charAt(0) !== '_' && method !== 'constructor')
            .forEach(method => proto[method] = generatorBase.prototype[method]);
        }
      }
    }
  }

  /**
   * Gets the default prefix rules.
   * @return The default prefix rules.
   */
  static get defaultPrefixRules() {
    return {
      mobile:    (props) => props.target !== 'web',
      web:       (props) => props.target !== 'mobile',
      bootstrap: (props) => props.ui === 'bootstrap',
      ionic:     (props) => props.ui === 'ionic',
      auth:      (props) => !!props.auth
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
    options.forEach((option) => {
      this.option(option.name, {
        type: global[option.type],
        required: option.required,
        desc: option.desc,
        defaults: option.defaults
      });
    });

    this._prompts = prompts;
  }

  get sharedProps() {
    return CoreGenerator.sharedProps;
  }

  shareProps(props) {
    CoreGenerator.shareProps(props);
  }

  prompting() {
    this.props = this.props || {};
    const processProps = (props) => {
      props.appName = this.sharedProps.appName || this.props.appName || props.appName || this.options.appName;
      props.projectName = _.kebabCase(props.appName);
      _.assign(this.props, props);
    };

    if (this.options.automate) {
      // Do no prompt, use json file instead
      const props = require(path.resolve(this.options.automate));
      processProps(props);
    } else {
      const namePrompt = _.find(this._prompts, { name: 'appName' });
      if (namePrompt) {
        namePrompt.default = this.appname;
        namePrompt.when = () => !this.options.appName;
      }
      _.remove(this._prompts, (p) => this.props[p.name] !== undefined);

      return this.prompt(this._prompts).then(processProps);
    }
    // Make sure we always return a promise
    return Promise.resolve();
  }

  writing() {
    return new Promise((resolve) => {
      dir.files(this._templatesPath, (err, files) => {
        if (err) throw err;

        // Removes excluded files
        _.remove(files, (file) => {
          return !_.every(FileExclusions, (excludeFile) => {
            return !_.includes(file, excludeFile);
          });
        });

        // Prepare files
        this.files = _.map(files, (file) => {
          const src = path.relative(this._templatesPath, file);
          const hasFileCondition = _.startsWith(path.basename(src), '__');
          const hasFolderCondition = _.startsWith(path.dirname(src), '_');
          let isTemplate = _.startsWith(path.basename(src), '_');
          let dest = path.relative(hasFolderCondition ? path.dirname(src).split(path.sep)[0] : '.', src);

          if (hasFileCondition) {
            const fileName = path.basename(src).replace(/__.*?[.]/, '');
            isTemplate = _.startsWith(fileName, '_');
            dest = path.join(path.dirname(src), fileName);
          }

          if (isTemplate) {
            dest = path.join(path.dirname(dest), path.basename(dest).slice(1));
          }

          return {
            src: src,
            dest: dest,
            template: isTemplate,
            hasFileCondition: hasFileCondition,
            hasFolderCondition: hasFolderCondition
          };
        });

        // Write files
        this.files.forEach((file) => {
          let write = !file.hasFolderCondition || _.every(this._prefixRules, (rule, folder) => {
              return !_.startsWith(path.dirname(file.src), '_' + folder) || rule(this.props);
            });

          write = write && (!file.hasFileCondition || _.every(this._prefixRules, (rule, prefix) => {
              return !_.startsWith(path.basename(file.src), '__' + prefix) || rule(this.props);
            }));

          if (write) {
            try {
              if (file.template) {
                this.fs.copyTpl(this.templatePath(file.src), this.destinationPath(file.dest), this);
              } else {
                this.fs.copy(this.templatePath(file.src), this.destinationPath(file.dest));
              }
            } catch (error) {
              this.log(chalk.red(`\nTemplate processing error on file ${file.src}`));
              throw error;
            }
          }
        });

        resolve();
      });
    });
  }

}

module.exports = CoreGenerator;