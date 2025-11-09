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
    settings: {
      "import/resolver": {
        node: {
          extensions: [".js", ".jsx", ".ts", ".tsx", ".d.ts"],
          moduleDirectory: ["node_modules", "packages"],
        },
        typescript: {
          alwaysTryTypes: true, // IMPORTANT - this helps find types even in JS projects
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
      "import/no-unresolved": "error",
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
