// Environment configuration
export const env = {
  API_URL: import.meta.env.VITE_API_URL || "http://localhost:3001/api/v1",
  APP_NAME: import.meta.env.VITE_APP_NAME || "MERN Auth",
  APP_URL: import.meta.env.VITE_APP_URL || "http://localhost:5173",
  isDevelopment: import.meta.env.DEV,
  isProduction: import.meta.env.PROD,
};
