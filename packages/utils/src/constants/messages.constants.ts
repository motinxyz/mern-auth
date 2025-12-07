/**
 * Message Constants
 *
 * Internal messages for logging and debugging.
 * Uses `as const` for type safety.
 */

export const API_MESSAGES = {
  SUCCESS: "API request successful",
  ERROR: "API request failed",
} as const;

export const I18N_MESSAGES = {
  NO_LANG_DIR: "No language directories found in locales.",
  DISCOVERY_FAILED: "Failed to discover i18n resources:",
} as const;

export type ApiMessage = (typeof API_MESSAGES)[keyof typeof API_MESSAGES];
export type I18nMessage = (typeof I18N_MESSAGES)[keyof typeof I18N_MESSAGES];
