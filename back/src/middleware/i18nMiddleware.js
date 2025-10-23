import { getTranslator } from "../config/i18n.js";

export const i18nMiddleware = async (req, res, next) => {
  // Determine the most preferred locale from the header, default to 'en'
  const preferredLocale = req.headers["accept-language"]?.split(",")[0] || "en";

  // Extract the primary language subtag (e.g., 'en' from 'en-US', or 'es' from 'es-ES')
  const primaryLocale = preferredLocale.split("-")[0];

  req.locale = primaryLocale;
  req.t = await getTranslator(primaryLocale);

  next();
};
