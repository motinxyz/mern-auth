import { z } from "zod";
import { registerUserSchema, loginUserSchema } from "@auth/utils/validation";
import apiClient from "../../../shared/services/api/client";
import { API_ENDPOINTS } from "../../../shared/services/api/endpoints";
import { storage } from "../../../shared/services/storage.service";

// Inferred types from shared schemas
export type RegisterData = z.infer<typeof registerUserSchema>;
export type LoginData = z.infer<typeof loginUserSchema>;

export interface AuthResponse {
  accessToken?: string;
  refreshToken?: string;
  user?: unknown;
  [key: string]: unknown;
}

export const authService = {
  /**
   * Register a new user
   */
  async register(userData: RegisterData): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>(API_ENDPOINTS.AUTH.REGISTER, userData);
    return response.data;
  },

  /**
   * Login user
   */
  async login(credentials: LoginData): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>(API_ENDPOINTS.AUTH.LOGIN, credentials);

    // Store tokens
    if (response.data.accessToken) {
      storage.setItem("accessToken", response.data.accessToken);
    }
    if (response.data.refreshToken) {
      storage.setItem("refreshToken", response.data.refreshToken);
    }

    return response.data;
  },

  /**
   * Logout user
   */
  async logout(): Promise<void> {
    try {
      await apiClient.post(API_ENDPOINTS.AUTH.LOGOUT);
    } finally {
      // Clear tokens regardless of API response
      storage.removeItem("accessToken");
      storage.removeItem("refreshToken");
    }
  },

  /**
   * Verify email with token
   */
  async verifyEmail(token: string): Promise<unknown> {
    const response = await apiClient.post(API_ENDPOINTS.AUTH.VERIFY_EMAIL, {
      token,
    });
    return response.data;
  },

  /**
   * Resend verification email
   */
  async resendVerification(email: string): Promise<unknown> {
    const response = await apiClient.post(API_ENDPOINTS.AUTH.RESEND_VERIFICATION, {
      email,
    });
    return response.data;
  },

  /**
   * Request password reset
   */
  async forgotPassword(email: string): Promise<unknown> {
    const response = await apiClient.post(API_ENDPOINTS.AUTH.FORGOT_PASSWORD, {
      email,
    });
    return response.data;
  },

  /**
   * Reset password with token
   */
  async resetPassword(data: { token: string; password: string }): Promise<unknown> {
    const response = await apiClient.post(API_ENDPOINTS.AUTH.RESET_PASSWORD, data);
    return response.data;
  },

  /**
   * Get current user profile
   */
  async getProfile(): Promise<unknown> {
    const response = await apiClient.get(API_ENDPOINTS.AUTH.ME);
    return response.data;
  },

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return !!storage.getItem("accessToken");
  },

  /**
   * Get access token
   */
  getAccessToken(): string | null {
    return storage.getItem("accessToken");
  },
};
