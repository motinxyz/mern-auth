export declare class WebhooksController {
    webhookLogger: any;
    resend: any;
    mailersend: any;
    constructor();
    /**
     * Handle generic webhook flow
     */
    handleWebhook(req: any, res: any, provider: any): Promise<any>;
    /**
     * Handle Resend webhook events
     * POST /webhooks/resend
     */
    handleResendWebhook: (req: any, res: any) => Promise<any>;
    /**
     * Handle MailerSend webhook events
     * POST /webhooks/mailersend
     */
    handleMailerSendWebhook: (req: any, res: any) => Promise<any>;
    /**
     * Health check for webhooks
     * GET /webhooks/health
     */
    checkHealth: (req: any, res: any) => void;
}
export declare const webhooksController: WebhooksController;
//# sourceMappingURL=webhooks.controller.d.ts.map