import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import prettier from "eslint-config-prettier";

export default [
  {
    ignores: [
      "node_modules/",
      "playwright-report/",
      "test-results/",
      "blob-report/",
      "allure-results/",
      "allure-report/",
      "playwright/.cache/",
      "playwright/.auth/",
      "playwright/.user-data/",
      ".cache/",
      "auth.json"
    ]
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  prettier,
  {
    languageOptions: {
      globals: {
        ...globals.node
      }
    },
    rules: {
      // Keep ESLint focused on correctness/quality; Prettier handles formatting.
      "no-console": "off"
    }
  }
];
