# Codebase Explanation

This document provides a comprehensive explanation of the full-stack application's architecture, structure, and data flow.

## Table of Contents

1.  [High-Level Overview](#high-level-overview)
    - [Monorepo Strategy](#monorepo-strategy)
    - [Tooling](#tooling)
    - [Package Breakdown](#package-breakdown)
2.  [Application Startup](#application-startup)

The application's startup sequence is orchestrated to ensure all necessary services (configuration, database, logging, i18n) are initialized before the API server begins listening for requests.

The main entry point for the API application is `packages/api/src/index.js`, which simply imports and executes `packages/api/src/server.js`.

Here's a step-by-step breakdown of the startup process:

1.  **`packages/api/src/server.js`**:
    *   This file contains the `startServer` asynchronous function, which is immediately invoked.
    *   It imports `app` from `packages/api/src/app.js`, `config`, `logger`, `initI18n`, and `t` (translation function) from `@auth/config`, and `mongoose`, `connectDB`, `disconnectDB` from `@auth/database`.
    *   **Environment Loading (`@auth/config/env.js`):**
        *   The `env.js` file is responsible for loading environment variables. It first determines the monorepo root to locate the correct `.env` or `.env.test` file.
        *   It uses `dotenv` to load variables and `zod` to validate them against a predefined schema (`envSchema`). If validation fails, an `EnvironmentError` is thrown, halting the application.
        *   Default values are provided for many variables, and specific refinements (e.g., URL format for `MONGO_URI`, `REDIS_URL`) are applied.
        *   The validated and parsed configuration is then exported as `config`.
    *   **Internationalization Initialization (`@auth/config/i18n.js`):**
        *   `initI18n()` is called to set up the `i18next` instance. It configures `i18next-fs-backend` to load translation files from `packages/config/src/locales` and `i18next-http-middleware` for language detection.
        *   It preloads the "en" language and defines various namespaces (e.g., "system", "auth", "validation", "email", "token", "queue").
    *   **Database Connection (`@auth/database/index.js`):**
        *   `connectDB()` is called to establish a connection to MongoDB using Mongoose.
        *   It uses the `dbURI` and `dbName` from the `config` package.
        *   Mongoose connection events (`connected`, `error`, `disconnected`) are logged using the application's logger.
        *   If the connection fails, an error is logged, and the application exits.
    *   **Server Start:**
        *   Once i18n and the database are successfully initialized, the Express `app` (imported from `packages/api/src/app.js`) starts listening on the port defined in `config.port`.
        *   A success message is logged using the `logger` (from `@auth/config/logger.js`) and the `t` (translation) function.
    *   **Graceful Shutdown:**
        *   The `server.js` also sets up listeners for `SIGTERM` and `SIGINT` signals. Upon receiving these signals, the `gracefulShutdown` function is executed.
        *   This function closes the HTTP server, disconnects from the database (`disconnectDB()`), and then exits the process, ensuring no open connections or pending operations.

2.  **`packages/api/src/app.js`**:
    *   This file is responsible for configuring the Express application instance.
    *   **i18n Middleware:** `i18nMiddleware.handle(i18nInstance)` is applied early to ensure translation capabilities are available for subsequent middleware and route handlers.
    *   **Core Middleware (`packages/api/src/startup/middleware.js`):**
        *   `setupMiddleware(app)` is called to apply essential Express middleware:
            *   `cors`: Configures Cross-Origin Resource Sharing, allowing requests from the specified `clientUrl`.
            *   `helmet`: Sets various HTTP headers for security (e.g., XSS protection, no-sniff).
            *   `hpp`: Protects against HTTP Parameter Pollution attacks.
            *   `expressMongoSanitize`: Sanitizes user-supplied data to prevent NoSQL query injection.
            *   `express.json()`: Parses incoming JSON payloads.
            *   `express.urlencoded()`: Parses incoming URL-encoded payloads.
            *   `httpLogger` (from `@auth/core`): Logs HTTP requests.
            *   `authLimiter` (from `@auth/core`): Applies rate limiting to authentication-related routes (`/api/v1/auth`).
    *   **Health Check Endpoint:** A `/healthz` endpoint is defined to report the status of the database and Redis connection.
    *   **Route Setup (`packages/api/src/startup/routes.js`):**
        *   `setupRoutes(app)` is called to register all API routes.
        *   It defines an `apiPrefix` of `/api/v1`.
        *   It mounts `authRouter` (from `@auth/core`) under `/api/v1/auth` and `healthRouter` (local to `api` package) under `/api/v1/health`.
    *   **Swagger UI:** Sets up `/api-docs` endpoint for API documentation using `swagger-ui-express` and `swaggerSpec` (from `packages/api/src/config/swagger.js`).
    *   **404 Not Found Handler:** A middleware is added to catch any requests that fall through all defined routes, throwing a `NotFoundError` (from `@auth/utils`).
    *   **Global Error Handler (`@auth/core/middleware/errorHandler.js`):**
        *   The `errorHandler` middleware is the last middleware applied. It catches all errors (`next(err)`) and formats them into a consistent API error response, handling different types of errors (e.g., `ApiError`, validation errors, generic errors).

In summary, the application initializes its environment, logging, internationalization, and database connection, then configures the Express app with security, parsing, logging, and routing middleware, finally starting the HTTP server and setting up graceful shutdown procedures.
## 3. API Request Lifecycle: User Registration (`/register`)

This section details the journey of a user registration request, from the moment it hits the API gateway to the final response, including success, failure, validation, and error handling.

The `/register` endpoint is defined in `packages/core/src/features/auth/auth.routes.js`.

### Routing

*   The `packages/api/src/startup/routes.js` file mounts the `authRouter` (from `@auth/core`) at the `/api/v1/auth` path.
*   Inside `packages/core/src/features/auth/auth.routes.js`, the `POST /register` route is defined:
    ```javascript
    router.post("/register", authLimiter, validate(registerSchema), registerUser);
    ```
*   This route uses three middleware functions in sequence:
    1.  `authLimiter`: A rate-limiting middleware (from `@auth/core/middleware/rateLimiter.js`) to prevent abuse.
    2.  `validate(registerSchema)`: A validation middleware that uses `zod` to ensure the request body conforms to the `registerSchema`.
    3.  `registerUser`: The controller function (from `packages/core/src/features/auth/auth.controller.js`) that handles the business logic for user registration.

### Validation

*   **Zod Validation (`packages/core/src/features/auth/auth.validation.js`):**
    *   The `registerSchema` is a `zod` object schema that defines the expected structure and constraints for the request `body`.
    *   It specifies that `name`, `email`, and `password` are required strings.
    *   `name` and `password` have minimum length requirements (`VALIDATION_RULES.NAME.MIN_LENGTH`, `VALIDATION_RULES.PASSWORD.MIN_LENGTH` from `@auth/utils`).
    *   `email` must be a valid email format.
    *   Error messages for these validations are defined as translation keys (e.g., `"validation:name.required"`), allowing for internationalization of validation feedback.
*   **`validate` Middleware (`packages/core/src/middleware/validate.js`):**
    *   This generic middleware takes a `zod` schema as an argument.
    *   It attempts to parse `req.body`, `req.query`, and `req.params` against the provided schema using `schema.parseAsync()`.
    *   If validation fails, a `ZodError` is caught. The middleware then transforms the `ZodError` issues into a structured array of errors, each containing `field`, `message` (translation key), and `context` (for i18n interpolation, e.g., `count` for `too_small` errors).
    *   It then creates and passes a `ValidationError` (from `@auth/utils`) to the `next()` middleware, which will eventually be caught by the global error handler.

### Controller Logic (`packages/core/src/features/auth/auth.controller.js`)

*   The `registerUser` function is an asynchronous Express controller.
*   It wraps the call to the `registerNewUserService` (from `packages/core/src/features/auth/auth.service.js`) in a `try...catch` block.
*   **Success Path:** If `registerNewUserService` completes successfully, it returns the newly created user object. The controller then sends a `201 Created` response using `ApiResponse` (from `@auth/utils`), including the user data and a success message translated via `req.t("auth:register.success")`.
*   **Failure Path:** If `registerNewUserService` throws an error, the `catch` block calls `next(error)`, passing the error to the next middleware in the chain (ultimately the global error handler).

### Service Layer (`packages/core/src/features/auth/auth.service.js`)

*   The `registerNewUser` function encapsulates the core business logic for user registration.
*   **Rate Limiting Check:** It first checks a Redis key (`AUTH_REDIS_PREFIXES.VERIFY_EMAIL_RATE_LIMIT`) to see if the email address has exceeded a verification request rate limit. If so, it throws a `TooManyRequestsError` (from `@auth/utils`).
*   **Database Transaction:** It initiates a Mongoose session and performs the user creation within a transaction (`session.withTransaction`). This ensures atomicity: either the user is created and verification token is generated/queued, or nothing is changed.
    *   **User Creation:** `User.create([userData], { session })` creates the new user document in MongoDB.
    *   **Verification Token Creation:** `createVerificationToken(newUser)` (from `packages/core/src/features/token/token.service.js`) generates a secure, random token, hashes it, and stores the hashed token along with the `userId` and `email` in Redis with an expiration time (`config.verificationTokenExpiresIn`). The original (unhashed) token is returned.
    *   **Email Job Queuing:** `addEmailJob(EMAIL_JOB_TYPES.SEND_VERIFICATION_EMAIL, { user, token, locale })` (from `packages/queues/src/producers/email.producer.js`) adds a job to the BullMQ email queue to send the verification email. This offloads the email sending process to a background worker, preventing the API response from being delayed by SMTP operations.
*   **Rate Limit Set:** After the transaction and job queuing are successful, a rate limit is set in Redis for the user's email, preventing immediate re-registration or excessive verification email requests.
*   **Return Value:** The function returns the `toJSON()` representation of the newly created user.

### Database Interaction (`packages/database/src/models/user.model.js`)

*   The `User` Mongoose model defines the schema for user documents in MongoDB.
*   **Schema Definition:** It specifies fields like `name`, `email`, `password`, `role`, and `isVerified` with their types, validation rules (e.g., `required`, `minlength`, `unique`, `match` for email regex), and default values.
*   **`unique: true` for email:** This ensures that no two users can have the same email address. If a duplicate email is attempted, MongoDB will throw a `MongoServerError` with `code: 11000`.
*   **`select: false` for password:** This prevents the password hash from being returned in queries by default, enhancing security.
*   **`toJSON` Transform:** A `toJSON` transform is defined to customize the output of user objects. It converts `_id` to `id` and removes `_id`, `__v`, and `password` from the JSON representation.
*   **`pre('save')` Middleware (Password Hashing):** Before a user document is saved (or updated), this Mongoose middleware checks if the `password` field has been modified. If so, it uses `bcrypt` to hash the password with a salt round configured in `config.bcryptSaltRounds` before saving it to the database.

### Success Response (`packages/utils/src/ApiResponse.js`)

*   Upon successful registration, the `registerUser` controller creates an instance of `ApiResponse`.
*   This class standardizes success responses, including `statusCode`, `data` (the created user object), `message` (a translated success message), and a `success: true` flag.

### Error Handling

*   **Custom Errors (`packages/utils/src/ApiError.js`, `packages/utils/src/errors/*.js`):**
    *   The application uses a hierarchy of custom error classes extending `ApiError` (e.g., `ValidationError`, `TooManyRequestsError`, `NotFoundError`).
    *   `ApiError` itself is a standardized error class that includes `statusCode`, `message` (translation key), `errors` (for detailed validation errors), and a `success: false` flag.
    *   These custom errors are thrown by the service layer or validation middleware.
*   **Global Error Handler (`packages/core/src/middleware/errorHandler.js`):**
    *   This is the final middleware in the Express chain. It catches any errors passed via `next(error)`.
    *   **Error Conversion:** It first attempts to convert known external errors (like Mongoose `ValidationError` or `MongoServerError` for duplicate keys) into the application's `ApiError` or `ValidationError` format.
        *   For Mongoose `ValidationError` (from schema validation), it extracts field-specific error messages and contexts.
        *   For `MongoServerError` with `code: 11000` (duplicate key error, typically for email), it identifies the conflicting field and creates a `ValidationError` with a specific translation key (`"validation:email.inUse"`).
    *   **Logging:** Errors are logged using the `errorHandlerLogger` from `@auth/config/logger.js`. Server errors (5xx) are logged as `error`, while client errors (4xx) are logged as `warn`.
    *   **Response Formatting:** It constructs a standardized error response JSON object, including `success: false`, a translated main `message`, and an array of detailed `errors`. Sensitive fields like `password` are explicitly excluded from `oldValue` in error responses.
    *   The response is sent with the appropriate `statusCode` derived from the `ApiError`.

This comprehensive flow ensures that user registration is validated, securely processed, and provides clear feedback (success or detailed error messages) to the client, while offloading non-critical tasks like email sending to background processes.
    - [Routing](#routing)
    - [Validation](#validation)
    - [Controller Logic](#controller-logic)
    - [Service Layer](#service-layer)
    - [Database Interaction](#database-interaction)
    - [Success Response](#success-response)
    - [Error Handling](#error-handling)
## 4. Background Worker & Queue System

The application leverages a background worker and a message queue system (BullMQ with Redis) to handle long-running or asynchronous tasks, such as sending emails. This prevents these operations from blocking the main API thread and improves responsiveness.

### Job Production

*   **`packages/queues/src/producers/email.producer.js` (`addEmailJob`):**
    *   This function is responsible for adding email-related jobs to the BullMQ queue.
    *   As seen in the `auth.service.js`, after a user registers, `addEmailJob` is called with the job `type` (`EMAIL_JOB_TYPES.SEND_VERIFICATION_EMAIL`) and `data` (user information, verification token, and locale).
    *   It uses `emailQueue.add(type, { type, data }, { attempts: 3, backoff: { type: 'exponential', delay: 1000 } })` to add the job.
    *   `attempts` and `backoff` options configure automatic retries for failed jobs.
    *   If adding the job fails, a `JobCreationError` (from `@auth/utils`) is thrown.

### Queue Connection

*   **`packages/queues/src/connection.js`:**
    *   This file simply re-exports `redisConnection` from `@auth/config/redis`.
    *   The `redisConnection` object (from `@auth/config/redis.js` - not explicitly read but inferred from usage) is an `ioredis` client instance, configured to connect to the Redis server specified in `config.redisUrl`.
    *   This centralized connection ensures that both job producers and consumers use the same Redis instance for queue operations.
*   **`packages/queues/src/email.queue.js`:**
    *   This file defines the `emailQueue` using `new Queue(QUEUE_NAMES.EMAIL, { connection, defaultJobOptions })`.
    *   `QUEUE_NAMES.EMAIL` (from `packages/queues/src/queue.constants.js`) is a constant string identifying this specific queue.
    *   `defaultJobOptions` are set for all jobs added to this queue, including retry logic.
    *   It also sets up an `error` event listener to log any queue-related errors and throws a `QueueError`.

### Job Consumption

*   **`packages/worker/src/index.js`:**
    *   This is the main entry point for the background worker application.
    *   It first initializes `i18n` and the `emailService` (SMTP transporter) to ensure they are ready before processing jobs.
    *   It then imports `emailProcessor` from `./email.processor.js`, which is the BullMQ worker instance.
    *   It sets up graceful shutdown handlers for `SIGTERM` and `SIGINT` to properly close the worker and Redis connection.
*   **`packages/worker/src/email.processor.js`:**
    *   This file creates and configures the BullMQ `Worker` instance for the `email` queue.
    *   `const emailProcessor = new Worker(QUEUE_NAMES.EMAIL, processor, { connection, concurrency, removeOnComplete, removeOnFail, limiter });`
    *   The `processor` function is the core logic that will be executed for each job.
    *   `concurrency`: Defines how many jobs can be processed simultaneously.
    *   `removeOnComplete` and `removeOnFail`: Configure automatic cleanup of jobs from the queue after completion or failure.
    *   `limiter`: Applies rate limiting to the worker itself, controlling how many jobs it processes per unit of time.
    *   **Event Handlers:** The `emailProcessor` has event listeners for `failed` (logs the error and moves the job to a dead-letter queue), `completed` (logs success), and `ready` (logs when the worker is ready).
    *   Failed jobs are moved to a `failedJobsQueue` (a separate BullMQ queue for dead-letter jobs) for later inspection or reprocessing.

### Job Processing

*   **`packages/worker/src/consumers/email.consumer.js` (`emailJobConsumer`):**
    *   This function is the actual `processor` logic passed to the BullMQ `Worker` in `email.processor.js`.
    *   It receives a `job` object, extracts its `type` and `data`.
    *   It uses a `switch` statement to handle different job types.
    *   **`EMAIL_JOB_TYPES.SEND_VERIFICATION_EMAIL`:**
        *   It first validates the job `data` to ensure `user`, `token`, and `locale` are present. If not, it throws an `InvalidJobDataError`.
        *   It retrieves a fixed `i18n` translation function (`t`) for the job's specified `locale`.
        *   It then calls `sendVerificationEmail(data.user, data.token, t)` (from `@auth/email`) to construct and send the actual email.
        *   If email dispatch fails, an `EmailDispatchError` is thrown.
    *   **Default Case:** If an unknown job type is encountered, an `UnknownJobTypeError` is thrown.
*   **`packages/email/src/index.js` (`sendVerificationEmail`, `sendEmail`):**
    *   The `initEmailService` function initializes the Nodemailer `transport` using SMTP configuration from `config.smtp`.
    *   It also verifies the SMTP connection on startup (except in test environment).
    *   The `sendVerificationEmail` function (imported from `./templates/verification.js`) is responsible for generating the HTML content of the verification email using the provided user data, token, and translation function.
    *   The `sendEmail` function then uses the initialized Nodemailer `transport` to dispatch the email. It handles logging and throws an `EmailDispatchError` if the sending process fails.

This robust queue and worker system ensures that email sending is reliable, scalable, and does not impact the performance of the main API, with built-in retry mechanisms and error handling for failed jobs.
    - [Job Production](#job-production)
    - [Queue Connection](#queue-connection)
    - [Job Consumption](#job-consumption)
    - [Job Processing](#job-processing)

---

## 1. High-Level Overview

This project is structured as a monorepo, leveraging `pnpm` for package management and `Turborepo` for optimized build and development workflows. This setup allows for better code organization, reusability, and efficient management of multiple interdependent packages.

### Monorepo Strategy

The project uses `pnpm workspaces` to manage multiple packages within a single repository. The `pnpm-workspace.yaml` file defines the `packages/*` glob, indicating that all subdirectories within the `packages/` directory are considered individual packages. This allows packages to depend on each other using `workspace:*` protocol, ensuring they always use the local version of the dependency.

### Tooling

*   **pnpm:** The package manager used for installing dependencies and managing workspaces. It's known for its efficient disk space usage (hoisting dependencies) and strictness, which helps prevent phantom dependencies.
*   **Turborepo:** A high-performance build system for JavaScript and TypeScript monorepos. It optimizes the development process by:
    *   **Caching:** Caches build outputs and logs, so subsequent runs of the same task are instant.
    *   **Parallel Execution:** Executes tasks across packages in parallel, speeding up operations like `build`, `test`, and `lint`.
    *   **Task Graph:** Understands the dependencies between tasks and packages, ensuring tasks are run in the correct order.
    The `turbo.json` file configures how Turborepo handles different tasks (`build`, `lint`, `dev`, `test`), specifying dependencies between tasks and output locations for caching.

### Package Breakdown

The monorepo is composed of several distinct packages, each with a specific responsibility:

*   **`api`**:
    *   **Purpose:** The main entry point for the RESTful API. It handles HTTP requests, routes them to the appropriate handlers, and manages the overall Express application.
    *   **Key Dependencies:** `@auth/config`, `@auth/core`, `@auth/database`, `@auth/queues`, `@auth/utils`, `express`, `mongoose`, `swagger-jsdoc`, `zod`.
*   **`config`**:
    *   **Purpose:** Centralized configuration management for the entire application. It provides environment variables, logging setup, internationalization (i18n), and Redis connection configurations.
    *   **Key Dependencies:** `@auth/utils`, `dotenv`, `i18next`, `pino`, `ioredis`, `zod`.
*   **`core`**:
    *   **Purpose:** Contains the core business logic and features, such as authentication, token management, and common middleware. This package is designed to be reusable across different parts of the application.
    *   **Key Dependencies:** `@auth/config`, `@auth/database`, `@auth/email`, `@auth/queues`, `@auth/utils`, `express`, `express-rate-limit`, `helmet`, `pino-http`, `uuid`, `zod`.
*   **`database`**:
    *   **Purpose:** Manages database connections and defines Mongoose schemas and models. It abstracts database interactions from the rest of the application.
    *   **Key Dependencies:** `@auth/config`, `@auth/utils`, `bcrypt`, `mongoose`.
*   **`email`**:
    *   **Purpose:** Provides email sending functionality, integrating with services like Nodemailer or Resend. It defines email templates and handles the actual dispatch of emails.
    *   **Key Dependencies:** `@auth/config`, `@auth/utils`, `nodemailer`, `resend`.
*   **`queues`**:
    *   **Purpose:** Manages the BullMQ queue system. It defines job queues, producers (for adding jobs to queues), and handles the connection to Redis for queue management.
    *   **Key Dependencies:** `@auth/config`, `@auth/utils`, `bullmq`, `ioredis`, `nodemailer`.
*   **`utils`**:
    *   **Purpose:** A collection of shared utility functions, constants, custom error classes, and API response structures used across the monorepo.
    *   **Key Dependencies:** `uuid`.
*   **`worker`**:
    *   **Purpose:** Contains the background worker processes that consume jobs from the BullMQ queues and execute long-running or asynchronous tasks (e.g., sending emails).
    *   **Key Dependencies:** `@auth/config`, `@auth/core`, `@auth/database`, `@auth/email`, `@auth/queues`, `@auth/utils`, `bullmq`.
