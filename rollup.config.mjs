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

const templateHTML = readFileSync(pathResolve(__dirname, 'src/index.html'), 'utf8');

const configs = glob.sync('src/**.js').map(input => ({ 
  input,
  output: {
    dir: 'dist',
    format: 'esm',
    name: 'PDFEditor'
  },
  plugins: [
    html({
      fileName: 'index.html',
      publicPath: './',
      template: () => templateHTML
    }),
    url({
      include: ['**/*.ttf'],
      limit: 0, // ファイルサイズの制限を設定
      emitFiles: true,
    }),
    resolve(),
    commonjs(),
    copy({
      targets: [
        { src: 'node_modules/pdfjs-dist/build/pdf.worker.mjs', dest: 'dist' },
        { src: 'node_modules/pdfjs-dist/cmaps/*', dest: 'dist/cmaps' },
        { src: 'src/fonts/*', dest: 'dist/fonts' },
      ]
    })
  ]
}));

export default configs;