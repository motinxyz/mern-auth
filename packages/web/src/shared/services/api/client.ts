import axios from "axios";
import { API_BASE_URL } from "./endpoints";
import { getSentryTraceHeaders } from "../../../config/sentry";

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true, // Send cookies with requests
});

// Request interceptor - Add auth token and trace headers to requests
apiClient.interceptors.request.use(
  (config) => {
    // Add auth token
    const token = localStorage.getItem("accessToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Add Sentry trace headers for distributed tracing
    const traceHeaders = getSentryTraceHeaders();
    Object.assign(config.headers, traceHeaders);

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle errors and token refresh
apiClient.interceptors.response.use(
  (response) => {
    // Return the data directly for successful responses
    return response.data;
  },
  async (error) => {
    const originalRequest = error.config;

    // If error is 401 and we haven't retried yet, try to refresh token
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Try to refresh the token
        const refreshToken = localStorage.getItem("refreshToken");
        if (refreshToken) {
          const response = await axios.post(
            `${API_BASE_URL}/auth/refresh-token`,
            { refreshToken },
            { withCredentials: true }
          );

          const { accessToken } = response.data.data;
          localStorage.setItem("accessToken", accessToken);

          // Retry the original request with new token
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return apiClient(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed, logout user
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        window.location.href = "/login";
        return Promise.reject(refreshError);
      }
    }

    // Extract error message from response
    const errorMessage =
      error.response?.data?.message ||
      error.response?.data?.errors?.[0]?.message ||
      error.message ||
      "An error occurred";

    return Promise.reject({
      message: errorMessage,
      status: error.response?.status,
      errors: error.response?.data?.errors || [],
    });
  }
);

export default apiClient;
