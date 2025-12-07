/**
 * Message Constants
 *
 * Internal messages for logging and debugging.
 * Uses `as const` for type safety.
 */
export declare const API_MESSAGES: {
    readonly SUCCESS: "API request successful";
    readonly ERROR: "API request failed";
};
export declare const I18N_MESSAGES: {
    readonly NO_LANG_DIR: "No language directories found in locales.";
    readonly DISCOVERY_FAILED: "Failed to discover i18n resources:";
};
export type ApiMessage = (typeof API_MESSAGES)[keyof typeof API_MESSAGES];
export type I18nMessage = (typeof I18N_MESSAGES)[keyof typeof I18N_MESSAGES];
//# sourceMappingURL=messages.constants.d.ts.map