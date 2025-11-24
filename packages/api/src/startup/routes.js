import { v1Routes } from "../routes/v1/index.js";
import webhookRoutes from "../routes/webhooks.routes.js";
import testEmailRoutes from "../routes/test-email.routes.js";

const apiPrefixV1 = "/api/v1";

export const configureRoutes = (app) => {
  app.use(apiPrefixV1, v1Routes);
  app.use("/webhooks", webhookRoutes);
  app.use("/test-email", testEmailRoutes);
};
