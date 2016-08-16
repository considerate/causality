import babel from 'rollup-plugin-babel';
import filesize from 'rollup-plugin-filesize';
import uglify from 'rollup-plugin-uglify';

export default {
  entry: 'src/index.js',
  dest: 'dist/index.js',
  moduleName: 'effectjs',
  plugins: [
      babel({
          exclude: 'node_modules/**',
          babelrc: false,
          presets: [['es2015', {modules: false}]],
      }),
      uglify(),
      filesize()
  ],
  format: 'umd',
};

