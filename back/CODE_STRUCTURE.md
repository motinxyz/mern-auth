# Code Structure Overview

This document provides a high-level overview of the directory structure and the purpose of each component in this project.

```
├── src/
│   ├── config/         # Environment variables and application configuration (e.g., port, db connection).
│   ├── constants/      # Application-wide constants (e.g., HTTP status codes).
│   ├── docs/           # Reusable OpenAPI/Swagger component schemas (YAML).
│   ├── features/       # Core business logic, organized by feature domain (e.g., auth, users).
│   ├── flows/          # High-level architectural diagrams (e.g., error-flow.md).
│   ├── middleware/     # Express middleware functions (e.g., error handler, logger, validation).
│   ├── startup/        # Initialization logic for the app (e.g., setting up middleware, routes).
│   ├── utils/          # Reusable utility functions and classes (e.g., ApiError, ApiResponse).
│   ├── app.js          # The main Express application setup.
│   └── server.js       # The script that creates and starts the HTTP server.
├── .env                # Environment variables (not committed to git).
├── .gitignore          # Files and directories to be ignored by git.
├── package.json        # Project dependencies and scripts.
└── README.md           # General project information.
```

## Core Concepts

### `src/features`

This is the heart of the application. Each subdirectory within `features` represents a distinct domain or feature of the application (e.g., `auth`, `products`). A typical feature directory contains:

-   `*.controller.js`: Handles incoming HTTP requests, calls services, and sends responses.
-   `*.service.js`: Contains the core business logic. It interacts with models and performs operations.
-   `*.router.js`: Defines the API routes for the feature and links them to controllers.
-   `*.validation.js`: Defines validation rules for incoming request data.
-   `*.model.js`: The Mongoose data model and schema for the feature.
-   `README.md`: (Optional but recommended) Documentation specific to this feature.

### `src/startup`

This directory is responsible for orchestrating the application's startup sequence. It ensures that middleware, routes, and other configurations are loaded in the correct order.

### Error Handling

The application uses a centralized error handling strategy. All errors are eventually caught by the global `errorHandler` middleware. For a detailed visualization, see `src/flows/error-flow.md`.

### API Documentation

API documentation is generated automatically from JSDoc comments in the `*.router.js` files. Reusable schemas are defined in `src/docs/`. The interactive documentation is available at the `/api-docs` endpoint.