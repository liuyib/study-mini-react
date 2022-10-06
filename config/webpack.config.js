const webpack = require('webpack');
const path = require('path');
const CleanWebpackPlugin = require('clean-webpack-plugin').CleanWebpackPlugin;
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');

const __DEV__ = process.env.NODE_ENV === 'development';
const __PRD__ = process.env.NODE_ENV === 'production';

module.exports = {
  entry: path.resolve(process.cwd(), 'src/index.jsx'),
  output: {
    path: path.resolve(process.cwd(), 'dist'),
    filename: __PRD__
      ? 'static/js/[name].[contenthash:8].js'
      : 'static/js/bundle.js',
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
  plugins: [
    new CleanWebpackPlugin(),
    new CopyWebpackPlugin({
      patterns: [
        {
          from: 'public/**/*',
          to: '[name][ext]',
          globOptions: {
            ignore: ['**/index.html'],
          },
        },
      ],
    }),
    new HtmlWebpackPlugin({
      template: path.resolve(process.cwd(), 'public/index.html'),
    }),
  ].filter(Boolean),
};
