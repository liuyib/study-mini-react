// const webpack = require('webpack');
const path = require('path');
const CleanWebpackPlugin = require('clean-webpack-plugin').CleanWebpackPlugin;
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const InterpolateHtmlPlugin = require('react-dev-utils/InterpolateHtmlPlugin');
const paths = require('./paths');

// const __DEV__ = process.env.NODE_ENV === 'development';
const __PRD__ = process.env.NODE_ENV === 'production';

module.exports = {
  devtool: __PRD__ ? false : 'cheap-module-source-map',
  entry: path.resolve(process.cwd(), 'src/index.jsx'),
  output: {
    path: path.resolve(process.cwd(), 'dist'),
    filename: __PRD__
      ? 'static/js/[name].[contenthash:8].js'
      : 'static/js/bundle.js',
    publicPath: paths.publicUrlOrPath,
  },
  devServer: {
    static: {
      directory: path.join(__dirname, 'public'),
    },
  },
  // optimization: {
  //   splitChunks: {
  //     chunks: 'all',
  //     name: false,
  //   },
  //   runtimeChunk: {
  //     name: (entrypoint) => `runtime-${entrypoint.name}`,
  //   },
  // },
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
    // Clean output dir before rebuild.
    new CleanWebpackPlugin(),
    // Copy all assets from `public` dir to output dir.
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
    // Generates an `index.html` file with the <script> injected.
    new HtmlWebpackPlugin({
      inject: true,
      template: path.resolve(process.cwd(), 'public/index.html'),
    }),
    // Makes the public URL available as %PUBLIC_URL% in index.html,
    // e.g.: <link rel="icon" href="%PUBLIC_URL%/favicon.ico">
    new InterpolateHtmlPlugin(HtmlWebpackPlugin, {
      PUBLIC_URL: paths.publicUrlOrPath.slice(0, -1),
    }),
  ].filter(Boolean),
};
