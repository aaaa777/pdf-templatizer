// rollup.config.js
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import html from '@rollup/plugin-html';
import { glob } from 'glob';
import copy from 'rollup-plugin-copy';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, resolve as pathResolve } from 'path';
import url from '@rollup/plugin-url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const templateHTML = readFileSync(pathResolve(__dirname, 'src/pages/index.html'), 'utf8');

let configs = glob.sync('src/pages/*.js').map(input => ({ 
  input,
  output: {
    dir: 'dist/',
    format: 'esm',
    name: 'PDFEditor'
  },
  plugins: [
    resolve(),
    commonjs(),
    html({
      fileName: 'index.html',
      publicPath: '../..',
      template: ({ attributes, files, meta, publicPath, title }) => {
        return templateHTML;
      }
    }),
    copy({
      targets: [
        { src: 'node_modules/pdfjs-dist/build/pdf.worker.mjs', dest: 'dist/assets/js' },
        { src: 'node_modules/pdfjs-dist/cmaps/*', dest: 'dist/assets/cmaps' },
        { src: 'src/static/fonts/*', dest: 'dist/assets/fonts' },
        { src: 'src/static/css/*', dest: 'dist/assets/css'}
      ]
    })
  ]
}));

export default configs;