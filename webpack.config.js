const path = require('path');
const workboxPlugin = require('workbox-webpack-plugin');
const htmlPlugin = require('html-webpack-plugin');
const cleanPlugin = require('clean-webpack-plugin');

module.exports = {
  mode: 'production',
//  mode: 'development',
//  devtool: 'inline-source-map',
  entry: './src/index.ts',
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/
      }
    ]
  },
  resolve: {
    extensions: [ '.tsx', '.ts', '.js' ]
  },
  output: {
    filename: 'js/bundle.js',
    path: path.resolve(__dirname, 'public')
  },
  plugins: [
    new cleanPlugin(['public/js']),
    new workboxPlugin.InjectManifest({
      swDest: 'sw.js',
      swSrc: 'src/src-sw.js',
      importsDirectory: 'js',

       globDirectory: 'public/',
       globPatterns: [
//     '**/*.js',
     '**/*.html',
// //    '**/*.css',
// //    '**/*.ico',
// //    '**/*.json'
       ],
    })
  ]
};
