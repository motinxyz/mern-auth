import apiClient from "../../../shared/services/api/client";
import { API_ENDPOINTS } from "../../../shared/services/api/endpoints";

export const authService = {
  /**
   * Register a new user
   * @param {Object} userData - User registration data
   * @param {string} userData.name - User's full name
   * @param {string} userData.email - User's email address
   * @param {string} userData.password - User's password
   * @returns {Promise<Object>} Registered user data
   */
  async register(userData) {
    const response = await apiClient.post(API_ENDPOINTS.REGISTER, userData);
    return response.data;
  },

  /**
   * Login user
   * @param {Object} credentials - Login credentials
   * @param {string} credentials.email - User's email
   * @param {string} credentials.password - User's password
   * @returns {Promise<Object>} User data and tokens
   */
  async login(credentials) {
    const response = await apiClient.post(API_ENDPOINTS.LOGIN, credentials);

    // Store tokens
    if (response.data.accessToken) {
      localStorage.setItem("accessToken", response.data.accessToken);
    }
    if (response.data.refreshToken) {
      localStorage.setItem("refreshToken", response.data.refreshToken);
    }

    return response.data;
  },

  /**
   * Logout user
   * @returns {Promise<void>}
   */
  async logout() {
    try {
      await apiClient.post(API_ENDPOINTS.LOGOUT);
    } finally {
      // Clear tokens regardless of API response
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
    }
  },

  /**
   * Verify email with token
   * @param {string} token - Verification token from email
   * @returns {Promise<Object>} Verification result
   */
  async verifyEmail(token) {
    const response = await apiClient.post(API_ENDPOINTS.VERIFY_EMAIL, {
      token,
    });
    return response.data;
  },

  /**
   * Resend verification email
   * @param {string} email - User's email address
   * @returns {Promise<Object>} Resend result
   */
  async resendVerification(email) {
    const response = await apiClient.post(API_ENDPOINTS.RESEND_VERIFICATION, {
      email,
    });
    return response.data;
  },

  /**
   * Request password reset
   * @param {string} email - User's email address
   * @returns {Promise<Object>} Reset request result
   */
  async forgotPassword(email) {
    const response = await apiClient.post(API_ENDPOINTS.FORGOT_PASSWORD, {
      email,
    });
    return response.data;
  },

  /**
   * Reset password with token
   * @param {Object} data - Reset data
   * @param {string} data.token - Reset token from email
   * @param {string} data.password - New password
   * @returns {Promise<Object>} Reset result
   */
  async resetPassword(data) {
    const response = await apiClient.post(API_ENDPOINTS.RESET_PASSWORD, data);
    return response.data;
  },

  /**
   * Get current user profile
   * @returns {Promise<Object>} User profile data
   */
  async getProfile() {
    const response = await apiClient.get(API_ENDPOINTS.ME);
    return response.data;
  },

  /**
   * Check if user is authenticated
   * @returns {boolean} True if user has access token
   */
  isAuthenticated() {
    return !!localStorage.getItem("accessToken");
  },

  /**
   * Get access token
   * @returns {string|null} Access token or null
   */
  getAccessToken() {
    return localStorage.getItem("accessToken");
  },
};
