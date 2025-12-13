/**
 * @auth/i18n - Internationalization
 *
 * Self-contained i18next configuration with file-based backend.
 * No dependency on @auth/config.
 */

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import i18next from "i18next";
import Backend from "i18next-fs-backend";
import * as i18nextMiddleware from "i18next-http-middleware";
import { createLogger } from "@auth/logger";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import { I18N_DEFAULTS, I18N_MESSAGES } from "./constants.js";

const DEFAULT_LOCALE = I18N_DEFAULTS.LOCALE;
const DEFAULT_NAMESPACE = I18N_DEFAULTS.NAMESPACE;

const log = createLogger({ serviceName: "i18n" });

/**
 * Initialize i18next with file-based backend
 */
export async function initI18n(): Promise<typeof i18next> {
    try {
        const localesDir = path.join(__dirname, "locales");

        // Ensure locales directory exists
        try {
            await fs.access(localesDir);
        } catch {
            await fs.mkdir(localesDir, { recursive: true });
        }

        // Dynamically discover namespaces from the default locale directory
        // This avoids manual registration of new translation files
        const defaultLocaleDir = path.join(localesDir, DEFAULT_LOCALE);
        let namespaces: string[] = [DEFAULT_NAMESPACE];

        try {
            const files = await fs.readdir(defaultLocaleDir);
            namespaces = files
                .filter((file) => file.endsWith(".json") && !file.includes(".missing.json"))
                .map((file) => path.basename(file, ".json"));
        } catch (error) {
            log.warn({ err: error }, I18N_MESSAGES.DISCOVERY_FAILURE);
        }

        await i18next
            .use(Backend)
            .use(i18nextMiddleware.LanguageDetector)
            .init({
                backend: {
                    loadPath: path.join(localesDir, "{{lng}}/{{ns}}.json"),
                    addPath: path.join(localesDir, "{{lng}}/{{ns}}.missing.json"),
                },
                fallbackLng: DEFAULT_LOCALE,
                preload: [DEFAULT_NAMESPACE], // Only preload default, load others on demand
                ns: namespaces,
                defaultNS: DEFAULT_NAMESPACE,
                detection: {
                    order: ["querystring", "cookie", "header"],
                    caches: ["cookie"],
                    lookupQuerystring: "lang",
                    lookupCookie: "lang",
                },
                debug: false,
                interpolation: {
                    escapeValue: false,
                },
                saveMissing: true,
            });

        log.info(I18N_MESSAGES.INIT_SUCCESS);
        return i18next;
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        log.error({ err: errorMessage }, I18N_MESSAGES.INIT_FAILURE);
        throw error;
    }
}

/**
 * i18next middleware for Express
 */
export const i18nMiddleware = i18nextMiddleware;

/**
 * i18next instance (for advanced usage)
 */
export const i18nInstance = i18next;

/**
 * Translation function with proper typing
 */
export function t(key: string, options?: Record<string, unknown>): string {
    if (options !== undefined) {
        return i18next.t(key, options) as string;
    }
    return i18next.t(key) as string;
}
