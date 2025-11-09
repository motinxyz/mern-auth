import { Router } from "express";
import { authRouter } from "@auth/core";
import healthRouter from "./health.router.js";

const router = Router();

// v1 routes
router.use("/auth", authRouter);
router.use("/health", healthRouter);

export { router as v1Routes };
