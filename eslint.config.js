import globals from "globals";
import pluginJs from "@eslint/js";
import eslintConfigPrettier from "eslint-config-prettier";
import security from "eslint-plugin-security";
import importPlugin from "eslint-plugin-import";

export default [
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
  pluginJs.configs.recommended,
  eslintConfigPrettier,
  security.configs.recommended,
  {
    plugins: { import: importPlugin },
    rules: {
      "import/no-unresolved": "error",
      "import/no-extraneous-dependencies": [
        "error",
        {
          // Allow devDependencies to be imported in test files
          devDependencies: ["**/*.test.js", "**/*.spec.js", "**/tests/**"],
          // Correctly resolve dependencies in a pnpm monorepo
          packageDir: ["./", ...getWorkspacePackagePaths()],
        },
      ],
    },
  },
];
