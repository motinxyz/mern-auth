import i18n from "i18next";
import { initReactI18next } from "react-i18next";

// Import locale files from @auth/i18n
// We'll import them directly as JSON modules
import authEn from "@auth/i18n/locales/en/auth.json";
import validationEn from "@auth/i18n/locales/en/validation.json";
import systemEn from "@auth/i18n/locales/en/system.json";

const resources = {
  en: {
    auth: authEn,
    validation: validationEn,
    system: systemEn,
  },
};

i18n
  .use(initReactI18next) // Passes i18n down to react-i18next
  .init({
    resources,
    lng: "en", // Default language
    fallbackLng: "en",

    // Namespace configuration
    defaultNS: "auth",
    ns: ["auth", "validation", "system"],

    interpolation: {
      escapeValue: false, // React already escapes values
    },

    // Key separator for nested translations
    keySeparator: ".",

    // Namespace separator
    nsSeparator: ":",

    // React-specific options
    react: {
      useSuspense: false, // Disable suspense for now
    },
  });

export default i18n;
