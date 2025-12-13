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
            ["@auth/app-bootstrap", "./packages/app-bootstrap"],
            ["@auth/config", "./packages/config"],
            ["@auth/contracts", "./packages/contracts"],
            ["@auth/core", "./packages/core"],
            ["@auth/database", "./packages/database"],
            ["@auth/email", "./packages/email"],
            ["@auth/eslint-config", "./packages/eslint-config"],
            ["@auth/i18n", "./packages/i18n"],
            ["@auth/logger", "./packages/logger"],
            ["@auth/observability", "./packages/observability"],
            ["@auth/queues", "./packages/queues"],
            ["@auth/redis", "./packages/redis"],
            ["@auth/utils", "./packages/utils"],
            ["@auth/web", "./packages/web"],
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
            "./packages/app-bootstrap",
            "./packages/config",
            "./packages/contracts",
            "./packages/core",
            "./packages/database",
            "./packages/email",
            "./packages/eslint-config",
            "./packages/i18n",
            "./packages/logger",
            "./packages/observability",
            "./packages/queues",
            "./packages/redis",
            "./packages/utils",
            "./packages/web",
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
