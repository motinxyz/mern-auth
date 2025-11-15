import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { ConfigurationError, I18N_MESSAGES } from "@auth/utils";
import i18next from "i18next";
import Backend from "i18next-fs-backend";
import i18nextMiddleware from "i18next-http-middleware";
import { setT } from "./index.js"; // Import setT

// --- Configuration ---
const defaultLocale = "en";
const defaultNamespace = "system"; // A default namespace for keys without one.

// --- Path Setup ---
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const localesDir = path.join(__dirname, "./locales");

async function discoverI18nResources() {
  try {
    const dirents = await fs.readdir(localesDir, { withFileTypes: true });
    const availableLocales = dirents
      .filter((dirent) => dirent.isDirectory())
      .map((dirent) => dirent.name);

    if (availableLocales.length === 0) {
      throw new ConfigurationError(I18N_MESSAGES.NO_LANG_DIR);
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
      `${I18N_MESSAGES.DISCOVERY_FAILED} ${error.message}`
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
export const initI18n = async () => {
  await i18nInitPromise;
  setT(i18next.t.bind(i18next)); // Set the global t function after initialization
  return i18next;
};
