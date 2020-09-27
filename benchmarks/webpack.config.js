// @flow
const webpack = require('webpack');
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

const appDirectory = path.resolve(__dirname);

module.exports = {
  ...(process.env.NODE_ENV === 'development' ? {
    mode: 'development',
    devtool: 'inline-source-map',
  }: {
    mode: 'production',
    devtool: 'source-map',
  }),
  context: __dirname,
  entry: './src/index',
  output: {
    path: path.resolve(appDirectory, 'dist'),
    filename: 'bundle.js',
    publicPath: '/'
  },
  performance: {
    hints: false,
  },
  module: {
    rules: [
      {
        test: /\.css$/,
        use: [
          'style-loader',
          {
            loader: 'css-loader',
            options: { modules: true, localIdentName: '[hash:base64:8]' },
          },
        ],
      },
      {
        test: /\.js$/,
        include: [path.join(appDirectory, 'src')],
        use: {
          loader: 'babel-loader',
        },
      },
    ],
  },
  plugins: [
    new BundleAnalyzerPlugin({
      analyzerMode: 'static',
      openAnalyzer: false,
    }),

    new webpack.DefinePlugin({
      __VERSION__: JSON.stringify('benchmark'),
    }),

    new HtmlWebpackPlugin({
      title: 'Performance tests',
      template: './index.html'
    }),
  ],
  resolve: {
    alias: {
      'react-native': 'react-native-web'
    },
  },
};
