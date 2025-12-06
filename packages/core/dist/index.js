// Export use-case specific controllers (production-grade)
export { RegistrationController } from "./features/auth/registration/registration.controller.js";
export { VerificationController } from "./features/auth/verification/verification.controller.js";
// Export use-case specific services (production-grade)
export { RegistrationService } from "./features/auth/registration/registration.service.js";
export { VerificationService } from "./features/auth/verification/verification.service.js";
// Export controller instances from container
export { registrationController, verificationController } from "./container.js";
// Export DTOs
export { RegistrationDto } from "./features/auth/registration/registration.dto.js";
export { VerificationDto } from "./features/auth/verification/verification.dto.js";
// Export validators
export { registrationSchema } from "./features/auth/registration/registration.validator.js";
export { verificationSchema } from "./features/auth/verification/verification.validator.js";
// Export token service
export { TokenService } from "./features/token/token.service.js";
//# sourceMappingURL=index.js.map