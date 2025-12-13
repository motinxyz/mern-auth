import type { EmailTemplate } from "../services/email-templates.js";

/**
 * Options for sending a templated email.
 */
export interface SendEmailOptions {
    /** Recipient email address */
    readonly to: string;
    /** Template name to use - must be a valid EmailTemplate */
    readonly template: EmailTemplate;
    /** Dynamic data to inject into the template */
    readonly data: Readonly<Record<string, unknown>>;
    /** Recipient's locale for i18n (e.g., 'en', 'es') */
    readonly locale?: string | undefined;
    /** Preferred email provider to use */
    readonly preferredProvider?: string | undefined;
}

/**
 * Options for sending verification emails.
 */
export interface VerificationEmailOptions {
    /** Preferred email provider to use */
    readonly preferredProvider?: string | undefined;
}
