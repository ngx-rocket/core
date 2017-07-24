'use strict';

const path = require('path');
const _ = require('lodash');
const ejs = require('ejs');
const chalk = require('chalk');

const FileExclusions = ['.DS_Store', 'Thumbs.db'];
const FileActionRegExp = /^[_-a-zA-Z]*\(([a-zA-Z]+)\)\./;
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
    _.remove(files, file => !_.every(FileExclusions, excludeFile => !_.includes(file, excludeFile)));

    return _.map(files, file => {
      const src = path.relative(templatePath, file);
      const basename = path.basename(src);
      const dirname = path.dirname(src);
      const hasFileCondition = _.startsWith(basename, '__');
      const hasFolderCondition = _.startsWith(dirname, '_');
      const actionMatch = FileActionRegExp.exec(basename);
      const action = actionMatch ? actionMatch[1] : null;
      let isTemplate = _.startsWith(basename, '_');
      let dest = path.relative(hasFolderCondition ? dirname.split(path.sep)[0] : '.', src);

      if (hasFileCondition || action) {
        const fileName = path.basename(src).replace(FileCleanupRexExp, '');
        isTemplate = _.startsWith(fileName, '_') && action !== 'raw';
        dest = path.join(dirname, fileName);
      }

      if (isTemplate) {
        dest = path.join(path.dirname(dest), path.basename(dest).slice(1));
      }

      return {
        src,
        dest,
        isTemplate,
        hasFileCondition,
        hasFolderCondition,
        action
      };
    });
  }

  static writeFile(context, file, prefixRules) {
    let write = !file.hasFolderCondition || _.every(prefixRules, (rule, folder) => {
      return !_.startsWith(path.dirname(file.src), '_' + folder) || rule(context.props);
    });

    write = write && (!file.hasFileCondition || _.every(prefixRules, (rule, prefix) => {
      return !_.startsWith(path.basename(file.src), '__' + prefix) || rule(context.props);
    }));

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
}

module.exports = FileUtilities;
