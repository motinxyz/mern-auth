import { MailerSend, EmailParams, Sender, Recipient } from "mailersend";
import crypto from "crypto";
import type { ILogger } from "@auth/contracts";

/**
 * MailerSend Email Provider
 * @implements {import('@auth/contracts').IEmailProvider}
 */
class MailerSendProvider {
  name: string;
  client: MailerSend | undefined;
  webhookSecret: string;
  fromEmail: string;
  logger: ILogger;

  constructor({ apiKey, webhookSecret, fromEmail, logger }: any) {
    this.name = "mailersend-api";
    if (apiKey) {
      this.client = new MailerSend({ apiKey });
    }
    this.webhookSecret = webhookSecret;
    this.fromEmail = fromEmail;
    this.logger = logger.child({ provider: this.name });
  }

  async send(mailOptions) {
    const { from, to, subject, html, text } = mailOptions;

    // Use configured "from" address for MailerSend if provided (domain alignment)
    // Use configured "from" address for MailerSend if provided (domain alignment)
    const rawFrom = this.fromEmail || from;

    let fromEmail = rawFrom;
    let fromName = "Auth System";

    if (rawFrom.includes("<")) {
      const match = rawFrom.match(/(.*)<(.*)>/);
      if (match) {
        fromName = match[1].trim();
        fromEmail = match[2].trim();

        // Remove surrounding quotes if present in name
        fromName = fromName.replace(/^"|"$/g, "");
      }
    }

    const sender = new Sender(fromEmail, fromName);

    // Support multiple recipients? Currently array or string. Assume single string for now or array.
    const recipients = [new Recipient(to, to)]; // MailerSend requires Recipient objects

    const emailParams = new EmailParams()
      .setFrom(sender)
      .setTo(recipients)
      .setSubject(subject)
      .setHtml(html)
      .setText(text);

    try {
      if (!this.client) {
        throw new Error("MailerSend API key not configured");
      }

      const response = await this.client.email.send(emailParams);
      // Response { statusCode, body }

      return {
        messageId: response.headers?.["x-message-id"], // MailerSend returns ID in header often
        provider: this.name,
        accepted: [to],
        response: response.statusCode,
      };
    } catch (error) {
      this.logger.error(
        { err: error, body: error.body },
        "MailerSend send failed"
      );
      throw error;
    }
  }

  verifyWebhookSignature(payload, headers, secret = null) {
    const currentSecret = secret || this.webhookSecret;
    if (!currentSecret) return true;

    const signature = headers["mailersend-signature"];
    if (!signature) return false;

    try {
      const hmac = crypto.createHmac("sha256", currentSecret);
      const expectedSignature = hmac.update(payload).digest("hex");

      return crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(expectedSignature)
      );
    } catch (err) {
      return false;
    }
  }

  parseWebhookEvent(event) {
    const base = {
      timestamp: new Date(event.created_at),
      email: event.data?.recipient?.email,
      messageId: event.data?.email?.id,
      originalEvent: event,
    };

    // Guard against missing data
    if (!base.email || !base.messageId) return null;

    if (event.type === "activity.soft_bounced") {
      return {
        ...base,
        type: "bounce",
        bounceType: "soft",
        reason: event.data.reason || "Soft bounce",
      };
    }

    if (event.type === "activity.hard_bounced") {
      return {
        ...base,
        type: "bounce",
        bounceType: "hard",
        reason: event.data.reason || "Hard bounce",
      };
    }

    if (event.type === "activity.spam_complaint") {
      return {
        ...base,
        type: "complaint",
        reason: "Spam complaint",
      };
    }

    return null; // Ignore other events for now
  }

  async checkHealth() {
    return { healthy: !!this.client, name: this.name };
  }
}

export default MailerSendProvider;
