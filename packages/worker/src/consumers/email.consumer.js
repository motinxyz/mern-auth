
import { i18nInstance, t as systemT } from "@auth/config";
import {
  UnknownJobTypeError,
  InvalidJobDataError,
  EmailDispatchError,
  EMAIL_JOB_TYPES,
} from "@auth/utils";
import { sendVerificationEmail } from "@auth/email";

export const emailJobConsumer = async (job) => {
  const { type, data } = job.data;

  switch (type) {
    case EMAIL_JOB_TYPES.SEND_VERIFICATION_EMAIL: {
      if (!data.user || !data.token || !data.locale) {
        throw new InvalidJobDataError(
          systemT("worker:errors.jobDataMissingFields"),
          [
            !data.user && { field: "user", message: "is required" },
            !data.token && { field: "token", message: "is required" },
            !data.locale && { field: "locale", message: "is required" },
          ].filter(Boolean)
        );
      }

      const t = await i18nInstance.getFixedT(data.locale || "en");
      try {
        await sendVerificationEmail(data.user, data.token, t);
      } catch (error) {
        throw new EmailDispatchError(
          systemT("email:errors.dispatchFailed"),
          error
        );
      }
      return { status: "OK", message: systemT("worker:logs.emailSentSuccess") };
    }
    default:
      throw new UnknownJobTypeError(
        systemT("worker:errors.unknownJobType", { type }),
        type
      );
  }
};
