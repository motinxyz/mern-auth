import { MailerSend } from "mailersend";
import type { ILogger } from "@auth/contracts";
/**
 * MailerSend Email Provider
 * @implements {import('@auth/contracts').IEmailProvider}
 */
declare class MailerSendProvider {
    name: string;
    client: MailerSend | undefined;
    webhookSecret: string;
    fromEmail: string;
    logger: ILogger;
    constructor({ apiKey, webhookSecret, fromEmail, logger }: any);
    send(mailOptions: any): Promise<{
        messageId: any;
        provider: string;
        accepted: any[];
        response: number;
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
    };
    checkHealth(): Promise<{
        healthy: boolean;
        name: string;
    }>;
}
export default MailerSendProvider;
//# sourceMappingURL=mailersend.provider.d.ts.map