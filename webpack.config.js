const path = require('path');

module.exports = {
  entry: './src/index.ts',
  output: {
    path: path.resolve(__dirname, './dist'),
    filename: 'oauth2-popup-flow.js',
    library: 'OAuth2PopupFlow',
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
