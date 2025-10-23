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

const config = {
  development,
  production,
};

export const isDevelopment = () => {
  return env === 'development';
};

export default config[env];
