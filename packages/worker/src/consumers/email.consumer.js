import { i18nInstance, t as systemT, logger } from "@auth/config";
import {
  UnknownJobTypeError,
  InvalidJobDataError,
  EmailDispatchError,
  EMAIL_JOB_TYPES,
} from "@auth/utils";
import { sendVerificationEmail } from "@auth/email";

export const emailJobConsumer = async (job) => {
  const { type, data } = job.data;
  const consumerLogger = logger.child({
    module: "email-consumer",
    jobId: job.id,
    jobType: type,
  });

  consumerLogger.info(systemT("worker:logs.jobStarted"));

  try {
    switch (type) {
      case EMAIL_JOB_TYPES.SEND_VERIFICATION_EMAIL: {
        if (!data.user || !data.token) {
          throw new InvalidJobDataError(
            systemT("worker:errors.jobDataMissingFields"),
            [
              !data.user && { field: "user", message: "is required" },
              !data.token && { field: "token", message: "is required" },
            ].filter(Boolean)
          );
        }

        const t = await i18nInstance.getFixedT(data.locale || "en");
        try {
          consumerLogger.debug(
            { email: data.user.email },
            systemT("worker:logs.sendingVerificationEmail")
          );
          await sendVerificationEmail(data.user, data.token, t);
          consumerLogger.info(
            { email: data.user.email },
            systemT("worker:logs.verificationEmailSent")
          );
        } catch (error) {
          throw new EmailDispatchError(
            systemT("email:errors.dispatchFailed"),
            error
          );
        }
        return {
          status: "OK",
          message: systemT("worker:logs.emailSentSuccess"),
        };
      }
      default:
        throw new UnknownJobTypeError(
          systemT("worker:errors.unknownJobType", { type }),
          type
        );
    }
  } catch (error) {
    consumerLogger.error({ err: error }, systemT("worker:errors.jobFailed"));
    throw error;
  }
};
