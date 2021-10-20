import svelte from "rollup-plugin-svelte";
import commonjs from "@rollup/plugin-commonjs";
import resolve from "@rollup/plugin-node-resolve";
import serve from "rollup-plugin-serve";
import livereload from "rollup-plugin-livereload";
import { terser } from "rollup-plugin-terser";
import sveltePreprocess from "svelte-preprocess";
import typescript from "@rollup/plugin-typescript";
import css from "rollup-plugin-css-only";
import builtins from "rollup-plugin-node-builtins";
import nodeResolve from "@rollup/plugin-node-resolve";

const production = !process.env.ROLLUP_WATCH;

export default {
  input: "src/frontend/main.ts",
  output: {
    sourcemap: !production,
    format: "iife",
    name: "fluide",
    file: "public/build/bundle.js",
  },
  plugins: [
    nodeResolve({ browser:true, preferBuiltins: true }),
    commonjs(),
    builtins(),
    svelte({
      preprocess: sveltePreprocess({
        typescript: {
            tsconfigFile: production ? "./tsconfig.svelte.prod.json" : "./tsconfig.svelte.json",
          }
        }),
      compilerOptions: {
        dev: !production,
      },
    }),
    css({
      output: "bundle.css",
      mangle: production,
      compress: production,
    }),
    resolve({
      browser: true,
      dedupe: ["svelte"],
    }),
    typescript({
      tsconfig: production ? "./tsconfig.svelte.prod.json" : "./tsconfig.svelte.json",
      sourceMap: !production,
      inlineSources: !production,
    }),
    !production &&
      serve({
        host: "localhost",
        port: 5000,
        contentBase: "public",
      }),
    !production &&
      livereload({
        watch: "public",
      }),
    production &&
      terser({
        compress: true,
        mangle: true,
      }),
  ],
  watch: {
    clearScreen: false,
  },
};
