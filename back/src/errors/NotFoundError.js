import ApiError from '../core/api/ApiError.js';
import { HTTP_STATUS_CODES } from '../constants/httpStatusCodes.js';

class NotFoundError extends ApiError {
  constructor(message = 'errors.notFound') {
    super(HTTP_STATUS_CODES.NOT_FOUND, message);
  }
}

export default NotFoundError;
