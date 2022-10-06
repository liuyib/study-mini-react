const webpack = require('webpack');
const path = require('path');

const config = {
  entry: path.resolve(process.cwd(), 'src/index.jsx'),
  output: {
    path: path.resolve(process.cwd(), 'dist'),
    filename: 'bundle.js',
  },
};

module.exports = config;
