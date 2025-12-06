function getWorkspacePackagePaths() {
  return [
    "./packages/api",
    "./packages/config",
    "./packages/core",
    "./packages/database",
    "./packages/email",
    "./packages/queues",
    "./packages/utils",
    "./packages/worker",
  ];
}

import globals from "globals";
import eslintPlugin from "@eslint/js";
import prettierConfig from "eslint-config-prettier";
import securityPlugin from "eslint-plugin-security";
import importPlugin from "eslint-plugin-import";

export default [
  {
    ignores: ["**/dist/**", "**/node_modules/**", "**/.turbo/**"],
  },
  {
    settings: {
      "import/resolver": {
        alias: {
          map: [
            ["@auth/api", "./packages/api"],
            ["@auth/config", "./packages/config"],
            ["@auth/core", "./packages/core"],
            ["@auth/database", "./packages/database"],
            ["@auth/email", "./packages/email"],
            ["@auth/queues", "./packages/queues"],
            ["@auth/utils", "./packages/utils"],
            ["@auth/worker", "./packages/worker"],
          ],
          extensions: [".js", ".jsx", ".ts", ".tsx", ".d.ts"],
        },
      },
    },
  },
  {
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        ...globals.node,
        ...globals.jest,
      },
    },
  },
  eslintPlugin.configs.recommended,
  prettierConfig,
  securityPlugin.configs.recommended,
  {
    plugins: { import: importPlugin },
    rules: {
      "no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^",
          varsIgnorePattern: "^",
          caughtErrorsIgnorePattern: "^",
        },
      ],
      "import/no-unresolved": "off", // Temporarily disable this rule
      "import/no-unused-modules": [
        "warn",
        {
          unusedExports: true,
          src: ["src/**/*.js"],
        },
      ],
    },
  },
  {
    rules: {
      "import/no-extraneous-dependencies": [
        "error",
        {
          // Correctly resolve dependencies in a pnpm monorepo
          packageDir: ["./", ...getWorkspacePackagePaths()],
        },
      ],
    },
  },
  {
    files: ["**/*.test.js", "**/vitest.config.js"],
    rules: {
      "import/no-extraneous-dependencies": "off",
    },
  },
];
