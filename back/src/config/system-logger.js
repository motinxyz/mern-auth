import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import logger from "./logger.js";

// This module provides a synchronous, fallback translator for early-stage
// application logging, before the full async i18n system is ready.

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const defaultLocalePath = path.join(__dirname, "../locales/en/common.json");

let translations = {};

try {
  // Load the default 'en' translations synchronously for immediate use.
  const fileContent = fs.readFileSync(defaultLocalePath, "utf8");
  // Wrap the content in a 'common' namespace to match the structure of the async loader.
  translations = { common: JSON.parse(fileContent) };
} catch (error) {
  logger.error(error, "Failed to load default translations for system logger.");
}

export const t = (key, context) => {
  // Handle "namespace:key" format, defaulting to "common" namespace.
  const [namespace, i18nKey] = key.includes(":")
    ? key.split(":")
    : ["common", key];

  const translationScope = translations[namespace];
  let translation = key; // Default to the key itself if not found

  if (translationScope) {
    translation =
      i18nKey.split(".").reduce((obj, keyPart) => obj && obj[keyPart], translationScope) || key;
  }

  // Handle placeholder interpolation
  if (context && typeof translation === "string") {
    Object.keys(context).forEach((placeholder) => {
      const regex = new RegExp(`{{${placeholder}}}`, "g");
      translation = translation.replace(regex, context[placeholder]);
    });
  }

  return translation;
};

export default logger;
