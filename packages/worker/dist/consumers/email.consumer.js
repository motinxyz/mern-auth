import { UnknownJobTypeError, InvalidJobDataError, EmailDispatchError, ConfigurationError, } from "@auth/utils";
import { EMAIL_JOB_TYPES } from "@auth/config";
import { WORKER_MESSAGES, WORKER_ERRORS, } from "../constants/worker.messages.js";
import BaseConsumer from "./base.consumer.js";
/**
 * Email Job Consumer
 * Processes email-related jobs from the queue.
 * Uses BaseConsumer for common tracing and logging functionality.
 */
class EmailConsumer extends BaseConsumer {
    emailService;
    constructor(options) {
        super({ logger: options.logger, name: "EmailConsumer" });
        if (options.emailService === undefined) {
            throw new ConfigurationError(WORKER_ERRORS.EMAIL_SERVICE_REQUIRED);
        }
        this.emailService = options.emailService;
    }
    /**
     * Process an email job
     */
    async process(job) {
        const { type, data } = job.data;
        // Dynamic span name based on job type
        const spanName = type !== undefined
            ? `email-consumer.${type.replace(/_/g, "-").toLowerCase()}`
            : "email-consumer.process-job";
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return this.withJobSpan(job, spanName, async () => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const jobLogger = this.createJobLogger(job, type);
            jobLogger.info(WORKER_MESSAGES.EMAIL_JOB_STARTED);
            try {
                switch (type) {
                    case EMAIL_JOB_TYPES.SEND_VERIFICATION_EMAIL:
                        return this.handleVerificationEmail(job, data, jobLogger);
                    default:
                        throw new UnknownJobTypeError(WORKER_ERRORS.UNKNOWN_JOB_TYPE.replace("{type}", type ?? "unknown"), type ?? "unknown");
                }
            }
            catch (error) {
                const err = error instanceof Error ? error : new Error(String(error));
                jobLogger.error({ err }, WORKER_ERRORS.JOB_FAILED);
                throw error;
            }
        });
    }
    /**
     * Handle verification email job
     */
    async handleVerificationEmail(_job, data, jobLogger) {
        if (data.user === undefined || data.token === undefined) {
            throw new InvalidJobDataError(WORKER_ERRORS.JOB_DATA_MISSING_FIELDS, [
                data.user === undefined && { field: "user", message: "is required" },
                data.token === undefined && { field: "token", message: "is required" },
            ].filter(Boolean));
        }
        // Add user context to span
        this.addAttributes({
            "user.id": data.user.id,
            "user.email_hash": this.hashSensitive(data.user.email),
            "email.type": "verification",
            "email.locale": data.locale ?? "en",
        });
        try {
            jobLogger.debug({ email: data.user.email }, WORKER_MESSAGES.EMAIL_SENDING_VERIFICATION);
            await this.emailService.sendEmail({
                to: data.user.email,
                template: "verification",
                data: {
                    user: data.user,
                    token: data.token,
                    locale: data.locale ?? "en",
                },
                preferredProvider: data.preferredProvider,
            });
            jobLogger.info({ email: data.user.email }, WORKER_MESSAGES.EMAIL_VERIFICATION_SENT);
        }
        catch (error) {
            throw new EmailDispatchError(WORKER_ERRORS.EMAIL_DISPATCH_FAILED, error instanceof Error ? error : new Error(String(error)));
        }
        return {
            success: true,
            message: WORKER_MESSAGES.EMAIL_SENT_SUCCESS,
        };
    }
}
/**
 * Create email job consumer (Factory Pattern)
 */
export const createEmailJobConsumer = (options) => {
    const consumer = new EmailConsumer(options);
    return (job) => consumer.process(job);
};
export { EmailConsumer };
//# sourceMappingURL=email.consumer.js.map