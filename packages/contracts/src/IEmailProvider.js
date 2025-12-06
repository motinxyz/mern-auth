/**
 * Interface for Email Providers
 * @interface
 */
class IEmailProvider {
  /**
   * Provider name (e.g. 'resend', 'mailersend')
   * @type {string}
   */
  name;

  /**
   * Send an email
   * @param {object} mailOptions - { to, from, subject, html, text }
   * @returns {Promise<object>} - { id, provider, ... }
   */
  async send(mailOptions) {
    throw new Error("Method 'send' must be implemented");
  }

  /**
   * Verify webhook signature
   * @param {string} payload - Raw body
   * @param {object} headers - Request headers
   * @param {string} secret - Webhook secret
   * @returns {boolean}
   */
  verifyWebhookSignature(payload, headers, secret) {
    throw new Error("Method 'verifyWebhookSignature' must be implemented");
  }

  /**
   * Parse webhook event
   * @param {object} event - Parsed JSON body
   * @returns {object|null} - Standardized { type, email, messageId, ... } or null if ignored
   */
  parseWebhookEvent(event) {
    throw new Error("Method 'parseWebhookEvent' must be implemented");
  }

  /**
   * Check provider health
   * @returns {Promise<object>}
   */
  async checkHealth() {
    throw new Error("Method 'checkHealth' must be implemented");
  }
}

export default IEmailProvider;
