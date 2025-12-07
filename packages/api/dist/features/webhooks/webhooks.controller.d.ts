import { ResendProvider, MailerSendProvider } from "@auth/email";
import type { Request, Response } from "express";
import type { ILogger } from "@auth/contracts";
export declare class WebhooksController {
    webhookLogger: ILogger;
    resend: ResendProvider;
    mailersend: MailerSendProvider;
    constructor();
    /**
     * Handle generic webhook flow
     */
    handleWebhook(req: Request, res: Response, provider: ResendProvider | MailerSendProvider): Promise<Response<any, Record<string, any>>>;
    /**
     * Handle Resend webhook events
     * POST /webhooks/resend
     */
    handleResendWebhook: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
    /**
     * Handle MailerSend webhook events
     * POST /webhooks/mailersend
     */
    handleMailerSendWebhook: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
    /**
     * Health check for webhooks
     * GET /webhooks/health
     */
    checkHealth: (_req: Request, res: Response) => void;
}
export declare const webhooksController: WebhooksController;
//# sourceMappingURL=webhooks.controller.d.ts.map