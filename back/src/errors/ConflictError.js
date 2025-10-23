import ApiError from './ApiError.js';
import { HTTP_STATUS_CODES } from '../constants/httpStatusCodes.js';

class ConflictError extends ApiError {
  constructor(message = 'errors.conflict', errors = []) {
    super(HTTP_STATUS_CODES.CONFLICT, message, errors);
  }
}

export default ConflictError;
