import { Resend } from "resend";
import crypto from "crypto";
import type { ILogger } from "@auth/contracts";
import type {
  IEmailProvider,
  MailOptions,
  EmailResult,
  ProviderHealth,
  WebhookHeaders,
  ParsedWebhookEvent,
  ResendProviderOptions,
} from "../types.js";

/**
 * Resend Email Provider
 * Production-grade implementation of IEmailProvider using Resend API.
 */
class ResendProvider implements IEmailProvider {
  readonly name: string = "resend-api";
  private readonly client: Resend | null;
  private readonly webhookSecret: string | undefined;
  private readonly logger: ILogger;

  constructor({ apiKey, webhookSecret, logger }: ResendProviderOptions) {
    this.client = apiKey ? new Resend(apiKey) : null;
    this.webhookSecret = webhookSecret;
    this.logger = logger.child({ provider: this.name });
  }

  async send(mailOptions: MailOptions): Promise<EmailResult> {
    const { from, to, subject, html, text } = mailOptions;

    if (!this.client) {
      throw new Error("Resend API key not configured");
    }

    try {
      const data = await this.client.emails.send({
        from,
        to,
        subject,
        html,
        text,
      });

      if (data.error) {
        throw new Error(data.error.message || "Resend API Error");
      }

      return {
        messageId: data.data?.id,
        provider: this.name,
        accepted: [to],
        response: "200 OK",
      };
    } catch (error) {
      this.logger.error({ err: error }, "Resend send failed");
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

    const signature = headers["svix-signature"] ?? headers["resend-signature"];
    const timestamp = headers["svix-timestamp"];

    if (!signature || !timestamp) return false;

    try {
      // Parse Svix signature format: "v1,base64signature"
      const signatures = signature.split(" ").map((sig) => {
        const [version, s] = sig.split(",");
        return { version, signature: s };
      });

      const v1Sig = signatures.find((s) => s.version === "v1");
      if (!v1Sig?.signature) return false;

      const signedContent = `${timestamp}.${payload}`;
      const hmac = crypto.createHmac("sha256", currentSecret);
      const expectedSignature = hmac.update(signedContent).digest("base64");

      return crypto.timingSafeEqual(
        Buffer.from(v1Sig.signature),
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
        to: string;
        email_id: string;
        bounce?: { message?: string };
      };
    };

    const base = {
      timestamp: new Date(e.created_at),
      email: e.data.to,
      messageId: e.data.email_id,
      originalEvent: event,
    };

    if (e.type === "email.bounced") {
      return {
        ...base,
        type: "bounce",
        bounceType: "hard",
        reason: e.data.bounce?.message ?? "Unknown",
      };
    }

    if (e.type === "email.complained") {
      return {
        ...base,
        type: "complaint",
        reason: "Spam complaint",
      };
    }

    if (e.type === "email.delivered") {
      return {
        ...base,
        type: "delivery",
      };
    }

    return null;
  }

  async checkHealth(): Promise<ProviderHealth> {
    return { healthy: this.client !== null, name: this.name };
  }
}

export default ResendProvider;
