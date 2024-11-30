import globals from "globals";
import pluginJs from "@eslint/js";
import tseslint from "typescript-eslint";
import { join } from "path";

/** @type {import('eslint').Linter.Config[]} */
export default [
  { files: ["**/*.{js,mjs,cjs,ts}"] },
  { languageOptions: { globals: { ...globals.browser, ...globals.node } } },
  pluginJs.configs.recommended,
  ...tseslint.configs.recommended,
  {
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        tsconfigRootDir: join(process.cwd()),
        project: "./tsconfig.json", // Укажите путь к вашему tsconfig.json
      },
    },
    rules: {
      "no-constant-condition": "off",
      "@typescript-eslint/no-floating-promises": "error",
    },
  },
];