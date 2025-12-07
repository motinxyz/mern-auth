/**
 * Routes Constants Tests
 */

import { describe, it, expect } from "vitest";
import { buildRoute, AUTH_ROUTES, USER_ROUTES } from "./routes.constants.js";

describe("Routes Constants", () => {
    describe("buildRoute", () => {
        it("should concatenate base and path", () => {
            expect(buildRoute("/api", "/users")).toBe("/api/users");
        });

        it("should work with AUTH_ROUTES", () => {
            expect(buildRoute(AUTH_ROUTES.BASE, AUTH_ROUTES.LOGIN)).toBe("/auth/login");
        });

        it("should work with USER_ROUTES", () => {
            expect(buildRoute(USER_ROUTES.BASE, USER_ROUTES.ME)).toBe("/users/me");
        });

        it("should handle empty base", () => {
            expect(buildRoute("", "/path")).toBe("/path");
        });

        it("should handle empty path", () => {
            expect(buildRoute("/base", "")).toBe("/base");
        });
    });

    describe("AUTH_ROUTES", () => {
        it("should have all required routes", () => {
            expect(AUTH_ROUTES.BASE).toBe("/auth");
            expect(AUTH_ROUTES.REGISTER).toBe("/register");
            expect(AUTH_ROUTES.LOGIN).toBe("/login");
            expect(AUTH_ROUTES.LOGOUT).toBe("/logout");
            expect(AUTH_ROUTES.VERIFY_EMAIL).toBe("/verify-email");
            expect(AUTH_ROUTES.RESEND_VERIFICATION).toBe("/resend-verification");
            expect(AUTH_ROUTES.FORGOT_PASSWORD).toBe("/forgot-password");
            expect(AUTH_ROUTES.RESET_PASSWORD).toBe("/reset-password");
            expect(AUTH_ROUTES.REFRESH_TOKEN).toBe("/refresh-token");
        });
    });

    describe("USER_ROUTES", () => {
        it("should have all required routes", () => {
            expect(USER_ROUTES.BASE).toBe("/users");
            expect(USER_ROUTES.ME).toBe("/me");
            expect(USER_ROUTES.PROFILE).toBe("/profile");
            expect(USER_ROUTES.CHANGE_PASSWORD).toBe("/change-password");
        });
    });
});
