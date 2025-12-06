import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { ConfigurationError } from "@auth/utils";
import i18next from "i18next";
import Backend from "i18next-fs-backend";
import * as i18nextMiddleware from "i18next-http-middleware";
import { CONFIG_MESSAGES, CONFIG_ERRORS } from "./constants/config.messages.js";

const defaultLocale = "en";
const defaultNamespace = "system"; // A default namespace for keys without one.

// --- Path Setup ---
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Attempt to find locales directory (dist/locales or src/locales)
const possibleLocalesDirs = [
  path.join(__dirname, "./locales"), // Production (dist/locales)
  path.join(__dirname, "../src/locales"), // Development (from dist/../src/locales if running via tsx/ts-node)
  path.join(process.cwd(), "packages/config/src/locales"), // Fallback relative to root
];

let localesDir = possibleLocalesDirs[0];
for (const dir of possibleLocalesDirs) {
  try {
    // Synchronously check if directory exists to set the correct path before async usage
    // using fs.access would require async in top-level or changing structure.
    // For simplicity in this config module, we'll try/catch in discoverI18nResources or just iterate.
    // However, i18next backend needs a string. Let's rely on discoverI18nResources to find it.
  } catch { }
}

async function discoverI18nResources() {
  // Find valid locales directory
  let foundLocalesDir = null;
  for (const dir of possibleLocalesDirs) {
    try {
      await fs.access(dir);
      foundLocalesDir = dir;
      break;
    } catch {
      continue;
    }
  }

  if (!foundLocalesDir) {
    throw new ConfigurationError(`${CONFIG_MESSAGES.I18N_DISCOVERY_FAILED}: Could not locate locales directory. Checked: ${possibleLocalesDirs.join(", ")}`);
  }

  // Update the global variable so backend uses correct path
  localesDir = foundLocalesDir;

  try {
    const dirents = await fs.readdir(localesDir, { withFileTypes: true });
    const availableLocales = dirents
      .filter((dirent) => dirent.isDirectory())
      .map((dirent) => dirent.name);

    if (availableLocales.length === 0) {
      throw new ConfigurationError(CONFIG_MESSAGES.I18N_NO_LOCALES);
    }

    const namespaceFiles = await fs.readdir(
      path.join(localesDir, defaultLocale)
    );
    const availableNamespaces = namespaceFiles
      .filter((file) => file.endsWith(".json"))
      .map((file) => path.basename(file, ".json"));

    return { availableLocales, availableNamespaces };
  } catch (error) {
    if (error instanceof ConfigurationError) {
      throw error;
    }
    throw new ConfigurationError(
      `${CONFIG_MESSAGES.I18N_DISCOVERY_FAILED}: ${error.message}`
    );
  }
}

const { availableLocales, availableNamespaces } = await discoverI18nResources();

// Initialize i18next instance
const i18nInitPromise = i18next
  .use(Backend)
  .use(i18nextMiddleware.LanguageDetector)
  .init({
    backend: {
      loadPath: path.join(localesDir, "{{lng}}/{{ns}}.json"),
    },
    fallbackLng: defaultLocale,
    // all lng and ns will be preloaded, for lazy loading, remove this option
    preload: availableLocales, //performance optimaztion
    defaultNS: defaultNamespace,
    ns: availableNamespaces,
  });

export const i18nInstance = i18next;
export const i18nMiddleware = i18nextMiddleware;

// Export a mutable t function that defaults to a no-op until initialized
export let t = (key) => key;

export const initI18n = async () => {
  await i18nInitPromise;
  // Update the exported t function to use the initialized i18next instance
  t = i18next.t.bind(i18next);
  return i18next;
};
