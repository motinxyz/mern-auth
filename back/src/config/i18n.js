import fs from "node:fs";
import path from "node:path"; // Keep path for Node.js environment
import { fileURLToPath } from "node:url";

// --- Configuration ---
const defaultLocale = "en";
const defaultNamespace = "system"; // A default namespace for keys without one.

// --- Path Setup ---
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const localesDir = path.join(__dirname, "../locales");

// --- Caching ---
// A cache for loaded language data to avoid reading from disk repeatedly.
// The structure will be: { en: { common: {...}, auth: {...} }, es: { ... } }
const loadedTranslations = {};

// Declare these outside the conditional block to ensure they are always defined
let availableLocales = [];
let translationModules = {}; // This will only be populated in Vitest env

// Use Vite's import.meta.glob for test environments, fall back to fs for production/development.
if (import.meta.env && import.meta.env.VITEST) {
  // --- Dynamic Language & Namespace Discovery using Vite's import.meta.glob ---
  translationModules = import.meta.glob("../locales/**/*.json");
  // Extract available locales from the glob paths
  availableLocales = [
    ...new Set(Object.keys(translationModules).map((p) => p.split("/")[2])), // e.g., '../locales/en/common.json' -> 'en'
  ];
  // For Node.js runtime, fs.readdirSync is used, so translationModules remains empty.
  // This is fine as the Node.js branch of loadLocaleData will use fs.readdirSync again.
} else {
  // --- Dynamic Language Discovery using Node.js 'fs' module ---
  availableLocales = fs
    .readdirSync(localesDir, { withFileTypes: true })
    .filter((dirent) => dirent.isDirectory())
    .map((dirent) => dirent.name);
}

// --- Core Functions ---

/**
 * Loads all JSON namespace files for a given locale and caches them.
 * This function is async and uses dynamic imports for efficiency.
 * @param {string} locale - The locale to load (e.g., 'en').
 * @returns {Promise<object>} A promise that resolves to the translations for the locale.
 */
const loadLocaleData = async (locale) => {
  if (loadedTranslations[locale]) {
    // Return from cache if available
    return loadedTranslations[locale];
  }

  const translations = {};
  const localePromises = [];

  if (import.meta.env && import.meta.env.VITEST) {
    // Vite/Vitest environment
    for (const p in translationModules) {
      if (p.startsWith(`../locales/${locale}/`)) {
        const namespace = path.basename(p, ".json");
        const promise = translationModules[p]().then((mod) => {
          translations[namespace] = mod.default;
        });
        localePromises.push(promise);
      }
    }
  } else {
    // Node.js runtime environment
    const localePath = path.join(localesDir, locale);
    const namespaceFiles = fs
      .readdirSync(localePath)
      .filter((file) => file.endsWith(".json"));
    for (const file of namespaceFiles) {
      const namespace = path.basename(file, ".json");
      const filePath = path.join(localePath, file);
      const fileContent = fs.readFileSync(filePath, "utf8");
      translations[namespace] = JSON.parse(fileContent);
    }
  }

  await Promise.all(localePromises);
  loadedTranslations[locale] = translations; // Cache the result
  return loadedTranslations[locale];
};

/**
 * Creates a translator function `t` for a given locale.
 * @param {string} [locale='en'] - The desired locale.
 * @returns {Promise<Function>} A promise that resolves to the translator function.
 */
export const getTranslator = async (locale = defaultLocale) => {
  const lang = availableLocales.includes(locale) ? locale : defaultLocale;
  const translations = await loadLocaleData(lang);

  return (key, context) => {
    const [namespace, i18nKey] = key.includes(":")
      ? key.split(":")
      : [defaultNamespace, key];

    let translation =
      i18nKey
        .split(".")
        .reduce(
          (obj, keyPart) => obj && obj[keyPart],
          translations[namespace]
        ) || key;

    if (context && typeof translation === "string") {
      Object.keys(context).forEach((placeholder) => {
        const regex = new RegExp(`{{${placeholder}}}`, "g");
        translation = translation.replace(regex, context[placeholder]);
      });
    }

    return translation;
  };
};
