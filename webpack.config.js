const path = require('path');
const TerserPlugin = require('terser-webpack-plugin');

module.exports = {
  entry: './src/index.js',
  target: 'webworker',
  mode: 'production',
  
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: [
              ['@babel/preset-env', {
                targets: { browsers: ['chrome >= 80'] },
                modules: false,
                useBuiltIns: 'usage',
                corejs: 3
              }]
            ]
          }
        }
      }
    ]
  },

  optimization: {
    minimize: true,
    minimizer: [
      new TerserPlugin({
        terserOptions: {
          compress: {
            passes: 5, // Maximum compression passes - very CPU intensive
            drop_console: true,
            drop_debugger: true,
            pure_funcs: ['console.log'],
            reduce_vars: true,
            reduce_funcs: true,
            collapse_vars: true,
            inline: 3,
            unsafe: true,
            unsafe_comps: true,
            unsafe_math: true,
            unsafe_proto: true,
            keep_infinity: true
          },
          mangle: {
            toplevel: true,
            properties: {
              regex: /^_/
            }
          },
          format: {
            comments: false,
          },
        },
        parallel: 8, // Use maximum parallel processes
        extractComments: false
      }),
    ],
    
    splitChunks: {
      chunks: 'all',
      minSize: 0,
      maxSize: 244000,
      cacheGroups: {
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          chunks: 'all',
          priority: 10
        }
      }
    }
  },

  resolve: {
    fallback: {
      "crypto": false,
      "stream": false,
      "buffer": false,
      "util": false
    }
  },

  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'worker.js',
    clean: true
  }
};
