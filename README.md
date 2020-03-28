# purgecss-laminar-webpack-plugin

[Webpack](https://github.com/webpack/webpack) plugin to remove unused css for [scala.js](https://www.scala-js.org/) + [laminar](https://github.com/raquo/Laminar) projects.

Derived from the [purgecss-webpack-plugin](https://github.com/FullHuman/purgecss/tree/master/packages/purgecss-webpack-plugin).

## Install
```sh
yarn add purgecss-laminar-webpack-plugin --dev
```

## Usage

So far this plugin was tested to work with the [extract-css-chunks-webpack-plugin](https://github.com/faceyspacey/extract-css-chunks-webpack-plugin) plugin.

```js
const ExtractCssChunks = require('extract-css-chunks-webpack-plugin');
const PurgeCSSLaminarPlugin = require('purgecss-laminar-webpack-plugin').default;

module.exports = {
  // ...
  plugins: [
    new ExtractCssChunks({
        // ...
    }),
    new PurgeCSSLaminarPlugin(),
  ]
  // ...
}
```

See [scala-js-laminar-starter.g8](https://github.com/yurique/scala-js-laminar-starter.g8) for a full configuration example.

### Options

The options available in purgecss [Configuration](https://www.purgecss.com/configuration.html) are also available in the webpack plugin with the exception of `css`, `content`, `extractors` and `defaultExtractor`.

These options from `purgecss-webpack-plugin` are not implemented:

* `paths`
* `only`

Othewise you can check out the [purgecss-webpack-plugin](https://github.com/FullHuman/purgecss/tree/master/packages/purgecss-webpack-plugin) documentations for more details about configuration. 

#### Filtering strings 

You can reduce the number of strings that are considered to be potential CSS class names using the filters:

```js
export interface StringFilters {
  exclude?: (RegExp | StringMatcher)[];
  include?: (RegExp | StringMatcher)[];
  onlyAllLowerCase?: boolean;
  skipAllUpperCase?: boolean;
  minLength?: number;
  maxLength?: number;
}
```

```js
module.exports = {
  // ...
  plugins: [    
    new PurgeCSSLaminarPlugin({
      stringFilters: {
        minLength: 2,
        maxLength: 30,
        skipAllUpperCase: true, // filters out strings like 'NOT-A-CLASSNAME',
        onlyAllLowerCase: true, // filters out strings like 'Not-a-ClassName',
        exclude: [
          // a string will be excluded if ANY of these matches
          /_/ // filters out strings that contain `_`,
          (s) => s.starts // filters out strings that start with an `a` and end with an `e`
        ],
        include: [
          // same as exclude, but a string will be excluded if NONE of these match
        ]
      },
    }),
  ]
  // ...
}
```

#### Debug

Setting `{ debug: true }` in the plugin options will make it generate a number of files in the `.purgecss-laminar-debug/` directory when parsing the `.js` files, in case you need to debug something:

```js
module.exports = {
  // ...
  plugins: [    
    new PurgeCSSLaminarPlugin({
      debug: true
    }),
  ]
  // ...
}
```

## License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.
