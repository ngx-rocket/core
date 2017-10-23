'use strict';

const path = require('path');
const _ = require('lodash');
const ejs = require('ejs');
const chalk = require('chalk');

const FileExclusions = ['.DS_Store', 'Thumbs.db'];
const FileActionRegExp = /^[_+a-zA-Z-]*\(([a-zA-Z]+)\)\./;
const FileCleanupRexExp = /^(__.*?|\([a-zA-Z]+\))\./;

class FileUtilities {
  static mergeJson(context, file) {
    const content = context.fs.readJSON(context.destinationPath(file.dest), {});
    let newContent = context.fs.read(context.templatePath(file.src));
    newContent = file.isTemplate ? ejs.render(newContent, context, {filename: file.src}) : newContent;
    newContent = JSON.parse(newContent);

    _.mergeWith(content, newContent, (a, b) => _.isArray(a) ? _.uniq(a.concat(b)) : undefined);

    context.fs.writeJSON(context.destinationPath(file.dest), content);
  }

  static prepareFiles(files, templatePath) {
    // Removes excluded files
    _.remove(files, file => !FileExclusions.every(excludeFile => !_.includes(file, excludeFile)));

    return _.map(files, file => {
      const src = path.relative(templatePath, file);
      const basename = path.basename(src);
      const dirname = path.dirname(src);
      const rootdir = dirname.split(path.sep)[0];
      const fileConditions = this._getConditions(basename, '__');
      const folderConditions = this._getConditions(rootdir, '__');
      const action = this._getAction(basename);
      let isTemplate = basename.startsWith('_');
      let dest = path.relative(folderConditions.length ? rootdir : '.', src);

      if (fileConditions.length || action) {
        const fileName = path.basename(src).replace(FileCleanupRexExp, '');
        isTemplate = fileName.startsWith('_') && action !== 'raw';
        dest = path.join(dirname, fileName);
      }

      if (isTemplate) {
        dest = path.join(path.dirname(dest), path.basename(dest).slice(1));
      }

      return {
        src,
        dest,
        isTemplate,
        fileConditions,
        folderConditions,
        action
      };
    });
  }

  static writeFile(context, file, prefixRules) {
    const write =
      (!file.folderConditions.length || this._checkConditions(file.folderConditions, context, prefixRules)) &&
      (!file.fileConditions.length || this._checkConditions(file.fileConditions, context, prefixRules));

    if (write) {
      try {
        if (file.action) {
          switch (file.action) {
            case 'merge':
              FileUtilities.mergeJson(context, file);
              break;
            case 'raw':
              context.fs.copy(context.templatePath(file.src), context.destinationPath(file.dest));
              break;
            default:
              throw new Error(`Invalid action: ${file.action}`);
          }
        } else if (file.isTemplate) {
          context.fs.copyTpl(context.templatePath(file.src), context.destinationPath(file.dest), context);
        } else {
          context.fs.copy(context.templatePath(file.src), context.destinationPath(file.dest));
        }
      } catch (err) {
        context.log(chalk.red(`\nTemplate processing error on file ${file.src}`));
        throw err;
      }
    }
  }

  static _getConditions(name, prefix) {
    if (name.startsWith(prefix)) {
      let endIndex = name.indexOf('.');
      if (endIndex === -1) {
        endIndex = name.length;
      }
      const actionIndex = name.indexOf('(');
      if (actionIndex !== -1 && actionIndex < endIndex) {
        endIndex = actionIndex;
      }
      return name.substring(prefix.length, endIndex).split('+');
    }
    return [];
  }

  static _checkConditions(conditions, context, rules) {
    return conditions.every(condition => {
      if (!rules[condition]) {
        throw new Error(`Invalid condition: ${condition}`);
      }
      return rules[condition](context.props);
    });
  }

  static _getAction(name) {
    const actionMatch = FileActionRegExp.exec(name);
    return actionMatch ? actionMatch[1] : null;
  }
}

module.exports = FileUtilities;
