// eslint.config.js
import path from "node:path";
import js from "@eslint/js";
import svelte from "eslint-plugin-svelte";
import globals from "globals";
import ts from "typescript-eslint";
import svelteConfig from "./svelte.config.js";

export default ts.config(
  js.configs.recommended,
  ...ts.configs.recommended,
  ...svelte.configs.recommended,
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
  },
  {
    files: ["**/*.svelte", "**/*.svelte.ts", "**/*.svelte.js"],
    languageOptions: {
      parserOptions: {
        projectService: true,
        extraFileExtensions: [".svelte"],
        parser: ts.parser,
        svelteConfig,
        // 追加
        tsconfigRootDir: path.resolve(__dirname),
        project: "./tsconfig.json",
      },
    },
  },
  {
    rules: {
      // Svelte 関連
      "svelte/no-at-html-tags": "off",
      "svelte/no-useless-mustaches": "off",

      // TypeScript 関連
      "@typescript-eslint/no-unused-vars": "off",
      "@typescript-eslint/explicit-module-boundary-types": "off",

      // JS 共通
      "no-console": "off",
      "no-debugger": "off",
    },
  }
);
