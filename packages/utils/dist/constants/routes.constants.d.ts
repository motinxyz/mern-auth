/**
 * Route Constants
 *
 * Centralized route paths for the application.
 * Uses `as const` for type safety and inference.
 */
export declare const AUTH_ROUTES: {
    readonly BASE: "/auth";
    readonly REGISTER: "/register";
    readonly LOGIN: "/login";
    readonly LOGOUT: "/logout";
    readonly VERIFY_EMAIL: "/verify-email";
    readonly RESEND_VERIFICATION: "/resend-verification";
    readonly FORGOT_PASSWORD: "/forgot-password";
    readonly RESET_PASSWORD: "/reset-password";
    readonly REFRESH_TOKEN: "/refresh-token";
};
export type AuthRoute = (typeof AUTH_ROUTES)[keyof typeof AUTH_ROUTES];
export declare const USER_ROUTES: {
    readonly BASE: "/users";
    readonly ME: "/me";
    readonly PROFILE: "/profile";
    readonly CHANGE_PASSWORD: "/change-password";
};
export type UserRoute = (typeof USER_ROUTES)[keyof typeof USER_ROUTES];
/**
 * Build a full route path
 */
export declare function buildRoute(base: string, path: string): string;
//# sourceMappingURL=routes.constants.d.ts.map