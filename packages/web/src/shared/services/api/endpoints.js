import { env } from "../../../config/env";

// API Configuration
const API_BASE_URL = env.API_URL;

export const API_ENDPOINTS = {
  // Auth endpoints
  REGISTER: "/auth/register",
  LOGIN: "/auth/login",
  LOGOUT: "/auth/logout",
  VERIFY_EMAIL: "/auth/verify-email",
  RESEND_VERIFICATION: "/auth/resend-verification",
  FORGOT_PASSWORD: "/auth/forgot-password",
  RESET_PASSWORD: "/auth/reset-password",
  REFRESH_TOKEN: "/auth/refresh-token",

  // User endpoints
  ME: "/users/me",
  UPDATE_PROFILE: "/users/profile",
  CHANGE_PASSWORD: "/users/change-password",
};

export { API_BASE_URL };
