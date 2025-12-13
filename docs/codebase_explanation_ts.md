# The "Gold Standard" Monorepo: A Beginner's Guide

Welcome to the backend monorepo! If you feel like everything is new and overwhelming, don't worry. This guide is written specifically for you. We're going to break down this "Gold Standard" production-grade application from top to bottom, explaining **what** everything is and **why** it's there.

## The Big Picture: Why this way?

Most tutorials show you "Toy Code" - putting everything in one file (like `index.js`). That's fine for a hobby, but in the real world (companies like Google, Netflix, Uber), code needs to be **scalable**, **maintainable**, and **testable**.

This project uses a **Monorepo** structure (multiple "packages" in one git repository), **Clean Architecture**, and **Gold Standard Dependency Injection**.

### The "Restaurant" Analogy
Think of the entire backend as a professional restaurant:

1.  **Restaurant Opening Ceremony (@auth/app-bootstrap)**: The manager checks all equipment, turns on lights, tests the stove. All dependencies are wired together here.
2.  **Waiters (@auth/api)**: They take the customer's order (HTTP Request) and bring it to the kitchen. They don't cook, they just communicate.
3.  **Kitchen Manager (@auth/core)**: They decide what needs to be done. "We need a User Registration? Okay, check if they exist, create the user, and send a welcome email."
4.  **Chefs (@auth/worker)**: They handle the heavy, slow work in the back, like chopping 500 onions (sending 10,000 emails or processing videos). They work in the background so the waiters aren't blocked.
5.  **Recipe Book (@auth/contracts)**: The strict rules and agreements. "A 'Burger' MUST have a bun and meat." (Interface definitions).
6.  **Pantry (@auth/database)**: Where the raw ingredients (Data) are stored.
7.  **Utilities (@auth/config, @auth/utils)**: The specialized tools—knives, ovens, lights, and rule compliance (Environment variables, Logging).

---

## Architecture Diagram

```mermaid
graph TB
    subgraph "Composition Root (app.ts)"
        Bootstrap["@auth/app-bootstrap<br/>(Factory Provider)"]
        MiddlewareFactory["middleware.factory.ts<br/>(Composition Root)"]
        RouterFactory["createRouter()<br/>(Route Factory)"]
    end

    subgraph "Entry Points"
        API["@auth/api<br/>(Express App)"]
        Worker["@auth/worker<br/>(Background Job)"]
    end

    subgraph "Core Logic"
        Core["@auth/core<br/>(Business Logic)"]
    end

    subgraph "Infrastructure Singletons"
        Redis["getRedisService()"]
        Database["getDatabaseService()"]
        Email["getEmailService()"]
        Queues["getQueueServices()"]
    end

    subgraph "Shared Definitions"
        Contracts["@auth/contracts<br/>(Interfaces)"]
        Utils["@auth/utils<br/>(Helpers)"]
        Config["@auth/config<br/>(Settings)"]
    end

    Bootstrap --> Redis
    Bootstrap --> Database
    Bootstrap --> Email
    Bootstrap --> Queues
    
    API --> MiddlewareFactory
    MiddlewareFactory --> Redis
    MiddlewareFactory --> Database
    MiddlewareFactory --> RouterFactory
    
    Core --> Contracts
    Email --> Contracts
    Database --> Contracts
```

---

## The Gold Standard: Dependency Injection

### What Changed: Factory Pattern Everywhere

Instead of importing singletons directly, we use **factory functions** that accept dependencies:

```typescript
// ❌ OLD WAY (Tight Coupling)
import { redisConnection } from "@auth/config";
const cached = await redisConnection.get(key);

// ✅ NEW WAY (Gold Standard DI)
export function createCacheMiddleware(deps: { redis: IRedisConnection }) {
  const { redis } = deps;
  return async (req, res, next) => {
    const cached = await redis.get(key); // Uses injected dependency
  };
}
```

### Composition Root Pattern

All dependencies are wired together in ONE place: `app.ts`

```typescript
// app.ts - The Composition Root
import { getRedisService, getDatabaseService } from "@auth/app-bootstrap";
import { createMiddleware } from "./middleware/middleware.factory.js";
import { createRouter } from "./router.js";

// 1. Get singletons from bootstrap
const redis = getRedisService();
const databaseService = getDatabaseService();

// 2. Create all middleware with dependencies
const middleware = createMiddleware({ redis, databaseService });

// 3. Create router with dependencies
const router = createRouter({
  authLimiter: middleware.authLimiter,
  healthRoutes: middleware.healthRoutes,
});

// 4. Use them
app.use("/api", middleware.apiLimiter);
app.use("/api", router);
```

---

## Package Deep Dive

### 1. The "Soul": @auth/contracts
**Path:** `packages/contracts`
This is the **most important package**. It defines the "Agreements" (TypeScript Interfaces).
*   **Purpose:** It tells you *what* something does, without caring *how*.
*   **Key Interface:** `IRedisConnection` - defines all Redis methods (get, set, setex, del, call, etc.)
*   **Example:** `IEmailService` says "I permit sending an email." It doesn't care if you use Gmail, AWS, or a pigeon.

### 2. The "Brain": @auth/config
**Path:** `packages/config`
The central nervous system for settings.
*   **Schema Validation:** `env.schema.ts` validates all environment variables with Zod
*   **Pure Config:** No longer contains logger or application logic. Just environment variables.

### 3. The "Voice": @auth/logger
**Path:** `packages/logger`
**NEW: Zero-dependency logging package.**
*   **Purpose:** Provides the low-level Pino logger instance.
*   **Position:** Bottom of the dependency tree. Can be imported by anyone without causing circular dependencies.
*   **Factory:** Exports `createLogger()` which reads `LOG_LEVEL` directly from `process.env`.

