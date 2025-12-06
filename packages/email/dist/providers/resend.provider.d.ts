import { Resend } from "resend";
/**
 * Resend Email Provider
 * @implements {import('@auth/contracts').IEmailProvider}
 */
declare class ResendProvider {
    name: string;
    client: Resend | undefined;
    webhookSecret: string;
    logger: any;
    constructor({ apiKey, webhookSecret, logger }: any);
    send(mailOptions: any): Promise<{
        messageId: string;
        provider: string;
        accepted: any[];
        response: string;
    }>;
    verifyWebhookSignature(payload: any, headers: any, secret?: any): boolean;
    parseWebhookEvent(event: any): {
        type: string;
        bounceType: string;
        reason: any;
        timestamp: Date;
        email: any;
        messageId: any;
        originalEvent: any;
    } | {
        type: string;
        reason: string;
        timestamp: Date;
        email: any;
        messageId: any;
        originalEvent: any;
    } | {
        type: string;
        timestamp: Date;
        email: any;
        messageId: any;
        originalEvent: any;
    };
    checkHealth(): Promise<{
        healthy: boolean;
        name: string;
    }>;
}
export default ResendProvider;
//# sourceMappingURL=resend.provider.d.ts.map