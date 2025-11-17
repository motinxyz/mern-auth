import { Router } from "express";
import { authRouter } from "@auth/core";
import healthRouter from "./health.router.js";

export const v1Routes = (container) => {
  const router = Router();

  // v1 routes
  router.use("/auth", authRouter(container));
  router.use("/health", healthRouter(container)); // Pass the container to healthRouter

  return router;
};
