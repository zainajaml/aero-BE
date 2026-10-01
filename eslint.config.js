import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    ignores: [
      "dist",
      "coverage",
      "test-results",
      "playwright-report",
      ".tanstack",
      "src/routeTree.gen.ts",
      "src/shared/api/schema.gen.ts",
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: { globals: globals.browser },
    plugins: { "react-hooks": reactHooks, "react-refresh": reactRefresh },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
    },
  },
  {
    // App code reaches the backend only through the typed API layer; e2e helpers may use fetch.
    files: ["src/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-globals": [
        "error",
        {
          name: "fetch",
          message: "Call the backend through src/shared/api (feature *.api.ts files).",
        },
      ],
    },
  },
  {
    files: ["src/shared/api/**", "src/shared/ui/**"],
    rules: { "no-restricted-globals": "off", "react-refresh/only-export-components": "off" },
  },
  {
    // Plain scripts served as-is (e.g. the pre-paint theme script).
    files: ["public/**/*.js"],
    languageOptions: { globals: globals.browser, sourceType: "script" },
  },
);
