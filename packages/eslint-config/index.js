import js from "@eslint/js";
import tseslint from "typescript-eslint";
import securityPlugin from "eslint-plugin-security";
import prettierConfig from "eslint-config-prettier";
import globals from "globals";

export default tseslint.config(
  // Base JS recommendations
  js.configs.recommended,

  // TypeScript recommendations
  ...tseslint.configs.recommended,
  ...tseslint.configs.strict, // Includes no-explicit-any

  // Security recommendations
  securityPlugin.configs.recommended,

  // Global settings
  {
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        ...globals.node,
        ...globals.jest,
      },
      parserOptions: {
        projectService: true, // New way to handle project references
        tsconfigRootDir: process.cwd(),
      },
    },
  },

  // Custom Rules
  {
    rules: {
      "no-console": ["warn", { allow: ["warn", "error"] }],
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/strict-boolean-expressions": "warn", // Warn first, then error later
      "@typescript-eslint/no-floating-promises": "error",

      // Allow unused vars if prefixed with underscore
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
    },
  },

  // Disables for specific files
  {
    files: ["**/*.js"],
    extends: [tseslint.configs.disableTypeChecked],
  },

  // Prettier must be last
  prettierConfig
);
