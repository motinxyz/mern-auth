/**
 * @auth/i18n
 *
 * Dedicated internationalization package for the auth monorepo.
 * Self-contained with file-based locale loading.
 *
 * @example
 * ```typescript
 * import { initI18n, t } from "@auth/i18n";
 *
 * await initI18n();
 * const message = t("auth:register.success");
 * ```
 */

// Core exports
export { initI18n, i18nMiddleware, i18nInstance, t } from "./i18n.js";
