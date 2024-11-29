const { override } = require('customize-cra');
const TerserPlugin = require('terser-webpack-plugin');

module.exports = override((config) => {
  if (process.env.NODE_ENV === 'production') {
    config.optimization.minimizer = [
      new TerserPlugin({
        terserOptions: {
          compress: {
            drop_console: false,
            drop_debugger: true,
            pure_funcs: ['console.log', 'console.info', 'console.debug']
          },
          mangle: {
            safari10: true,
          },
          output: {
            comments: false,
            ascii_only: true,
          },
          sourceMap: false
        },
        extractComments: false,
      }),
    ];
    
    config.devtool = false;
  }
  return config;
});
