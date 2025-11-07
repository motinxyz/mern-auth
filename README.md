# Auth Monorepo

This project is a monorepo for a full-stack authentication service, built with a modern, scalable architecture.

## Architecture

The monorepo is structured with a clear separation of concerns:

-   `packages/core`: A central package containing all shared business logic, services, and utilities.
-   `packages/api`: An Express-based API server that consumes the `core` package to expose authentication endpoints.
-   `packages/worker`: A background worker process that handles asynchronous tasks like sending emails, also using the `core` package.

This architecture allows for better code sharing, maintainability, and scalability.

## Getting Started

### Prerequisites

-   Node.js (v18 or higher)
-   pnpm
-   Docker (for running a local database and Redis)

### Installation

1.  Clone the repository.
2.  Install dependencies from the root of the monorepo:
    ```bash
    pnpm install
    ```

### Environment Setup

1.  Create a `.env` file in the root of the project by copying the `.env.example` file.
2.  Fill in the required environment variables, such as your database connection string, Redis URL, and email provider credentials.

### Running the Application

You can run the different parts of the application using the following commands from the root of the monorepo:

-   **Run the API server:**
    ```bash
    pnpm dev:api
    ```
-   **Run the background worker:**
    ```bash
    pnpm dev:worker
    ```
-   **Run all services concurrently:**
    ```bash
    pnpm dev
    ```

## Packages

### Core (`@auth/core`)

This is the heart of the application, containing all the shared logic:

-   **Configuration:** Centralized environment variable management with validation.
-   **Database:** Singleton database client and models.
-   **Queues:** BullMQ queue and worker definitions for background jobs.
-   **Services:** Core business logic (e.g., AuthService, TokenService).
-   **Utilities:** Shared utility functions and classes (e.g., ApiError, ApiResponse).

### API (`@auth/api`)

This package contains the Express server that exposes the REST API. It imports all its business logic from the `@auth/core` package.

Key features:

-   `/healthz` endpoint for monitoring.
-   Graceful shutdown logic.
-   Structured logging and error handling.

### Worker (`@auth/worker`)

This package runs the background worker processes. It imports worker definitions from the `@auth/core` package and connects to the queue to process jobs.

Key features:

-   Graceful shutdown to complete in-progress jobs.
-   Dead-letter queue for failed jobs.
-   Concurrency and rate limiting.
