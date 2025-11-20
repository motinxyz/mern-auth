import ApiError from "../ApiError.js";
import { HTTP_STATUS_CODES } from "../constants/httpStatusCodes.js";

class ValidationError extends ApiError {
  constructor(errors = [], t) {
    // Ensure t is a function, otherwise use a fallback
    const translate = typeof t === 'function' ? t : (key, params) => key + (params ? JSON.stringify(params) : '');

    // Process the errors array to translate messages
    const translatedErrors = errors.map((err) => {
      let message = err.message;
      let context = err.context;

      // If the message is a string and contains a colon, treat it as a translation key.
      // Otherwise, use the message directly.
      if (typeof message === 'string' && message.includes(':')) {
        message = translate(message, context);
      }

      return {
        field: err.field,
        message: message,
      };
    });

    super(
      HTTP_STATUS_CODES.UNPROCESSABLE_CONTENT,
      translate("validation:default"), // Translate the default message as well
      translatedErrors
    );
    this.name = "ValidationError"; // Explicitly set the name
  }
}

export default ValidationError;
