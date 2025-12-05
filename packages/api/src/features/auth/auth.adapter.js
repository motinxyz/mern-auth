import { RegistrationDto, VerificationDto } from "@auth/core";

/**
 * Adapter to convert between Express requests/responses and Core DTOs
 * This is the ONLY place where Express-specific code touches Core logic
 *
 * Uses Dependency Injection for testability and flexibility
 */
export class AuthAdapter {
  constructor({ logger, config } = {}) {
    this.logger = logger;
    this.config = config;
  }

  /**
   * Convert Express request to RegistrationDto
   * @param {import('express').Request} req
   * @returns {RegistrationDto}
   */
  toRegisterDto(req) {
    return new RegistrationDto({
      name: req.body.name,
      email: req.body.email,
      password: req.body.password,
    });
  }

  /**
   * Convert Express request to VerificationDto
   * @param {import('express').Request} req
   * @returns {VerificationDto}
   */
  toVerifyEmailDto(req) {
    return new VerificationDto({
      token: req.query.token,
    });
  }

  /**
   * Convert controller result to Express response
   * @param {ControllerResult} result - Controller result
   * @param {Response} res - Express response
   * @returns {Response}
   */
  toExpressResponse(result, res) {
    if (this.logger) {
      this.logger.debug("Sending response", { statusCode: result.statusCode });
    }
    return res.status(result.statusCode).json(result.data);
  }

  /**
   * Extract locale from Express request
   * @param {Request} req - Express request
   * @returns {string}
   */
  getLocale(req) {
    return req.locale || req.headers["accept-language"]?.split(",")[0] || "en";
  }
}
