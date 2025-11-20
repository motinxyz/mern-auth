import { AuthService } from "./auth.service.js";
import { AuthController } from "./auth.controller.js";
import { User } from "@auth/database";
import { redisConnection, config } from "@auth/config";
import * as emailProducer from "@auth/queues/producers";
import * as tokenService from "../token/token.service.js";

// Instantiate the service with dependencies
const authService = new AuthService({
  userModel: User,
  redis: redisConnection,
  config: config,
  emailProducer: emailProducer,
  tokenService: tokenService,
});

// Instantiate the controller with the service
export const authController = new AuthController(authService);
