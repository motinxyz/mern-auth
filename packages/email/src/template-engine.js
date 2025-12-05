import Handlebars from "handlebars";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { EMAIL_MESSAGES, EMAIL_ERRORS } from "./constants/email.messages.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cache for compiled templates
const templateCache = new Map();

/**
 * Initialize template engine
 * Preloads all partials and templates
 * @param {object} options - Options
 * @param {object} options.logger - Logger instance (required)
 */
export async function initializeTemplates(options = {}) {
  const { logger } = options;

  try {
    // Register partials
    const partialsDir = path.join(__dirname, "templates/handlebars/partials");
    const partialFiles = await fs.readdir(partialsDir);

    for (const file of partialFiles) {
      if (path.extname(file) === ".hbs") {
        const partialName = path.basename(file, ".hbs");
        const partialContent = await fs.readFile(
          path.join(partialsDir, file),
          "utf8"
        );
        Handlebars.registerPartial(partialName, partialContent);
      }
    }

    // Register helpers
    registerHelpers();

    if (logger) {
      logger.info(EMAIL_MESSAGES.TEMPLATES_INITIALIZED);
    }
  } catch (error) {
    if (logger) {
      logger.error({ err: error }, EMAIL_ERRORS.TEMPLATES_INIT_FAILED);
    }
    throw error;
  }
}

function registerHelpers() {
  Handlebars.registerHelper("formatDate", (date) => {
    return new Date(date).toLocaleDateString();
  });

  Handlebars.registerHelper("year", () => {
    return new Date().getFullYear();
  });
}

/**
 * Compile and render an email template
 * @param {string} templateName - Name of the template (without .hbs extension)
 * @param {object} data - Data to pass to the template
 * @returns {Promise<string>} - Compiled HTML
 */
export async function compileTemplate(templateName, data) {
  const cacheKey = templateName;

  // Check cache first
  if (templateCache.has(cacheKey)) {
    const { template, layout } = templateCache.get(cacheKey);
    const body = template(data);
    return layout({ ...data, body, year: new Date().getFullYear() });
  }

  // Load and compile templates
  const templatePath = path.join(
    __dirname,
    `templates/handlebars/emails/${templateName}.hbs`
  );
  const layoutPath = path.join(
    __dirname,
    "templates/handlebars/layouts/base.hbs"
  );

  try {
    const [templateSource, layoutSource] = await Promise.all([
      fs.readFile(templatePath, "utf8"),
      fs.readFile(layoutPath, "utf8"),
    ]);

    const template = Handlebars.compile(templateSource);
    const layout = Handlebars.compile(layoutSource);

    // Cache compiled templates
    templateCache.set(cacheKey, { template, layout });

    const body = template(data);
    return layout({ ...data, body, year: new Date().getFullYear() });
  } catch (error) {
    throw new Error(
      EMAIL_ERRORS.TEMPLATE_COMPILE_FAILED.replace(
        "{template}",
        templateName
      ).replace("{error}", error.message)
    );
  }
}

/**
 * Clear template cache (useful for development)
 */
export function clearTemplateCache() {
  templateCache.clear();
}
