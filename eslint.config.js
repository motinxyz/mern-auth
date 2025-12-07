import sharedConfig from "@auth/eslint-config";
import importPlugin from "eslint-plugin-import";

export default [
  ...sharedConfig,
  {
    plugins: { import: importPlugin },
  },
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
    rules: {
      "import/no-extraneous-dependencies": [
        "error",
        {
          packageDir: [
            "./",
            "./packages/api",
            "./packages/config",
            "./packages/core",
            "./packages/database",
            "./packages/email",
            "./packages/queues",
            "./packages/utils",
            "./packages/worker",
          ],
        },
      ],
    },
  },
  {
    files: [
      "**/*.test.js",
      "**/*.test.ts",
      "**/vitest.config.js",
      "**/vitest.config.ts",
    ],
    rules: {
      "import/no-extraneous-dependencies": "off",
      "@typescript-eslint/no-extraneous-class": "off",
    },
  },
];
