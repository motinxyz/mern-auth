import app from "./app.js";
import { bootstrapApplication } from "@auth/app-bootstrap";
import container from "./container.js"; // Import the container

// Start the application by bootstrapping all services and starting the server.
await bootstrapApplication(app, container); // Pass the container to bootstrapApplication
