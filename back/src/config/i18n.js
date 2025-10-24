import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

// --- Configuration ---
const defaultLocale = "en";
const defaultNamespace = "common"; // A default namespace for keys without one.

// --- Path Setup ---
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const localesDir = path.join(__dirname, "../locales");

// --- Caching ---
// A cache for loaded language data to avoid reading from disk repeatedly.
// The structure will be: { en: { common: {...}, auth: {...} }, es: { ... } }
const loadedTranslations = {};

// --- Dynamic Language & Namespace Discovery ---
const availableLocales = fs
  .readdirSync(localesDir, { withFileTypes: true })
  .filter((dirent) => dirent.isDirectory())
  .map((dirent) => dirent.name);

// --- Core Functions ---

/**
 * Loads all JSON namespace files for a given locale and caches them.
 * This function is async and uses dynamic imports for efficiency.
 * @param {string} locale - The locale to load (e.g., 'en').
 * @returns {Promise<object>} A promise that resolves to the translations for the locale.
 */
const loadLocaleData = async (locale) => {
  if (loadedTranslations[locale]) { // Return from cache if available
    return loadedTranslations[locale];
  }

  const localePath = path.join(localesDir, locale);
  const namespaceFiles = fs.readdirSync(localePath).filter((file) => file.endsWith(".json"));

  const translations = {};
  for (const file of namespaceFiles) {
    const namespace = path.basename(file, ".json");
    const translationModule = await import(`../locales/${locale}/${file}`, {
      with: { type: "json" },
    });
    translations[namespace] = translationModule.default;
  }

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
    const [namespace, i18nKey] = key.includes(":") ? key.split(":") : [defaultNamespace, key];

    let translation =
      i18nKey.split(".").reduce((obj, keyPart) => obj && obj[keyPart], translations[namespace]) || key;

    if (context && typeof translation === 'string') {
      Object.keys(context).forEach((placeholder) => {
        const regex = new RegExp(`{{${placeholder}}}`, 'g');
        translation = translation.replace(regex, context[placeholder]);
      });
    }

    return translation;
  };
};