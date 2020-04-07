const typescript = require('@rollup/plugin-typescript');
const tsconfig = require('./tsconfig.json');

const { compilerOptions, exclude } = tsconfig;
const { declaration, emitDeclarationOnly, outDir, ...rest } = compilerOptions;

module.exports = [
  {
    input: './src/index.ts',
    output: {
      file: './dist/index.js',
      format: 'umd',
      name: 'OAuth2PopupFlow',
      sourcemap: true,
    },
    plugins: [typescript({ exclude, tsconfig: false, ...rest })],
  },
  {
    input: './src/index.ts',
    output: {
      file: './dist/index.esm.js',
      format: 'esm',
      sourcemap: true,
    },
    plugins: [typescript({ exclude, tsconfig: false, ...rest })],
  },
];
