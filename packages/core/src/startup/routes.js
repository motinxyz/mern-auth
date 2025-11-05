import { authRouter } from "../index.js";

export default function setupRoutes(app) {
  // API routes
  app.use("/api/v1/auth", authRouter);
}