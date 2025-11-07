# Code Structure and Architecture

This document outlines the architecture of the project, explaining the role of each package in the monorepo.

## Guiding Principles

The project follows a layered architecture, emphasizing separation of concerns. This makes the codebase more modular, scalable, and easier to maintain. The main principles are:

-   **Single Responsibility**: Each package and module has a single, well-defined responsibility.
-   **Clear Dependencies**: Dependencies between packages should be clear and flow in one direction where possible (e.g., `api` depends on `core`, but `core` does not depend on `api`).

## Package Overview

The monorepo is organized into the following packages:

-   `packages/api`: The entry point for the application's API. It handles incoming HTTP requests, routes them to the appropriate controllers, and returns responses. It should not contain any business logic.
-   `packages/core`: The heart of the application. It contains the core business logic, services, and domain models. This package is where most of the application's functionality is implemented.
-   `packages/database`: Manages the database connection and provides the database models. It acts as a data access layer.
-   `packages/config`: Contains all the application's configuration, such as environment variables, internationalization (i18n), and logger settings.
-   `packages/queues`: Manages background job queues and workers.
-   `packages/utils`: A collection of shared utility functions and classes that can be used across all other packages. This includes things like error classes, API response formatters, etc.
-   `packages/worker`: A dedicated package for running background workers that process jobs from the queues.

## Current Project Structure

To address the duplication and confusion, here is a more streamlined and recommended structure.

### `packages/api`

-   **`src/`**
    -   **`app.js`**: Express app setup.
    -   **`index.js`**: Server entry point.
    -   **`server.js`**: Server initialization.
    -   **`config/`**: API-specific configurations.
        -   `swagger.js`: OpenAPI (Swagger) specification.
    -   **`docs/`**: API documentation files.
        -   `components.yaml`: OpenAPI schema components.
    -   **`features/`**: Feature-based modules.
        -   **`auth/`**
            -   `auth.router.js`: Routes for authentication.
            -   `auth.controller.js`: Controllers for handling auth requests.
            -   `auth.validation.js`: Request validation schemas.
        -   **`health/`**
            -   `health.router.js`: Health check endpoint.
    -   **`flows/`**: Documentation for code flows.
        -   `code-flow.md`: Application flow documentation.
    -   **`http/`**: HTTP client request definitions for testing.
        -   `auth.http`
        -   `health.http`
    -   **`startup/`**: Application startup logic (e.g., setting up routes).

### `packages/core`

-   **`src/`**
    -   **`index.js`**: Main package export.
    -   **`features/`**: Core business logic for each feature.
        -   **`auth/`**
            -   `auth.service.js`: The main service for authentication, containing all the business logic (e.g., user registration, login, token generation). It will use the `UserModel` from the `database` package.
    -   **`services/`**: Shared services that can be used by multiple features.
        -   `email.service.js`: Service for sending emails.
        -   `token.service.js`: Service for handling JWT tokens.
    -   **`middleware/`**: Custom Express middleware.
        -   `errorHandler.js`
        -   `rateLimiter.js`
        -   `validate.js`
    -   **`types/`**: Shared TypeScript declaration files.
        -   `auth.d.ts`: Type definitions for monorepo packages.

### `packages/database`

-   **`src/`**
    -   **`index.js`**: Database connection setup.
    -   **`models/`**
        -   `user.model.js`: The single source of truth for the User model.

### `packages/config`

-   **`src/`**
    -   `env.js`: Environment variable configuration.
    -   `i18n.js`: Internationalization setup.
    -   `index.js`: Main package export.
    -   `logger.js`: Logger configuration.
    -   `redis.js`: Redis configuration.
    -   `system-logger.js`: Specialized system logger configuration.
    -   **`locales/`**: Internationalization files.
        -   `en/`: English locale files.

### `packages/queues`

-   **`src/`**
    -   `connection.js`: Connection to the queueing system (e.g., Redis).
    -   `emailQueue.js`: Definition of the email queue and job adding function.
    -   `index.js`: Main package export.
    -   `queue.constants.js`: Constants for queue names and job types.

### `packages/utils`

-   **`src/`**
    -   `ApiError.js`: Custom error class for API errors.
    -   `ApiResponse.js`: Custom class for formatting API responses.
    -   **`constants/`**: Shared constants.
        -   `auth.constants.js`
        -   `httpStatusCodes.js`
        -   `index.js`
        -   `messages.constants.js`
        -   `token.constants.js`
        -   `validation.constants.js`
    -   **`errors/`**: Directory for specific error types.
    -   `index.js`: Main package export.

### `packages/worker`

-   **`src/`**
    -   `index.js`: Worker entry point.
    -   `emailWorker.js`: Worker to process jobs from the email queue.
