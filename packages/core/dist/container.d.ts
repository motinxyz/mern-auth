import { RegistrationService } from "./features/auth/registration/registration.service.js";
import { VerificationService } from "./features/auth/verification/verification.service.js";
import { RegistrationController } from "./features/auth/registration/registration.controller.js";
import { VerificationController } from "./features/auth/verification/verification.controller.js";
declare const registrationService: RegistrationService;
declare const verificationService: VerificationService;
declare const registrationController: RegistrationController;
declare const verificationController: VerificationController;
export { registrationController, verificationController, registrationService, verificationService, };
//# sourceMappingURL=container.d.ts.map