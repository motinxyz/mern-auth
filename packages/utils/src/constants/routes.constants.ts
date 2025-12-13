/**
 * Route Constants
 *
 * Centralized route paths for the application.
 * Uses `as const` for type safety and inference.
 */

export const AUTH_ROUTES = {
  BASE: "/auth",
  REGISTER: "/register",
  LOGIN: "/login",
  LOGOUT: "/logout",
  VERIFY_EMAIL: "/verify-email",
  RESEND_VERIFICATION: "/resend-verification",
  FORGOT_PASSWORD: "/forgot-password",
  RESET_PASSWORD: "/reset-password",
  REFRESH_TOKEN: "/refresh-token",
} as const;

export type AuthRoute = (typeof AUTH_ROUTES)[keyof typeof AUTH_ROUTES];

export const USER_ROUTES = {
  BASE: "/users",
  ME: "/me",
  PROFILE: "/profile",
  CHANGE_PASSWORD: "/change-password",
} as const;

export type UserRoute = (typeof USER_ROUTES)[keyof typeof USER_ROUTES];

/**
 * Build a full route path
 */
export function buildRoute(base: string, path: string): string {
  return `${base}${path}`;
}
