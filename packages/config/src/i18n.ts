import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import i18next from "i18next";
import Backend from "i18next-fs-backend";
import * as i18nextMiddleware from "i18next-http-middleware";
import { createModuleLogger } from "./logging/startup-logger.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const defaultLocale = "en";
const defaultNamespace = "system"; // A default namespace for keys without one.

const log = createModuleLogger("i18n");



/**
 * Configure i18next - Modern/Full-featured
 */
export const configureI18next = async () => {
  try {
    const localesDir = path.join(__dirname, "../locales");

    // Check if locales directory exists
    try {
      await fs.access(localesDir);
    } catch {
      // Create if not exists to avoid startup error
      await fs.mkdir(localesDir, { recursive: true });
    }

    await i18next
      .use(Backend)
      .use(i18nextMiddleware.LanguageDetector)
      .init({
        backend: {
          loadPath: path.join(localesDir, "{{lng}}/{{ns}}.json"),
          addPath: path.join(localesDir, "{{lng}}/{{ns}}.missing.json"),
        },
        fallbackLng: defaultLocale,
        preload: ["en"], // Preload english
        ns: ["system", "auth", "validation", "errors"],
        defaultNS: defaultNamespace,
        detection: {
          order: ["querystring", "cookie", "header"],
          caches: ["cookie"],
          lookupQuerystring: "lang",
          lookupCookie: "lang",
        },
        debug: false, // Set to true for debugging translations
        interpolation: {
          escapeValue: false, // Not needed for React, but good for Node safety if rendering HTML
        },
        saveMissing: true, // Save missing keys to file for easier translation
      });

    log.info("i18next initialized");
    return i18next;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    log.error({ err: errorMessage }, "Failed to initialize i18next");
    throw error;
  }
};

export const i18nMiddleware = i18nextMiddleware;

// Export i18next instance and translation function
export const i18nInstance = i18next;
export const initI18n = configureI18next;

/**
 * Translation function with proper typing for i18next
 * Supports both simple key lookup and options with interpolation
 */
export const t = (key: string, options?: Record<string, unknown>): string => {
  if (options !== undefined) {
    return i18next.t(key, options) as string;
  }
  return i18next.t(key) as string;
};
