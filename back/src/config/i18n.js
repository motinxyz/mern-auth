import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

// A cache for loaded language files to avoid reading from disk repeatedly.
const loadedTranslations = {};
const defaultLocale = "en";

// --- Dynamic Discovery ---
// Discover available locales by reading the filenames in the locales directory.
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const localesDir = path.join(__dirname, "../locales");
const availableLocales = fs.readdirSync(localesDir).map((file) => file.replace(".json", ""));

// Helper to load a language file dynamically and cache it.
const loadTranslation = async (locale) => {
  if (loadedTranslations[locale]) {
    return loadedTranslations[locale];
  }

  // Use dynamic import() to load the JSON file only when needed.
  const translationModule = await import(`../locales/${locale}.json`, {
    with: { type: "json" },
  });
  loadedTranslations[locale] = translationModule.default;
  return loadedTranslations[locale];
};

// The factory function is now async to handle dynamic loading.
export const getTranslator = async (locale = defaultLocale) => {
  const lang = availableLocales.includes(locale) ? locale : defaultLocale;
  const translations = await loadTranslation(lang);

  return (key, context) => {
    let translation =
      key.split(".").reduce((obj, keyPart) => obj && obj[keyPart], translations) || key;

    if (context && typeof translation === 'string') {
      Object.keys(context).forEach((placeholder) => {
        const regex = new RegExp(`{{${placeholder}}}`, 'g');
        translation = translation.replace(regex, context[placeholder]);
      });
    }

    return translation;
  };
};