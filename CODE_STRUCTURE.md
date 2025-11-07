# Code Structure

This document outlines the structure of the codebase, explaining the purpose of each module and the separation of concerns.

```
/mnt/shared/codes/web/udemy/fullstack-prac/auth/
├───.env.test
├───.gitignore
├───CODE_STRUCTURE.md
├───eslint.config.js
├───package.json
├───pnpm-lock.yaml
├───pnpm-workspace.yaml
├───README.md
├───turbo.json
└───packages/
    ├───api/
    │   ├───package.json
    │   ├───vitest.config.js
    │   └───src/
    │       ├───app.js
    │       ├───app.test.js
    │       ├───index.js
    │       ├───server.js
    │       ├───config/
    │       │   └───swagger.js
    │       ├───docs/
    │       │   └───components.yaml
    │       ├───features/
    │       │   └───health/
    │       │       └───health.router.js
    │       ├───http/
    │       │   ├───auth.http
    │       │   └───health.http
    │       └───startup/
    │           ├───middleware.js
    │           └───routes.js
    ├───config/
    │   ├───package.json
    │   └───src/
    │       ├───env.js
    │       ├───i18n.js
    │       ├───index.d.ts
    │       ├───index.js
    │       ├───logger.js
    │       ├───redis.js
    │       └───locales/
    │           └───en/
    │               ├───auth.json
    │               ├───email.json
    │               ├───queue.json
    │               ├───system.json
    │               ├───token.json
    │               ├───validation.json
    │               └───worker.json
    ├───core/
    │   ├───package.json
    │   └───src/
    │       ├───index.js
    │       ├───features/
    │       │   ├───auth/
    │       │   │   ├───auth.controller.js
    │       │   │   ├───auth.controller.test.js
    │       │   │   ├───auth.routes.js
    │       │   │   ├───auth.service.js
    │       │   │   ├───auth.service.test.js
    │       │   │   ├───auth.validation.js
    │       │   │   └───auth.validation.test.js
    │       │   └───token/
    │       │       ├───token.service.js
    │       │       └───token.service.test.js
    │       ├───middleware/
    │       │   ├───errorHandler.js
    │       │   ├───errorHandler.test.js
    │       │   ├───index.js
    │       │   ├───loggerMiddleware.js
    │       │   ├───rateLimiter.js
    │       │   ├───responseHandler.js
    │       │   ├───validate.js
    │       │   └───validate.test.js
    │       ├───startup/
    │       │   ├───middleware.js
    │       │   └───routes.js
    │       └───types/
    │           └───auth.d.ts
    ├───database/
    │   ├───package.json
    │   └───src/
    │       ├───index.js
    │       ├───index.test.js
    │       └───models/
    │           └───user.model.js
    ├───email/
    │   ├───package.json
    │   └───src/
    │       ├───index.d.ts
    │       ├───index.js
    │       └───templates/
    │           ├───verification.d.ts
    │           └───verification.js
    ├───queues/
    │   ├───package.json
    │   └───src/
    │       ├───connection.js
    │       ├───email.queue.js
    │       ├───index.d.ts
    │       ├───index.js
    │       ├───queue.constants.js
    │       └───producers/
    │           ├───email.producer.js
    │           └───index.js
    ├───utils/
    │   ├───package.json
    │   └───src/
    │       ├───ApiError.js
    │       ├───ApiError.test.js
    │       ├───ApiResponse.js
    │       ├───ApiResponse.test.js
    │       ├───constants/
    │       │   ├───auth.constants.js
    │       │   ├───email.constants.js
    │       │   ├───httpStatusCodes.js
    │       │   ├───index.js
    │       │   ├───messages.constants.js
    │       │   ├───token.constants.js
    │       │   └───validation.constants.js
    │       ├───errors/
    │       │   ├───ConflictError.js
    │       │   ├───EmailDispatchError.js
    │       │   ├───EnvironmentError.js
    │       │   ├───index.js
    │       │   ├───InvalidJobDataError.js
    │       │   ├───JobCreationError.js
    │       │   ├───NotFoundError.js
    │       │   ├───QueueError.js
    │       │   ├───RedisConnectionError.js
    │       │   ├───TokenCreationError.js
    │       │   ├───TooManyRequestsError.js
    │       │   ├───UnknownJobTypeError.js
    │       │   └───ValidationError.js
    │       └───index.d.ts
    │       └───index.js
    └───worker/
        ├───package.json
        └───src/
            ├───consumers/
            │   ├───email.consumer.js
            │   └───email.consumer.test.js
            ├───email.processor.js
            ├───email.processor.test.js
            └───index.js
```

## Module Explanations

### `api` (`packages/api`)
This package serves as the RESTful API layer for the authentication service. Built with Express.js, it handles incoming HTTP requests, routes them to appropriate controllers, and returns structured responses. It integrates business logic primarily from the `@auth/core` package. Key features include a `/healthz` endpoint for monitoring, graceful shutdown, structured logging, and comprehensive error handling.

### `config` (`packages/config`)
This package centralizes all application configurations. It manages environment variables using Zod for validation, handles internationalization (i18n) with `i18next`, and configures service connections like Redis. Its objective is to provide a single, robust source for all settings, ensuring consistency and ease of modification across the monorepo.

### `core` (`packages/core`)
The core package encapsulates the main business logic and shared functionalities of the authentication service. It contains services (e.g., `AuthService`, `TokenService`), controllers, and middleware. This separation ensures that the core business rules are reusable, testable, and independent of any specific delivery mechanism (like the API). It leverages Zod for validation and provides common utilities.

### `database` (`packages/database`)
This package is dedicated to database interactions. It defines Mongoose models (e.g., `User`), handles database connection setup, and manages migrations. By abstracting the data layer, it allows for easier swapping or updating of the database technology without impacting other parts of the application.

### `email` (`packages/email`)
Responsible for all email-related operations, this package includes services for sending various types of emails (e.g., verification emails) and manages email templates. It aims to centralize and streamline email functionalities, making them easy to manage and extend.

### `queues` (`packages/queues`)
This package manages background job queues using BullMQ. It defines queues and producers for asynchronous tasks, such as sending emails, to offload time-consuming operations from the main application thread. This improves application performance, responsiveness, and user experience.

### `utils` (`packages/utils`)
The `utils` package provides a collection of shared utility functions, custom error classes (e.g., `ApiError`, `ValidationError`), API response formatters (`ApiResponse`), and constants. These utilities are designed to be reusable across all packages, promoting consistency and reducing code duplication.

### `worker` (`packages/worker`)
The `worker` package runs background processes that consume and process jobs from the queues defined in `@auth/queues`. It ensures that long-running or resource-intensive tasks are handled asynchronously, preventing them from blocking the main API server. It includes features like graceful shutdown, dead-letter queues for failed jobs, and configurable concurrency/rate limiting.