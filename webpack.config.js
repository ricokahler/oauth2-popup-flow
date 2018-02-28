const path = require('path');

module.exports = {
  entry: './src/index.ts',
  output: {
    path: path.resolve(__dirname, './dist'),
    filename: 'oauth2-window-dot-open.js',
    library: 'OAuth2WindowDotOpen',
    libraryTarget: 'umd',
  },
  module: {
    rules: [
      { test: /\.ts?/, loader: 'awesome-typescript-loader' }
    ]
  },
  resolve: { extensions: ['.ts'] },
  devtool: 'source-map',
};
