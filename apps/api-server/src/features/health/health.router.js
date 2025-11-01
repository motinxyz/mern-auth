import { Router } from "express";

const router = Router();

router.get("/", (req, res, next) => {
  // Use the request-specific logger
  req.log.info("Health check endpoint was called.");

  const healthInfo = { timestamp: new Date().toISOString() };
  
  // Pass data to the response handler
  res.locals.data = {
    statusCode: 200,
    data: healthInfo,
    message: "system.healthCheck",
  };

  return next();
});

export default router;

