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

      // Attempt to parse the message if it looks like a stringified JSON
      try {
        const parsedMessage = JSON.parse(err.message);
        if (parsedMessage.key) { // Assuming the parsed object has a 'key' for translation
          message = translate(parsedMessage.key, parsedMessage.params);
        } else {
          // If it's a parsed object but not in the expected format, use the original message
          message = translate(err.message, context); // Translate directly if it's a simple key
        }
      } catch (e) {
        // If parsing fails, it's not a stringified JSON, so use the original message
        message = translate(err.message, context); // Translate directly if it's a simple key
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
  }
}

export default ValidationError;
