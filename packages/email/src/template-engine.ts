import Handlebars from "handlebars";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { EMAIL_MESSAGES, EMAIL_ERRORS } from "./constants/email.messages.js";
import type { TemplateInitOptions } from "./types.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cache for compiled templates
const templateCache = new Map<string, { template: HandlebarsTemplateDelegate; layout: HandlebarsTemplateDelegate }>();

// Module-level resolved templates directory
let resolvedTemplatesDir: string | null = null;

/**
 * Possible template directories (production and development paths)
 */
const TEMPLATE_DIRS = [
  path.join(__dirname, "templates/handlebars"),
  path.join(__dirname, "../src/templates/handlebars"),
  path.join(process.cwd(), "packages/email/src/templates/handlebars"),
] as const;

/**
 * Resolve the templates directory
 */
async function resolveTemplatesDir(): Promise<string> {
  if (resolvedTemplatesDir) return resolvedTemplatesDir;

  for (const dir of TEMPLATE_DIRS) {
    try {
      await fs.access(dir);
      resolvedTemplatesDir = dir;
      return dir;
    } catch {
      continue;
    }
  }

  throw new Error(`Could not locate templates directory. Checked: ${TEMPLATE_DIRS.join(", ")}`);
}

/**
 * Initialize template engine
 * Preloads all partials and registers helpers
 */
export async function initializeTemplates(options: TemplateInitOptions = {}): Promise<void> {
  const { logger } = options;

  try {
    const templatesDir = await resolveTemplatesDir();

    // Register partials
    const partialsDir = path.join(templatesDir, "partials");
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

/**
 * Register Handlebars helpers
 */
function registerHelpers(): void {
  Handlebars.registerHelper("formatDate", (date: string | Date) => {
    return new Date(date).toLocaleDateString();
  });

  Handlebars.registerHelper("year", () => {
    return new Date().getFullYear();
  });
}

/**
 * Template data for rendering
 */
interface TemplateData {
  readonly subject?: string;
  readonly name?: string;
  readonly verificationUrl?: string;
  readonly expiryMinutes?: number;
  readonly [key: string]: unknown;
}

/**
 * Compile and render an email template
 */
export async function compileTemplate(
  templateName: string,
  data: TemplateData
): Promise<string> {
  const cacheKey = templateName;

  // Check cache first
  const cached = templateCache.get(cacheKey);
  if (cached) {
    const body = cached.template(data);
    return cached.layout({ ...data, body, year: new Date().getFullYear() });
  }

  // Resolve templates directory
  const templatesDir = await resolveTemplatesDir();

  const templatePath = path.join(templatesDir, `emails/${templateName}.hbs`);
  const layoutPath = path.join(templatesDir, "layouts/base.hbs");

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
    const err = error as Error;
    throw new Error(
      EMAIL_ERRORS.TEMPLATE_COMPILE_FAILED.replace(
        "{template}",
        templateName
      ).replace("{error}", err.message)
    );
  }
}

/**
 * Clear template cache (useful for development)
 */
export function clearTemplateCache(): void {
  templateCache.clear();
  resolvedTemplatesDir = null;
}
