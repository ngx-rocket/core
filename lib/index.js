'use strict';

const _ = require('lodash');
const chalk = require('chalk');
const dir = require('node-dir');
const path = require('path');
const Generator = require('yeoman-generator');

const FileExclusions = [
  '.DS_Store',
  'Thumbs.db'
];

const PrefixRules = {
  _mobile:    (props) => props.target !== 'web',
  _web:       (props) => props.target !== 'mobile',
  _bootstrap: (props) => props.ui === 'bootstrap',
  _ionic:     (props) => props.ui === 'ionic',
  _auth:      (props) => !!props.auth
};

module.exports = class CoreGenerator extends Generator {

  /**
   * Creates a new Yeoman generator extending the core ngx-rocket generator.
   * @param baseClass Your generator base class (optional)
   * @param options Generator options, see related section at http://yeoman.io/authoring/user-interactions.html (optional).
   * @param prompts Generator prompts, using [Inquirer.js](https://github.com/SBoudrias/Inquirer.js#question) format (optional).
   * @return A new Yeoman generator derived from the specified class.
   */
  static make(baseClass, options, prompts) {
    return class extends CoreGenerator {
      constructor(args, opts) {
        super(args, opts, options, prompts);

        // Core methods
        const superMethods = ['prompting', 'preparing', 'writing'];
        const proto = Object.getPrototypeOf(this);

        for (let method of superMethods) {
          proto[method] = super[method];
        }

        // Additional methods
        if (baseClass) {
          const methods = Object.getOwnPropertyNames(baseClass.prototype)
            .filter(method => method.charAt(0) !== '_' && method !== 'constructor');

          for (let method of methods) {
            proto[method] = baseClass.prototype[method];
          }
        }
      }
    }
  }

  constructor(args, opts, options, prompts) {
    super(args, opts);
    options = options || [];
    prompts = prompts || [];

    // TODO: shared props!

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


  prompting() {
    this.props = this.props || {};
    let processProps = (props) => {
      props.appName = this.props.appName || props.appName || this.options.appName;
      props.projectName = _.kebabCase(props.appName);
      _.extend(this.props, props);
    };

    if (this.options.automate) {
      // Do no prompt, use json file instead
      let props = require(path.resolve(this.options.automate));
      processProps(props);
    } else {
      let namePrompt = _.find(this._prompts, { name: 'appName' });
      namePrompt.default = this.appname;
      namePrompt.when = () => !this.options.appName;
      _.remove(this._prompts, (p) => this.props[p.name] !== undefined);

      return this.prompt(this._prompts).then(processProps);
    }
  }

  preparing() {
    return new Promise((resolve) => {
      let filesPath = path.join(__dirname, 'templates');

      dir.files(filesPath, (err, files) => {
        if (err) throw err;

        // Removes excluded files
        _.remove(files, (file) => {
          return !_.every(FileExclusions, (excludeFile) => {
            return !_.includes(file, excludeFile);
          });
        });

        this.files = _.map(files, (file) => {
          let src = path.relative(filesPath, file);
          let isTemplate = _.startsWith(path.basename(src), '_');
          let hasFileCondition = _.startsWith(path.basename(src), '__');
          let hasFolderCondition = _.startsWith(path.dirname(src), '_');
          let dest = path.relative(hasFolderCondition ? path.dirname(src).split(path.sep)[0] : '.', src);

          if (hasFileCondition) {
            let fileName = path.basename(src).replace(/__.*?[.]/, '');
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

        resolve();
      });
    });
  }

  writing() {
    this.files.forEach((file) => {
      let write = !file.hasFolderCondition || _.every(PrefixRules, (rule, folder) => {
          return !_.startsWith(path.dirname(file.src), folder) || rule(this.props);
        });

      write = write && (!file.hasFileCondition || _.every(PrefixRules, (rule, prefix) => {
          return !_.startsWith(path.basename(file.src), '_' + prefix) || rule(this.props);
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
  }

};
