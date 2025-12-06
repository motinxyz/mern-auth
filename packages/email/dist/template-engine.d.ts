/**
 * Initialize template engine
 * Preloads all partials and templates
 * @param {object} options - Options
 * @param {object} options.logger - Logger instance (required)
 */
export declare function initializeTemplates(options?: any): Promise<void>;
/**
 * Compile and render an email template
 * @param {string} templateName - Name of the template (without .hbs extension)
 * @param {object} data - Data to pass to the template
 * @returns {Promise<string>} - Compiled HTML
 */
export declare function compileTemplate(templateName: any, data: any): Promise<any>;
/**
 * Clear template cache (useful for development)
 */
export declare function clearTemplateCache(): void;
//# sourceMappingURL=template-engine.d.ts.map