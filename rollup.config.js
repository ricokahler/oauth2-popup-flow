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
    plugins: [typescript({ ...rest, exclude, tsconfig: false })],
  },
  {
    input: './src/index.ts',
    output: {
      file: './dist/index.esm.js',
      format: 'esm',
      sourcemap: true,
    },
    plugins: [
      typescript({
        ...rest,
        exclude,
        tsconfig: false,
        target: 'es2015',
        module: 'es2015',
      }),
    ],
  },
];
