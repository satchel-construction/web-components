import css from "rollup-plugin-import-css";
import terser from '@rollup/plugin-terser';
import resolve from '@rollup/plugin-node-resolve';

export default {
  input: 'src/index.js',
  output: {
    file: 'dist/bundle.js',
    format: 'iife',
    name: 'SatchelTools',
    plugins: [terser()],
    globals: {
      fuzzysort: 'fuzzysort',
      zod: 'Zod',
    },
  },
  plugins: [resolve({ moduleDirectory: ['node_modules'], browser: true }), css()],
  external: ['fuzzysort', 'Zod'],
};
