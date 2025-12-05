# Auth Monorepo: Architecture & HTTP Request Lifecycle

This document provides a comprehensive overview of the `auth` monorepo, from startup to shutdown, and traces the complete lifecycle of an HTTP request.

---

## Table of Contents

1.  [High-Level Architecture](#high-level-architecture)
2.  [Monorepo Structure](#monorepo-structure)
3.  [Application Startup Sequence](#application-startup-sequence)
4.  [Middleware Pipeline](#middleware-pipeline)
5.  [HTTP Request Lifecycle (End-to-End)](#http-request-lifecycle-end-to-end)
6.  [Background Worker Architecture](#background-worker-architecture)
7.  [Observability Stack](#observability-stack)
8.  [Graceful Shutdown](#graceful-shutdown)

---

## 1. High-Level Architecture

The application follows a **Clean Architecture / Hexagonal Architecture** pattern, separating concerns into distinct layers.

```mermaid
graph LR
    subgraph Cloud
        Tempo[Grafana Tempo]
        Loki[Grafana Loki]
        Sentry[Sentry]
    end

    subgraph Application["NODE.JS Process"]
        subgraph API["@auth/api (Presentation)"]
            Express[Express Server]
            Middleware[Middleware Chain]
            Routes[Routes]
            Adapters[Adapters]
        end

        subgraph Core["@auth/core (Business Logic)"]
            Controllers[Core Controllers]
            Services[Core Services]
        end

        subgraph Infra["Infrastructure Packages"]
            DB["@auth/database"]
            Email["@auth/email"]
            Queue["@auth/queues"]
            Worker["@auth/worker"]
        end

        subgraph Config["@auth/config"]
            Logger[Pino Logger]
            Tracing[OpenTelemetry]
        end
    end

    subgraph External
        MongoDB[(MongoDB)]
        Redis[(Redis)]
    end

    Client --> Express
    Express --> Middleware --> Routes --> Adapters --> Controllers --> Services
    Services --> DB --> MongoDB
    Services --> Queue --> Redis
    Worker --> Queue
    Worker --> Email

    Logger --> Loki
    Tracing --> Tempo
    API --> Sentry
```

---

## 2. Monorepo Structure

The project is a **pnpm monorepo** using **Turborepo** for build orchestration.

| Package           | Path                  | Responsibility                                                              |
| :---------------- | :-------------------- | :-------------------------------------------------------------------------- |
| `@auth/api`       | `packages/api`        | Express HTTP server, routes, middleware, and request adapters.             |
| `@auth/core`      | `packages/core`       | Framework-agnostic business logic: services, controllers, DTOs, validators. |
| `@auth/config`    | `packages/config`     | Centralized configuration, logging (Pino), i18n, Redis connection, and observability (tracing, metrics). |
| `@auth/database`  | `packages/database`   | Mongoose models, schemas, and the `DatabaseService` class.                  |
| `@auth/email`     | `packages/email`      | Email sending logic, provider abstraction (Resend, SendGrid, etc.).         |
| `@auth/queues`    | `packages/queues`     | BullMQ queue producers and consumers for background jobs.                   |
| `@auth/worker`    | `packages/worker`     | `WorkerService` to run BullMQ workers for processing jobs.                  |
| `@auth/utils`     | `packages/utils`      | Shared utilities, custom error classes, HTTP status codes.                  |
| `@auth/app-bootstrap` | `packages/app-bootstrap` | Application startup logic, service factories, and graceful shutdown.      |

---

## 3. Application Startup Sequence

The application starts from [packages/api/src/server.js](file:///home/home/codes/web/udemy/fullstack-prac/auth/packages/api/src/server.js).

```mermaid
sequenceDiagram
    participant Main as server.js
    participant OTel as OpenTelemetry
    participant Sentry
    participant Bootstrap as @auth/app-bootstrap
    participant Services as Infrastructure Services
    participant Express as express app
    participant Worker as WorkerService

    Main->>OTel: 1. initializeTracing() (MUST BE FIRST)
    Main->>OTel: 2. initializeMetrics()
    Main->>Sentry: 3. initSentry()
    Main->>Bootstrap: 4. bootstrapApplication(app)
    
    Bootstrap->>Services: initializeCommonServices()
    par Parallel Initialization
        Services->>Services: initI18n()
        Services->>Services: databaseService.connect()
        Services->>Services: emailService.initialize()
        Services->>Services: emailQueueProducer.initialize()
    end
    Bootstrap->>Express: 5. app.listen(port)
    Express-->>Main: Server Running
    
    Main->>Worker: 6. startWorker({...})
    Worker->>Worker: Register processors
    Worker-->>Main: Worker Running
```

### Key Files Involved

1.  **[server.js](file:///home/home/codes/web/udemy/fullstack-prac/auth/packages/api/src/server.js)**: The main entry point. Orchestrates initialization order.
2.  **[tracing.js](file:///home/home/codes/web/udemy/fullstack-prac/auth/packages/config/src/observability/tracing.js)**: Initializes OpenTelemetry SDK. **Must be imported first** to auto-instrument subsequent modules (Express, MongoDB, Redis).
3.  **[bootstrap.js](file:///home/home/codes/web/udemy/fullstack-prac/auth/packages/app-bootstrap/src/bootstrap.js)**: Contains `bootstrapApplication()` and `initializeCommonServices()`. This is the **Composition Root** where infrastructure services are wired together via factory functions.

---

## 4. Middleware Pipeline

Middleware is defined in [packages/api/src/app.js](file:///home/home/codes/web/udemy/fullstack-prac/auth/packages/api/src/app.js) and applied in a specific order.

```
Request →
  │
  ├── 1. createTimeoutMiddleware(30000)     // Request timeout guard
  │
  ├── 2. i18nMiddleware                     // Internationalization
  │
  ├── 3. configureMiddleware(app)           // (from setup.js)
  │       ├── cors()                        // Cross-Origin Resource Sharing
  │       ├── helmet()                      // Security headers (CSP, HSTS, etc.)
  │       ├── hpp()                         // HTTP Parameter Pollution protection
  │       ├── expressMongoSanitize()        // NoSQL injection protection
  │       ├── compression()                 // Gzip compression
  │       ├── express.json()                // Body parsing
  │       ├── express.urlencoded()          // URL-encoded body parsing
  │       └── httpLogger (pino-http)        // Request logging with trace IDs
  │
  ├── 4. sentryUserMiddleware               // Sentry user context
  │
  ├── 5. metricsMiddleware                  // Prometheus HTTP metrics (OTLP push)
  │
  ├── 6. /healthz (Liveness)
  │
  ├── 8. apiVersionMiddleware               // API versioning headers
  │
  ├── 9. apiLimiter (rate limiting)         // Global rate limit for /api
  │
  ├── 10. router (/api)                     // Main API routes
  │
  ├── 11. 404 Handler (NotFoundError)
  │
  ├── 12. timeoutErrorHandler
  │   
  ├── 13. Sentry.setupExpressErrorHandler() // Sentry error capture
  │
  └── 14. errorHandler                      // Global error formatter
                                            → Response
```

---

## 5. HTTP Request Lifecycle (End-to-End)

Let's trace a `POST /api/v1/auth/register` request from start to finish.

```mermaid
sequenceDiagram
    actor Client
    participant Express as Express App
    participant MW as Middleware Chain
    participant Router
    participant AuthRoutes as registration.routes.js
    participant AuthCtrl as AuthController (API)
    participant Adapter as AuthAdapter
    participant CoreCtrl as RegistrationController (Core)
    participant Service as RegistrationService
    participant DB as MongoDB (User Model)
    participant Queue as Email Queue (BullMQ)
    participant ErrHandler as errorHandler

    Client->>Express: POST /api/v1/auth/register
    
    Express->>MW: Timeout, i18n, Security, Parsing, Logging
    MW->>Express: req.body, req.log available
    
    Express->>Router: /api
    Router->>AuthRoutes: /v1/auth
    
    AuthRoutes->>MW: authLimiter (rate limit)
    AuthRoutes->>MW: validate(registrationSchema)
    
    alt Validation Fails
        MW-->>ErrHandler: new ValidationError()
        ErrHandler-->>Client: 422 Unprocessable Entity
    end
    
    AuthRoutes->>AuthCtrl: authController.register(req, res, next)
    
    AuthCtrl->>Adapter: toRegisterDto(req)
    Adapter-->>AuthCtrl: RegistrationDto
    
    AuthCtrl->>CoreCtrl: registrationController.registerUser(dto, locale)
    CoreCtrl->>Service: registrationService.register(dto)
    
    Service->>DB: User.create()
    
    alt User Already Exists
        DB-->>Service: Duplicate Key Error
        Service-->>ErrHandler: new ConflictError()
        ErrHandler-->>Client: 409 Conflict
    end
    
    Service->>Queue: emailProducer.addJob('SEND_VERIFICATION_EMAIL', {...})
    
    Service-->>CoreCtrl: newUser.toJSON()
    CoreCtrl-->>AuthCtrl: { statusCode: 201, data: ApiResponse }
    
    AuthCtrl->>Adapter: toExpressResponse(result, res)
    Adapter-->>Client: 201 Created + JSON body
```

### Code Path Summary

| Step | File                                                                 | Function / Class                      |
| :--- | :------------------------------------------------------------------- | :------------------------------------ |
| 1    | [app.js](file:///home/home/codes/web/udemy/fullstack-prac/auth/packages/api/src/app.js)                 | Middleware chain, `router`              |
| 2    | [router.js](file:///home/home/codes/web/udemy/fullstack-prac/auth/packages/api/src/router.js)           | Mounts `/v1/auth` to `authRoutes`       |
| 3    | [registration.routes.js](file:///home/home/codes/web/udemy/fullstack-prac/auth/packages/api/src/features/auth/registration.routes.js) | `authLimiter`, `validate()`, `authController.register` |
| 4    | [auth.adapter.instance.js](file:///home/home/codes/web/udemy/fullstack-prac/auth/packages/api/src/features/auth/auth.adapter.instance.js) | Wires `AuthController` with dependencies |
| 5    | [auth.controller.js](file:///home/home/codes/web/udemy/fullstack-prac/auth/packages/api/src/features/auth/auth.controller.js) | `AuthController.register()` - Express-specific controller |
| 6    | [auth.adapter.js](file:///home/home/codes/web/udemy/fullstack-prac/auth/packages/api/src/features/auth/auth.adapter.js) | `toRegisterDto()`, `toExpressResponse()` |
| 7    | [registration.controller.js](file:///home/home/codes/web/udemy/fullstack-prac/auth/packages/core/src/features/auth/registration/registration.controller.js) | `RegistrationController.registerUser()` - Core controller |
| 8    | [registration.service.js](file:///home/home/codes/web/udemy/fullstack-prac/auth/packages/core/src/features/auth/registration/registration.service.js) | `RegistrationService.register()` - Business logic |
| 9    | [@auth/database](file:///home/home/codes/web/udemy/fullstack-prac/auth/packages/database) | `User` Mongoose model                   |
| 10   | [@auth/queues](file:///home/home/codes/web/udemy/fullstack-prac/auth/packages/queues)   | `emailProducer.addJob()`                |
| 11   | [errorHandler.js](file:///home/home/codes/web/udemy/fullstack-prac/auth/packages/api/src/middleware/core/errorHandler.js) | Catches errors, formats response        |

---

## 6. Background Worker Architecture

The worker runs **in the same Node.js process** as the API server.

```mermaid
graph LR
    subgraph API Server Process
        API[Express API]
        Worker[WorkerService]
    end

    subgraph Redis
        EmailQueue[(Email Queue)]
        DeadLetterQueue[(Email Dead Letter)]
    end

    API -- Enqueues Job --> EmailQueue
    Worker -- Listens To --> EmailQueue
    Worker -- On Failure --> DeadLetterQueue
    Worker -- Processes Job --> EmailService[EmailService]
```

### Key Files

-   [worker.setup.js](file:///home/home/codes/web/udemy/fullstack-prac/auth/packages/api/src/worker.setup.js): Factory for `WorkerService`, registers processors.
-   [@auth/worker](file:///home/home/codes/web/udemy/fullstack-prac/auth/packages/worker): The `WorkerService` class.
-   [@auth/worker/consumers/email](file:///home/home/codes/web/udemy/fullstack-prac/auth/packages/worker/src/consumers/email.js): The `createEmailJobConsumer` factory.

---

## 7. Observability Stack

| Signal  | Library          | Destination         | Key File                                                                 |
| :------ | :--------------- | :------------------ | :----------------------------------------------------------------------- |
| **Logs**   | Pino, pino-http  | Grafana Cloud Loki  | `@auth/config/src/logging/`                                            |
| **Traces** | OpenTelemetry    | Grafana Cloud Tempo | [tracing.js](file:///home/home/codes/web/udemy/fullstack-prac/auth/packages/config/src/observability/tracing.js) |
| **Metrics**| Prometheus Client / OTLP | Grafana Cloud | [metrics.js](file:///home/home/codes/web/udemy/fullstack-prac/auth/packages/config/src/observability/metrics.js) |
| **Errors** | Sentry           | Sentry Cloud        | [sentry.js](file:///home/home/codes/web/udemy/fullstack-prac/auth/packages/api/src/config/sentry.js) |

**Correlation**: Pino logs include `traceId` and `spanId` from OpenTelemetry, enabling seamless navigation from logs to traces in Grafana.

---

## 8. Graceful Shutdown

Handled in [bootstrap.js](file:///home/home/codes/web/udemy/fullstack-prac/auth/packages/app-bootstrap/src/bootstrap.js).

```mermaid
sequenceDiagram
    participant OS
    participant Main as server.js
    participant Bootstrap as gracefulShutdown()
    participant Server as HTTP Server
    participant Worker
    participant Shipper as ObservabilityShipper
    participant DB as DatabaseService
    participant OTel as OpenTelemetry

    OS->>Main: SIGTERM / SIGINT
    
    Main->>Bootstrap: gracefulShutdown()
    
    Bootstrap->>Server: server.close()
    Note right of Server: Stop accepting new connections
    
    Bootstrap->>Worker: workerService.stop()
    
    Bootstrap->>Shipper: shipperService.stop()
    
    Bootstrap->>DB: databaseService.disconnect()
    
    Bootstrap->>OTel: sdk.shutdown()
    Note right of OTel: Flush pending traces
    
    Bootstrap->>OS: process.exit(0)
```

---

## Summary

This architecture provides:

1.  **Separation of Concerns**: HTTP handling is isolated from business logic.
2.  **Testability**: Dependencies are injected, making unit testing straightforward.
3.  **Observability**: Full trace-log-metric correlation out of the box.
4.  **Resilience**: Graceful shutdown, timeouts, and rate limiting are built-in.
