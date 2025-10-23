import swaggerJSDoc from "swagger-jsdoc";
import config from "./env.js";

const swaggerDefinition = {
  openapi: "3.0.0",
  info: {
    title: "Auth API",
    version: "1.0.0",
    description:
      "A simple Express-based authentication API with registration.",
    contact: {
      name: "Your Name",
      email: "your.email@example.com",
    },
  },
  servers: [
    {
      url: `http://localhost:${config.port}/api/v1`,
      description: "Development server",
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        description: "Enter JWT token",
      },
    },
  },
};

const options = {
  swaggerDefinition,
  // Paths to files containing OpenAPI definitions
  apis: ["./src/features/**/*.router.js", "./src/docs/**/*.yaml"],
};

const swaggerSpec = swaggerJSDoc(options);

export default swaggerSpec;
