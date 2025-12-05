import EmailService from "./email.service.js";
import ProviderService from "./provider.service.js";
import { handleBounce, isEmailValid } from "./bounce-handler.js";

// Export services (production-grade with DI)
export { EmailService, ProviderService };

// Export utilities
export { handleBounce, isEmailValid };

// Default export
export default {
  EmailService,
  ProviderService,
  handleBounce,
  isEmailValid,
};
