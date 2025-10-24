import "dotenv/config";

const env = process.env.NODE_ENV || "development";

const common = {
  port: process.env.PORT || 3008,
  dbURI: process.env.MONGO_URI,
  isDevelopment: env === "development",
  logLevel: env === "development" ? "trace" : "info",
};

const development = {
  ...common,
};

const production = {
  ...common,
};

const test = {
  ...common,
  port: process.env.TEST_PORT || 0, // Use a random available port for tests
  logLevel: 'silent', // Silence logs during tests
};

const config = {
  development,
  production,
  test,
};

export const isDevelopment = () => {
  return env === 'development';
};

export default config[env];
