import { Resend } from "resend";
import crypto from "crypto";
/**
 * Resend Email Provider
 * @implements {import('@auth/contracts').IEmailProvider}
 */
class ResendProvider {
    name;
    client;
    webhookSecret;
    logger;
    constructor({ apiKey, webhookSecret, logger }) {
        this.name = "resend-api";
        if (apiKey) {
            this.client = new Resend(apiKey);
        }
        this.webhookSecret = webhookSecret;
        this.logger = logger.child({ provider: this.name });
    }
    async send(mailOptions) {
        const { from, to, subject, html, text } = mailOptions;
        // Resend expects 'from' to be "Name <email@domain.com>" or just "email@domain.com"
        // Our config usually provides a clear default.
        // Convert to Resend format if needed (handled by SDK mostly)
        try {
            if (!this.client) {
                throw new Error("Resend API key not configured");
            }
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
                accepted: [to], // Resend batches, but usually we send single here
                response: "200 OK",
            };
        }
        catch (error) {
            this.logger.error({ err: error }, "Resend send failed");
            throw error;
        }
    }
    verifyWebhookSignature(payload, headers, secret = null) {
        const currentSecret = secret || this.webhookSecret;
        if (!currentSecret)
            return true; // Dev mode
        const signature = headers["svix-signature"] || headers["resend-signature"];
        const timestamp = headers["svix-timestamp"];
        if (!signature || !timestamp)
            return false;
        try {
            // Parse Svix signature format: "v1,base64signature"
            const signatures = signature.split(" ").map((sig) => {
                const [version, s] = sig.split(",");
                return { version, signature: s };
            });
            const v1Sig = signatures.find((s) => s.version === "v1");
            if (!v1Sig)
                return false;
            const signedContent = `${timestamp}.${payload}`;
            const hmac = crypto.createHmac("sha256", currentSecret);
            const expectedSignature = hmac.update(signedContent).digest("base64");
            return crypto.timingSafeEqual(Buffer.from(v1Sig.signature), Buffer.from(expectedSignature));
        }
        catch (err) {
            return false;
        }
    }
    parseWebhookEvent(event) {
        const base = {
            timestamp: new Date(event.created_at),
            email: event.data.to,
            messageId: event.data.email_id,
            originalEvent: event,
        };
        if (event.type === "email.bounced") {
            return {
                ...base,
                type: "bounce",
                bounceType: "hard",
                reason: event.data.bounce?.message || "Unknown",
            };
        }
        if (event.type === "email.complained") {
            return {
                ...base,
                type: "complaint",
                reason: "Create spam report",
            };
        }
        if (event.type === "email.delivered") {
            return {
                ...base,
                type: "delivery",
            };
        }
        return null;
    }
    async checkHealth() {
        // Resend doesn't have a dedicated ping API, assume healthy if client exists
        return { healthy: !!this.client, name: this.name };
    }
}
export default ResendProvider;
//# sourceMappingURL=resend.provider.js.map