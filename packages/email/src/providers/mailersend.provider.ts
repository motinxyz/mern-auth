import { MailerSend, EmailParams, Sender, Recipient } from "mailersend";
import crypto from "crypto";
import type { ILogger } from "@auth/contracts";
import type {
  IEmailProvider,
  MailOptions,
  EmailResult,
  ProviderHealth,
  WebhookHeaders,
  ParsedWebhookEvent,
  MailerSendProviderOptions,
} from "../types.js";

/**
 * MailerSend Email Provider
 * Production-grade implementation of IEmailProvider using MailerSend API.
 */
class MailerSendProvider implements IEmailProvider {
  readonly name: string = "mailersend-api";
  private readonly client: MailerSend | null;
  private readonly webhookSecret: string | undefined;
  private readonly fromEmail: string | undefined;
  private readonly logger: ILogger;

  constructor({ apiKey, webhookSecret, fromEmail, logger }: MailerSendProviderOptions) {
    this.client = apiKey ? new MailerSend({ apiKey }) : null;
    this.webhookSecret = webhookSecret;
    this.fromEmail = fromEmail;
    this.logger = logger.child({ provider: this.name });
  }

  async send(mailOptions: MailOptions): Promise<EmailResult> {
    const { from, to, subject, html, text } = mailOptions;

    if (!this.client) {
      throw new Error("MailerSend API key not configured");
    }

    // Use configured "from" address for MailerSend if provided (domain alignment)
    const rawFrom = this.fromEmail ?? from;

    let fromEmail = rawFrom;
    let fromName = "Auth System";

    if (rawFrom.includes("<")) {
      const match = rawFrom.match(/(.*)< *(.*)>/);
      if (match?.[1] && match[2]) {
        fromName = match[1].trim().replace(/^"|"$/g, "");
        fromEmail = match[2].trim();
      }
    }

    const sender = new Sender(fromEmail, fromName);
    const recipients = [new Recipient(to, to)];

    const emailParams = new EmailParams()
      .setFrom(sender)
      .setTo(recipients)
      .setSubject(subject)
      .setHtml(html)
      .setText(text);

    try {
      const response = await this.client.email.send(emailParams);

      return {
        messageId: response.headers?.["x-message-id"] as string | undefined,
        provider: this.name,
        accepted: [to],
        response: response.statusCode ?? 200,
      };
    } catch (error) {
      const err = error as Error & { body?: unknown };
      this.logger.error({ err, body: err.body }, "MailerSend send failed");
      throw error;
    }
  }

  verifyWebhookSignature(
    payload: string,
    headers: WebhookHeaders,
    secret: string | null = null
  ): boolean {
    const currentSecret = secret ?? this.webhookSecret;
    if (!currentSecret) return true; // Dev mode

    const signature = headers["mailersend-signature"];
    if (!signature) return false;

    try {
      const hmac = crypto.createHmac("sha256", currentSecret);
      const expectedSignature = hmac.update(payload).digest("hex");

      return crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(expectedSignature)
      );
    } catch {
      return false;
    }
  }

  parseWebhookEvent(event: unknown): ParsedWebhookEvent | null {
    const e = event as {
      type: string;
      created_at: string;
      data: {
        recipient?: { email?: string };
        email?: { id?: string };
        reason?: string;
      };
    };

    const email = e.data?.recipient?.email;
    const messageId = e.data?.email?.id;

    if (!email || !messageId) return null;

    const base = {
      timestamp: new Date(e.created_at),
      email,
      messageId,
      originalEvent: event,
    };

    if (e.type === "activity.soft_bounced") {
      return {
        ...base,
        type: "bounce",
        bounceType: "soft",
        reason: e.data.reason ?? "Soft bounce",
      };
    }

    if (e.type === "activity.hard_bounced") {
      return {
        ...base,
        type: "bounce",
        bounceType: "hard",
        reason: e.data.reason ?? "Hard bounce",
      };
    }

    if (e.type === "activity.spam_complaint") {
      return {
        ...base,
        type: "complaint",
        reason: "Spam complaint",
      };
    }

    return null;
  }

  async checkHealth(): Promise<ProviderHealth> {
    return { healthy: this.client !== null, name: this.name };
  }
}

export default MailerSendProvider;
