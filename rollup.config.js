import typescript from '@rollup/plugin-typescript';
import nodeResolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import tsconfig from "./tsconfig.json";
import json from '@rollup/plugin-json';

const isExecutable = process.env.entry === "executable";

export default {
  input: isExecutable ? "src/cli/packaged.ts" : {
    index: "src/index.ts",
    cli: "src/cli/index.ts",
  },
  treeshake: false,
  output: {
    dir: `dist/${process.env.entry}`,
    format: 'esm',
  },
  plugins: [
    ...(isExecutable ? [
      nodeResolve({
        preferBuiltins: true,
      }),
    ] : []),
    json(),
    commonjs({
      requireReturnsDefault: true,
    }),
    typescript({
      compilerOptions: isExecutable ? {
        ...tsconfig.compilerOptions,
        declaration: false,
        outDir: undefined,
      } : tsconfig.compilerOptions,
    }),
  ]
};

