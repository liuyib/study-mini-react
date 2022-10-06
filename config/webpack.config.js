const webpack = require('webpack');
const path = require('path');

const config = {
  entry: path.resolve(process.cwd(), 'src/index.jsx'),
  output: {
    path: path.resolve(process.cwd(), 'dist'),
    filename: 'bundle.js',
  },
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        use: 'babel-loader',
        exclude: /node_modules/,
      },
    ],
  },
};

module.exports = config;
