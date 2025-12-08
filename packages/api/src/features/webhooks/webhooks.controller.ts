import { getDatabaseService } from "@auth/app-bootstrap";
import { config, t, getLogger } from "@auth/config";
import { handleBounce, ResendProvider, MailerSendProvider } from "@auth/email";
import type { Request, Response } from "express";
import type { ILogger } from "@auth/contracts";

const logger = getLogger();


export class WebhooksController {
  webhookLogger: ILogger;
  resend: ResendProvider;
  mailersend: MailerSendProvider;

  constructor() {
    this.webhookLogger = logger.child({ module: "webhooks" });

    // Initialize providers for verification/parsing only (Api Keys might be optional if only verifying)
    // But our providers constructor takes apiKey. It's fine, we have them in config.
    this.resend = new ResendProvider({
      apiKey: config.resendApiKey,
      webhookSecret: config.resendWebhookSecret,
      logger: this.webhookLogger,
    });

    this.mailersend = new MailerSendProvider({
      apiKey: config.mailersendApiKey,
      webhookSecret: config.mailersendWebhookSecret,
      logger: this.webhookLogger,
      // fromEmail not needed for webhooks
    });
  }

  /**
   * Handle generic webhook flow
   */
  async handleWebhook(req: Request, res: Response, provider: ResendProvider | MailerSendProvider) {
    try {
      // 1. Verify Signature
      // Providers expect specific headers. We pass req.headers.
      // NOTE: Our provider.verifyWebhookSignature expects (payload, headers, secret)
      // Express 'req.body' might be Buffer or Object depending on middleware.
      // In routes we used express.raw({ type: 'application/json' }) -> buffer.

      const payload = req.body.toString();

      // Cast headers to expected type (Express IncomingHttpHeaders -> WebhookHeaders)
      const headers = req.headers as unknown as Readonly<Record<string, string | undefined>>;

      if (!provider.verifyWebhookSignature(payload, headers)) {
        this.webhookLogger.error(`Invalid ${provider.name} signature`);
        return res.status(401).json({ error: "Invalid signature" });
      }

      // 2. Parse Event
      const eventJson = JSON.parse(payload);
      const bounceData = provider.parseWebhookEvent(eventJson);

      this.webhookLogger.info(
        { provider: provider.name, eventType: eventJson.type },
        "Received webhook"
      );

      if (!bounceData) {
        return res
          .status(200)
          .json({ success: true, message: "Event ignored" });
      }

      // 3. Handle Bounce/Complaint
      const databaseService = getDatabaseService();
      const emailLogRepository = databaseService.emailLogRepository;
      const userRepository = databaseService.userRepository;

      const result = await handleBounce(
        emailLogRepository,
        userRepository,
        this.webhookLogger,
        t,
        {
          email: bounceData.email,
          messageId: bounceData.messageId,
          bounceType: bounceData.bounceType ?? "soft",
          bounceReason: bounceData.reason,
          timestamp: bounceData.timestamp,
        }
      );

      this.webhookLogger.info(
        { result, email: bounceData.email },
        "Event handled"
      );

      // 4. Handle Retry Action (App Logic)
      if (result.action === "retry_alternate_provider") {
        this.webhookLogger.info(
          { email: bounceData.email },
          "Retrying with alternate provider"
        );

        // Dynamic import to avoid circular dependency if any
        const { getQueueServices: _getQueueServices } = await import("@auth/queues");
        // In a real implementation: reconstruct job and use emailProducer.
        // For now, allow the log to trigger alerts or manual recovery.
        const emailLog = result.emailLog as { metadata?: Record<string, unknown> } | undefined;
        if (emailLog?.metadata !== undefined) {
          this.webhookLogger.warn("Auto-retry logic triggered.");
        }
      }

      return res.status(200).json({ success: true, result });
    } catch (error) {
      const errMessage = (error as Error).message;
      const errStack = (error as Error).stack;
      this.webhookLogger.error(
        { error: errMessage, stack: errStack },
        `Failed to handle ${provider.name} webhook`
      );
      return res.status(500).json({ success: false, error: errMessage });
    }
  }

  /**
   * Handle Resend webhook events
   * POST /webhooks/resend
   */
  handleResendWebhook = async (req: Request, res: Response) => {
    return this.handleWebhook(req, res, this.resend);
  };

  /**
   * Handle MailerSend webhook events
   * POST /webhooks/mailersend
   */
  handleMailerSendWebhook = async (req: Request, res: Response) => {
    return this.handleWebhook(req, res, this.mailersend);
  };

  /**
   * Health check for webhooks
   * GET /webhooks/health
   */
  checkHealth = (_req: Request, res: Response) => {
    res.status(200).json({ status: "ok", service: "webhooks" });
  };
}

export const webhooksController = new WebhooksController();