### 4. The "Eyes": @auth/observability
**Path:** `packages/observability`
*   **Purpose:** Wraps `@auth/logger` and adds OpenTelemetry magic (Tracing context).
*   **Pattern:** Exports `createObservabilityLogger()` which is instantiated ONCE in `app-bootstrap`.
*   **No Circular Deps:** Strictly imports from `@auth/logger`, never from `@auth/config`.

### 5. The "Glue": @auth/app-bootstrap
**Path:** `packages/app-bootstrap`
**The Central Singleton Provider.**
*   **Purpose:** Provides lazy singletons for all infrastructure services.
*   **Key Exports:**
    - `getLogger()` - The ONE global logger instance (injected everywhere).
    - `getRedisService()` - Redis connection singleton.
    - `getDatabaseService()` - MongoDB connection singleton.
    - `getEmailService()` - Email service singleton.
    - `getQueueServices()` - Queue producer singletons.

### 6. The "Memory": @auth/database
**Path:** `packages/database`
*   **Tech:** MongoDB + Mongoose.
*   **Pattern:** Uses the **Repository Pattern**. Instead of writing raw DB queries in your logic, you call `userRepository.create()`.

### 7. The "Logic": @auth/core
**Path:** `packages/core`
Where the business rules live.
*   **Services:** (e.g., `RegistrationService`) The logic. "Check rate limit -> Save User -> Queue Email".
*   **Controllers:** (e.g., `RegistrationController`) The HTTP handler. "Read body -> Call Service -> Return JSON".
*   **Constructor Injection:** All dependencies (Logger, Redis, Config) passed in constructor.

### 8. The "Gateway": @auth/api
**Path:** `packages/api`
The HTTP Server (Express).
*   **Composition Root:** `app.ts` is where all dependencies are wired.
*   **Middleware Factory:** `middleware.factory.ts` creates all middleware with injected dependencies.
*   **Router Factory:** `createRouter()` accepts middleware dependencies.

#### Key Files:
- `app.ts` - Composition root, wires all dependencies.
- `middleware/middleware.factory.ts` - Creates all middleware instances.
- `router.ts` - Factory that creates API routes.

### 9. The "Messenger": @auth/email
**Path:** `packages/email`
*   **Resilience:** Uses a **Circuit Breaker**. If the email provider crashes, it temporarily stops trying to send emails.
*   **Failover:** Tries **Resend** first. If that fails, it automatically switches to **MailerSend**.

### 10. The "Muscle": @auth/worker
**Path:** `packages/worker`
The background process.
*   **Why?** Sending an email takes 1-2 seconds. We don't want the user to wait.
*   **How?** The API puts a "Job" in a queue (Redis). The Worker picks it up and processes it in the background.

---

## Key Concepts & Terms

### Factory Functions (Gold Standard DI)
Every middleware, controller, and service is created via factory functions or classes with constructor injection:

```typescript
// Service accepts dependencies via constructor
export class RegistrationService {
  constructor(private deps: {
    logger: ILogger; // Injected!
    redis: IRedisConnection; // Injected!
    config: IConfig; // Injected!
  }) {}
}

// Used in Composition Root (container.ts or app.ts)
const logger = getLogger(); // From bootstrap
const redis = getRedisService(); // From bootstrap

const service = new RegistrationService({ logger, redis, config });
```

### Why Factories? (Benefits)
1. **Testability:** Pass mock Logger and Redis in tests, no `vi.mock()` needed.
2. **Explicit Dependencies:** Just read the `constructor` to see what it needs.
3. **No Hidden State:** No globals or singletons imported randomly.
4. **Swap Implementations:** Easy to change Redis to another cache.

### Observability (OpenTelemetry)
We don't just "log" text. We create **Traces**.
A Trace is like a timeline bar chart showing exactly where time was spent.
Our `ILogger` implementation automatically injects `traceId` and `spanId` into every log message, allowing you to correlate logs with traces in Grafana.

### Error Tracking (Sentry)
New in version 2.0. We automatically capture backend crashes (500 errors) and send them to **Sentry**.
- **Auto-Capture:** Global Error Handler catches all exceptions.
- **Smart Filter:** Ignores 400 errors (Bad Input) to save noise/money.
- **Context:** Attaches User ID + Request URL to every crash report.

### Zod Validation
We never trust user input. **Zod** is a library that forces data to match a shape.
`z.string().email()` ensures the variable is *actually* an email before our code touches it.

---

## How a Request Flows (Example: Registration)

1.  **User** sends `POST /register`.
2.  **@auth/api/app.ts** receives it (dependencies already wired in composition root).
3.  **Router** (created via `createRouter()`) passes to `RegistrationController`.
4.  **Controller** calls `RegistrationService` (injected via constructor).
5.  **Service** starts a **Transaction** (all or nothing).
    *   Creates User in **Database**.
    *   Queues "Send Welcome Email" job in **Redis**.
6.  **Service** returns "Success". User sees "Check your email!" immediately.
7.  (...Milliseconds later...)
8.  **@auth/worker** wakes up, sees the job.
9.  **Worker** calls **@auth/email**.
10. **@auth/email** sends the actual email via Resend.

---

## Summary

You are looking at a codebase designed to scale to millions of users. It:
- **Separates concerns** (Logic vs. Database vs. HTTP).
- **Uses Gold Standard DI** (Factory functions, composition root).
- **Handles failures gracefully** (Circuit Breakers).
- **Tells you exactly what it's doing** (Traces & Structured Logging).

The key insight: **All dependencies flow from the composition root (`app.ts` or `bootstrap.ts`) downward. No file imports singletons directly - everything is injected.**

Mastering this structure means you can work on any complex enterprise system in the world.
