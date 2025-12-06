import * as Sentry from "@sentry/node";
import { User } from "@auth/database";
import { redisConnection, config, getLogger } from "@auth/config";
import { getQueueServices } from "@auth/queues";
const logger = getLogger();
// Import services
import { RegistrationService } from "./features/auth/registration/registration.service.js";
import { VerificationService } from "./features/auth/verification/verification.service.js";
import { TokenService } from "./features/token/token.service.js";
// Import controllers
import { RegistrationController } from "./features/auth/registration/registration.controller.js";
import { VerificationController } from "./features/auth/verification/verification.controller.js";
/**
 * Manual Dependency Injection
 *
 * Simpler and more explicit than Awilix container.
 * Avoids proxy-related issues with method resolution.
 */
// Instantiate services with explicit dependencies
const tokenService = new TokenService({
    redis: redisConnection,
    config,
    logger,
});
const registrationService = new RegistrationService({
    userModel: User,
    redis: redisConnection,
    config,
    emailProducer: getQueueServices().emailProducerService,
    tokenService,
    sentry: Sentry,
    logger,
});
const verificationService = new VerificationService({
    userModel: User,
    redis: redisConnection,
    config,
    logger,
});
// Instantiate controllers with services
const registrationController = new RegistrationController(registrationService);
const verificationController = new VerificationController(verificationService);
// Export instances
export { registrationController, verificationController, registrationService, verificationService, };
//# sourceMappingURL=container.js.map