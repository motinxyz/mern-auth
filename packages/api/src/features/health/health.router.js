import { Router } from "express";
import { HTTP_STATUS_CODES, ApiResponse } from "@auth/utils";
import { logger } from "@auth/config";

const healthLogger = logger.child({ module: "health" });
const router = Router();

router.get("/", (req, res) => {
  healthLogger.info("Health check endpoint was called");

  const healthInfo = {
    timestamp: new Date().toISOString(),
    status: "healthy"
  };
  
  return res
    .status(HTTP_STATUS_CODES.OK)
    .json(new ApiResponse(
      HTTP_STATUS_CODES.OK,
      healthInfo,
      req.t("system:server.healthCheck")
    ));
});

export default router;
