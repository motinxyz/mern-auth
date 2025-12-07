import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import { config } from "@auth/config";
const options = {
    definition: {
        openapi: "3.0.0",
        info: {
            title: "Auth API",
            version: "1.0.0",
            description: "Production-grade authentication API with email verification, rate limiting, and circuit breakers",
            contact: {
                name: "API Support",
                email: config.emailFrom ?? "support@example.com",
            },
        },
        servers: [
            {
                url: config.isDevelopment === true
                    ? `http://localhost:${config.port}/api/v1`
                    : `${config.clientUrl}/api/v1`,
                description: config.isDevelopment === true
                    ? "Development server"
                    : "Production server",
            },
        ],
        components: {
            schemas: {
                User: {
                    type: "object",
                    properties: {
                        id: {
                            type: "string",
                            description: "User ID",
                        },
                        name: {
                            type: "string",
                            description: "User full name",
                        },
                        email: {
                            type: "string",
                            format: "email",
                            description: "User email address",
                        },
                        role: {
                            type: "string",
                            enum: ["user", "admin"],
                            description: "User role",
                        },
                        isVerified: {
                            type: "boolean",
                            description: "Email verification status",
                        },
                        createdAt: {
                            type: "string",
                            format: "date-time",
                            description: "Account creation timestamp",
                        },
                    },
                },
                ApiResponse: {
                    type: "object",
                    properties: {
                        success: {
                            type: "boolean",
                            description: "Indicates if the request was successful",
                        },
                        statusCode: {
                            type: "integer",
                            description: "HTTP status code",
                        },
                        message: {
                            type: "string",
                            description: "Response message",
                        },
                        data: {
                            type: "object",
                            description: "Response data",
                        },
                    },
                },
                ErrorResponse: {
                    type: "object",
                    properties: {
                        success: {
                            type: "boolean",
                            example: false,
                        },
                        statusCode: {
                            type: "integer",
                            description: "HTTP status code",
                        },
                        message: {
                            type: "string",
                            description: "Error message",
                        },
                        errors: {
                            type: "array",
                            items: {
                                type: "object",
                                properties: {
                                    field: {
                                        type: "string",
                                    },
                                    issue: {
                                        type: "string",
                                    },
                                },
                            },
                        },
                    },
                },
                RegisterRequest: {
                    type: "object",
                    required: ["name", "email", "password"],
                    properties: {
                        name: {
                            type: "string",
                            minLength: 2,
                            description: "User full name",
                        },
                        email: {
                            type: "string",
                            format: "email",
                            description: "User email address",
                        },
                        password: {
                            type: "string",
                            minLength: 8,
                            description: "User password (min 8 characters)",
                        },
                    },
                },
                HealthCheck: {
                    type: "object",
                    properties: {
                        status: {
                            type: "string",
                            enum: ["healthy", "degraded", "unhealthy"],
                        },
                        timestamp: {
                            type: "string",
                            format: "date-time",
                        },
                        checks: {
                            type: "object",
                            properties: {
                                database: {
                                    type: "object",
                                    properties: {
                                        healthy: {
                                            type: "boolean",
                                        },
                                    },
                                },
                                redis: {
                                    type: "object",
                                    properties: {
                                        healthy: {
                                            type: "boolean",
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            },
            securitySchemes: {
                bearerAuth: {
                    type: "http",
                    scheme: "bearer",
                    bearerFormat: "JWT",
                },
            },
        },
    },
    apis: ["./src/features/**/*.routes.js"], // Path to the API routes
};
export const swaggerSpec = swaggerJsdoc(options);
export const swaggerUiOptions = {
    explorer: true,
    customCss: ".swagger-ui .topbar { display: none }",
    customSiteTitle: "Auth API Documentation",
};
export { swaggerUi };
//# sourceMappingURL=index.js.map