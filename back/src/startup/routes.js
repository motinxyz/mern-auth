import authRouter from "../features/auth/auth.router.js";
import healthRouter from "../features/health/health.router.js";

export default function (app) {
  // Mount all feature routes
  
  app.use("/api/v1/health", healthRouter);
  app.use("/api/v1/auth", authRouter);
}
