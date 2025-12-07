import * as i18nextMiddleware from "i18next-http-middleware";
/**
 * Configure i18next - Modern/Full-featured
 */
export declare const configureI18next: () => Promise<import("i18next").i18n>;
export declare const i18nMiddleware: typeof i18nextMiddleware;
export declare const i18nInstance: import("i18next").i18n;
export declare const initI18n: () => Promise<import("i18next").i18n>;
/**
 * Translation function with proper typing for i18next
 * Supports both simple key lookup and options with interpolation
 */
export declare const t: (key: string, options?: Record<string, unknown>) => string;
//# sourceMappingURL=i18n.d.ts.map