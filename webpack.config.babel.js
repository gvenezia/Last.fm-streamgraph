require("@babel/register");

import dotenv from'dotenv';
import path from 'path';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import ScriptExtHtmlWebpackPlugin from 'script-ext-html-webpack-plugin';

const webpack = require('webpack');

const ExtractTextPlugin = require('extract-text-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');

const paths = {
  src: path.join(__dirname, 'src'),
  dist: path.join(__dirname, 'dist'),
  data: path.join(__dirname, 'data')
}

module.exports = () => {
  // call dotenv and it will return an Object with a parsed key 
  const env = dotenv.config().parsed;

  // create a nice object from the env variable
  const envKeys = Object.keys(env).reduce((prev, next) => {
    prev[`process.env.${next}`] = JSON.stringify(env[next]);
    return prev;
  }, {});

  return {
    mode: 'development',
    context: paths.src,
    entry: ['./app.js', './main.scss'],
    output: {
      filename: 'app.bundle.js',
      path: paths.dist,
      publicPath: 'dist',
    },
    module: {
      rules: [
        {
          test: /\.js$/,
          exclude: [/(node_modules|bower_components)/],
          use: [{
            loader: 'babel-loader',
            options: {
              "presets": ["@babel/preset-env"]
            }
          }],
        },
        {
          test: /\.scss$/,
          use: ExtractTextPlugin.extract([
            'css-loader', 'sass-loader'
          ]),
        }
      ],
    },
    devServer: {
      contentBase: paths.dist,
      compress: true,
      stats: 'errors-only',
    },
    plugins: [
      new ExtractTextPlugin({
        filename: 'main.bundle.css',
        allChunks: true,
      }),
      new CopyWebpackPlugin([
        {
          from: paths.data,
          to: paths.dist + '/data'
        }
      ]),
      new webpack.DefinePlugin(envKeys)
    ]
  }
}
