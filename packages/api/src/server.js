import app from "./app.js";
import { bootstrapApplication } from "@auth/app-bootstrap";

// Start the application by bootstrapping all services and starting the server.
await bootstrapApplication(app);
