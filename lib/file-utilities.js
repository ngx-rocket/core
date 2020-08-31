'use strict';

const path = require('path');
const dir = require('node-dir');
const _ = require('lodash');
const ejs = require('ejs');
const chalk = require('chalk');
const ignore = require('ignore');

const FileExclusions = ['.DS_Store', 'Thumbs.db'];
const FileActionRegExp = /^[_+a-zA-Z-]*\(([a-zA-Z]+)\)\./;
const FileCleanupRexExp = /^(__.*?|\([a-zA-Z]+\))\./;

class FileUtilities {
  static mergeJson(context, file) {
    const content = context.fs.readJSON(context.destinationPath(file.dest), {});
    let newContent = context.fs.read(context.templatePath(file.src));
    newContent = file.isTemplate
      ? ejs.render(newContent, context, {filename: file.src})
      : newContent;
    newContent = JSON.parse(newContent);

    _.mergeWith(content, newContent, (a, b) =>
      _.isArray(a) ? _.uniq(a.concat(b)) : undefined
    );

    context.fs.writeJSON(context.destinationPath(file.dest), content);
  }

  static async getFiles(templatePath, generatorType) {
    let promises;
    switch (generatorType) {
      case 'fullstack':
        promises = [
          dir.promiseFiles(
            path.join(templatePath, FileUtilities.ClientTemplatesPath)
          ),
          dir.promiseFiles(
            path.join(templatePath, FileUtilities.ServerTemplatesPath)
          ),
          dir.promiseFiles(
            path.join(templatePath, FileUtilities.RootTemplatesPath)
          )
        ];
        break;
      case 'server':
        promises = [[], dir.promiseFiles(templatePath), []];
        break;
      default:
        promises = [dir.promiseFiles(templatePath), [], []];
    }

    const files = await Promise.all(promises);
    return {
      client: files[0],
      server: files[1],
      root: files[2]
    };
  }

  static prepareFiles(files, templatePath, destinationPath, basePath) {
    basePath = basePath || '';

    // Removes excluded files
    _.remove(
      files,
      (file) =>
        !FileExclusions.every((excludeFile) => !_.includes(file, excludeFile))
    );

    return _.map(files, (file) => {
      let src = path.relative(path.join(templatePath, basePath), file);
      const basename = path.basename(src);
      const dirname = path.dirname(src);
      const rootdir = dirname.split(path.sep)[0];
      const fileConditions = this._getConditions(basename, '__');
      const folderConditions = this._getConditions(rootdir, '__');
      const action = this._getAction(basename);
      let isTemplate = basename.startsWith('_');
      let dest = path.relative(
        folderConditions.length === 0 ? '.' : rootdir,
        src
      );
      let base = '';

      if (fileConditions.length !== 0 || action) {
        const fileName = path.basename(src).replace(FileCleanupRexExp, '');
        isTemplate = fileName.startsWith('_') && action !== 'raw';
        dest = path.join(path.dirname(dest), fileName);
      }

      if (isTemplate) {
        dest = path.join(path.dirname(dest), path.basename(dest).slice(1));
      }

      if (destinationPath) {
        dest = path.join(destinationPath, dest);
        base = destinationPath;
      }

      src = path.join(basePath, src);

      return {
        src,
        dest,
        base,
        isTemplate,
        fileConditions,
        folderConditions,
        action
      };
    });
  }

  static writeFile(context, file, prefixRules) {
    const write =
      (file.folderConditions.length === 0 ||
        this._checkConditions(file.folderConditions, context, prefixRules)) &&
      (file.fileConditions.length === 0 ||
        this._checkConditions(file.fileConditions, context, prefixRules));

    if (write) {
      try {
        if (file.action) {
          switch (file.action) {
            case 'merge':
              FileUtilities.mergeJson(context, file);
              break;
            case 'raw':
              context.fs.copy(
                context.templatePath(file.src),
                context.destinationPath(file.dest),
                {
                  globOptions: {
                    noext: true
                  }
                }
              );
              break;
            default:
              throw new Error(`Invalid action: ${file.action}`);
          }
        } else if (file.isTemplate) {
          context.fs.copyTpl(
            context.templatePath(file.src),
            context.destinationPath(file.dest),
            context
          );
        } else {
          context.fs.copy(
            context.templatePath(file.src),
            context.destinationPath(file.dest),
            {
              globOptions: {
                noext: true
              }
            }
          );
        }
      } catch (error) {
        context.log(
          chalk.red(`\nTemplate processing error on file ${file.src}`)
        );
        throw error;
      }
    }
  }

  static filterFiles(files, patterns) {
    const filter = ignore().add(patterns);
    return files.filter(
      (file) => !filter.ignores(path.relative(file.base || '', file.dest))
    );
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

      return name.slice(prefix.length, endIndex).split('+');
    }

    return [];
  }

  static _checkConditions(conditions, context, rules) {
    return conditions.every((condition) => {
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

FileUtilities.ClientTemplatesPath = 'client';
FileUtilities.ServerTemplatesPath = 'server';
FileUtilities.RootTemplatesPath = 'root';

module.exports = FileUtilities;
