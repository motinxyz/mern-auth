import { Router } from "express";
import registrationRoutes from "./registration.routes.js";
import verificationRoutes from "./verification.routes.js";
const router = Router();
router.use("/", registrationRoutes);
router.use("/", verificationRoutes);
export default router;
//# sourceMappingURL=auth.routes.js.map