import fs from "node:fs";
import path from "node:path"; // Keep path for Node.js environment
import { fileURLToPath } from "node:url";
import i18next from "i18next";
import Backend from "i18next-fs-backend";
import i18nextMiddleware from "i18next-http-middleware";

// --- Configuration ---
const defaultLocale = "en";
const defaultNamespace = "system"; // A default namespace for keys without one.

// --- Path Setup ---
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const localesDir = path.join(__dirname, "./locales");

// --- Dynamic Discovery ---
// Discover available locales (e.g., 'en', 'es') by reading subdirectories
const availableLocales = fs
  .readdirSync(localesDir, { withFileTypes: true })
  .filter((dirent) => dirent.isDirectory())
  .map((dirent) => dirent.name);

// Discover available namespaces (e.g., 'system', 'auth') by reading files
// from the default locale's directory.
const availableNamespaces = fs
  .readdirSync(path.join(localesDir, defaultLocale))
  .filter((file) => file.endsWith(".json"))
  .map((file) => path.basename(file, ".json"));

// Initialize i18next instance
i18next
  .use(Backend)
  .use(i18nextMiddleware.LanguageDetector)
  .init({
    backend: {
      loadPath: path.join(localesDir, "{{lng}}/{{ns}}.json"),
    },
    fallbackLng: defaultLocale,
    preload: availableLocales,
    defaultNS: defaultNamespace,
    ns: availableNamespaces,
  });

export const i18nInstance = i18next;
export const i18nMiddleware = i18nextMiddleware;
