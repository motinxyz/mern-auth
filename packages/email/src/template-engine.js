import Handlebars from "handlebars";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cache for compiled templates
const templateCache = new Map();

// Register partials
const partialsDir = path.join(__dirname, "templates/handlebars/partials");
const partialFiles = fs.readdirSync(partialsDir);

partialFiles.forEach((file) => {
  const partialName = path.basename(file, ".hbs");
  const partialContent = fs.readFileSync(path.join(partialsDir, file), "utf8");
  Handlebars.registerPartial(partialName, partialContent);
});

// Register helpers
Handlebars.registerHelper("formatDate", (date) => {
  return new Date(date).toLocaleDateString();
});

Handlebars.registerHelper("year", () => {
  return new Date().getFullYear();
});

/**
 * Compile and render an email template
 * @param {string} templateName - Name of the template (without .hbs extension)
 * @param {object} data - Data to pass to the template
 * @returns {string} - Compiled HTML
 */
export function compileTemplate(templateName, data) {
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

  const templateSource = fs.readFileSync(templatePath, "utf8");
  const layoutSource = fs.readFileSync(layoutPath, "utf8");

  const template = Handlebars.compile(templateSource);
  const layout = Handlebars.compile(layoutSource);

  // Cache compiled templates
  templateCache.set(cacheKey, { template, layout });

  const body = template(data);
  return layout({ ...data, body, year: new Date().getFullYear() });
}

/**
 * Clear template cache (useful for development)
 */
export function clearTemplateCache() {
  templateCache.clear();
}
