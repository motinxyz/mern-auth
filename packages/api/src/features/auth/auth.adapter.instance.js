import { getLogger, config } from "@auth/config";

const logger = getLogger();
import { registrationController, verificationController } from "@auth/core";
import { AuthAdapter } from "./auth.adapter.js";
import { AuthController } from "./auth.controller.js";

// Create singleton adapter instance with dependencies
export const authAdapter = new AuthAdapter({ logger, config });

// Create singleton controller instance with dependencies
export const authController = new AuthController({
  authAdapter,
  registrationController,
  verificationController,
});
