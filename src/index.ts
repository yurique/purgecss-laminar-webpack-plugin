import { RawSource } from 'webpack-sources';
import * as search from './search';
import _ from 'lodash';
import PurgeCSS, { defaultOptions } from 'purgecss';
import {
  UserDefinedOptions,
  PurgedStats,
  PurgeAsset,
  StringFilters,
  StringMatcher
} from './types';
import { Compiler, Stats, compilation as compilationType } from 'webpack';
import { pluginName } from './common';
import prettyBytes from 'pretty-bytes';
import { processCode } from './code';
import { infoLog, errorLog, log } from './console';
import { blue } from 'chalk';
import { writeDebugFile } from './debug';

type Compilation = compilationType.Compilation;

const styleExtensions = ['.css'];
const javascriptExtensions = ['.js'];

const getAssetsToPurge = (
  assetsFromCompilation: PurgeAsset[],
  files: string[]
) => assetsFromCompilation.filter(asset => asset && files.includes(asset.name));

export default class PurgeCSSLaminarWebpackPlugin {
  options: UserDefinedOptions;
  purgedStats: PurgedStats = {};

  constructor(options?: UserDefinedOptions) {
    this.options = { ...options };
  }

  apply(compiler: Compiler) {
    compiler.hooks.emit.tapPromise(pluginName, (compilation: Compilation) =>
      this.runPurgeCss(compilation)
    );
    compiler.hooks.done.tap(pluginName, (stats: Stats) =>
      this.onHooksDone(stats)
    );
  }

  onHooksDone = (stats: Stats) => {
    if (stats.hasErrors()) {
      if (this.options && this.options.verbose) {
        errorLog('pausing due to webpack errors');
      }
      return;
    }

    if (this.options && this.options.rejected) {
      // @ts-ignore
      stats.purged = this.purgedStats;
    }
  };

  runPurgeCss = async (compilation: Compilation) => {
    const debug = this.options.debug || false;
    log('\nprocessing assets...');
    const assetsFromCompilation = search.getAssets(
      compilation.assets,
      styleExtensions
    );
    const javascriptsFromCompilation = search.getAssets(
      compilation.assets,
      javascriptExtensions
    );

    infoLog('JavaScript assets:');
    javascriptsFromCompilation.forEach(j =>
      log('  ', j.name)
    );
    const classNames: string[][] = javascriptsFromCompilation.map(
      ({ name, asset }) => {
        infoLog(
          'Processing JavaScript asset',
          name,
          blue(prettyBytes(asset.source().length))
        );
        const code = asset.source();
        const allStrings = processCode(code, name, 1, 1, debug);
        const whitespace = /\s+/gm;
        const splitStringsArray: string[][] = allStrings.map(s =>
          s.split(whitespace)
        );
        const splitStrings: string[] = ([] as string[]).concat(
          ...splitStringsArray
        );

        const distinctStrings: string[] = _.uniq(splitStrings);
        writeDebugFile(
          `strings/${name.replace('/', '-')}.1.distinct-tokens-from-strings`,
          () => distinctStrings.join('\n'),
          debug
        );
        const className = /^-?[_a-zA-Z]+[-_a-zA-Z0-9:]*$/;
        const validClassNames: string[] = distinctStrings.filter(s =>
          className.test(s)
        );
        writeDebugFile(
          `strings/${name.replace('/', '-')}.2.valid-class-names-from-strings`,
          () => _.sortBy(validClassNames).join('\n'),
          debug
        );
        return validClassNames;
      }
    );

    const distinctClassNames: string[] = _.uniq(
      ([] as string[]).concat(...classNames)
    );
    infoLog('CSS class names count:', distinctClassNames.length);

    writeDebugFile(
      `strings/-valid-class-names`,
      () => _.sortBy(distinctClassNames).join('\n'),
      debug
    );

    const filteredClassNames: string[] = filterClassNames(
      distinctClassNames,
      this.options.stringFilters || {}
    );
    infoLog('Filtered CSS class names count:', filteredClassNames.length);

    writeDebugFile(
      `strings/-filtered-class-names`,
      () => _.sortBy(filteredClassNames).join('\n'),
      debug
    );

    const promises = compilation.chunks.map((chunk: any) => {
      const { files } = chunk;
      const assetsToPurge = getAssetsToPurge(assetsFromCompilation, files);
      infoLog('CSS assets:');
      assetsToPurge.forEach(a => log('  ', a.name));

      return assetsToPurge.map(async ({ name, asset }) => {
        infoLog(
          'Processing CSS asset',
          name,
          blue(prettyBytes(asset.source().length))
        );
        const options = {
          ...defaultOptions,
          ...this.options
        };

        const optionsForPurgeCss = {
          content: [
            {
              extension: '',
              raw: ''
            }
          ],
          css: [
            {
              raw: asset.source()
            }
          ],
          defaultExtractor: () => filteredClassNames,
          extractors: [],
          fontFace: options.fontFace,
          keyframes: options.keyframes,
          output: options.output,
          rejected: options.rejected,
          variables: options.variables,
          whitelist: options.whitelist,
          whitelistPatterns: options.whitelistPatterns,
          whitelistPatternsChildren: options.whitelistPatternsChildren
        };
        try {
          const purgecss = await new PurgeCSS().purge(optionsForPurgeCss);
          const purged = purgecss[0];
          if (purged.rejected) {
            this.purgedStats[name] = purged.rejected;
          }
          log(
            '  purged',
            name,
            blue(prettyBytes(asset.source().length)),
            '-->',
            blue(prettyBytes(purged.css.length))
          );
          compilation.assets[name] = new RawSource(purged.css);
        } catch (e) {
          errorLog('PurgeCSS failed', e);
        }
      });
    });
    const allPromises = ([] as Promise<any>[]).concat(...promises);
    await Promise.all(allPromises);
  };
}

const filterClassNames = (classNames: string[], options: StringFilters) =>
  classNames.filter(s => filterClassName(s, options));

const filterClassName = (className: string, options: StringFilters) => {
  const exclusionRules = [
    ...(options.exclude || []),
    (s: string) => (options.skipAllUpperCase ? s.toUpperCase() === s : false),
    (s: string) => (options.onlyAllLowerCase ? s.toLowerCase() !== s : false),
    (s: string) => (options.minLength ? s.length < options.minLength : false),
    (s: string) => (options.maxLength ? s.length > options.maxLength : false)
  ];

  const included = options.include
    ? options.include.find(e =>
        typeof e === 'function' ? e(className) : e.test(className)
      )
    : true;

  const excluded = exclusionRules.find(e =>
    typeof e === 'function' ? e(className) : e.test(className)
  );

  return included && !excluded;
};
