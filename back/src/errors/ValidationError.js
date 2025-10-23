import ApiError from './ApiError.js';
import { HTTP_STATUS_CODES } from '../constants/httpStatusCodes.js';

class ValidationError extends ApiError {
  constructor(errors = []) {
    super(HTTP_STATUS_CODES.UNPROCESSABLE_CONTENT, 'errors.validation', errors);
  }
}

export default ValidationError;
