# The "Gold Standard" Application Startup Process

This document details exactly what happens when you run `pnpm dev:api` or deploy the application. It explains the "Invisible Magic" of observability and the precise order of operations that ensures a robust, production-grade startup.

---

## 🚀 high-Level Overview

1.  **Observability First**: OpenTelemetry hooks into Node.js internals *before* any other code loads.
2.  **Configuration Loading**: Environment variables are validated (Zod).
3.  **Composition Root**: Dependency Injection containers are prepared.
4.  **Service Initialization**: Database, Redis, and Email services connect in parallel.
5.  **Server Start**: Express starts listening only *after* services are ready.
6.  **Worker Start**: Background workers are initialized (if enabled).

---

## 🔍 Detailed Flow

### 1. The Entry Point: `server.ts`
**File:** `apps/api/src/server.ts`

This is the very first file executed.

```typescript
// 1. DNS Optimization (Critical for Node 17+ in some envs)
import dns from "node:dns";
dns.setDefaultResultOrder("ipv4first");

// 2. ✨ THE INVISIBLE MAGIC ✨
// This MUST be imported before 'express', 'mongoose', or any other lib.
import { initializeTracing, initializeSentry } from "@auth/observability";
initializeTracing();
initializeSentry();
```

**Why First?**
OpenTelemetry uses "Monkey Patching". It modifies the `http` module, `express` library, and `mongodb` driver in memory. If you import `express` *before* tracing, the tracing tool misses its chance to wrap the functions, and you get no traces.

### 2. Configuration & Validation
**File:** `packages/config`

After tracing is set up, we import `config`.
- Reads `.env`
- **Validates** everything with Zod schemas.
- If `MONGO_URI` is missing, the app **crashes immediately** with a clear error message. It doesn't wait to fail later.

### 3. bootstrapApplication()
**File:** `packages/app-bootstrap/src/bootstrap.ts`

`server.ts` calls `bootstrapApplication(app)`. This function is the "Orchestrator".

#### Step 3a: Initialize Common Services
It calls `initializeCommonServices()`, which does the following in **PARALLEL** (using `Promise.allSettled`):

1.  **i18n**: Loads translations (so errors are localized).
2.  **Database**: Connects to MongoDB (`mongoose.connect`).
3.  **Email**: Initializes the Email Service (checks Circuit Breaker state).
4.  **Queues**: Initializes Redis connection for background jobs.
5.  **Feature Flags**: Initializes Feature Flag Service (Redis connection).

**Resilience Strategy:**
If one service fails (e.g., Redis is down), the `allSettled` pattern catches it.
- **Critical Failure** (DB/Redis): Logs FATAL error and exits process (Kubernetes will restart it).
- **Non-Critical**: Logs error but might allow startup (depending on policy).

### 4. Dependency Injection (The "Backpack")
During this process, singletons are created:

- `getRedisService()`: Created once, reused everywhere.
- `getLogger()`: The global logger instance.

### 5. Starting the HTTP Server
**File:** `apps/api/src/app.ts`

Only after services are healthy does Express start listening.
- **Middleware**: Rate limiters, Helmet (Security), Compression are attached.
- **Routes**: `@auth/api` defines the paths (`/register`, `/login`).

### 6. Background Workers
**File:** `apps/api/src/worker.setup.ts`

The server also initializes the **Worker** (in the same process for simplicity, or separate process in prod).
- Subscribes to Redis queues.
- Ready to process "Send Email" jobs.

---

## 🧠 The "Magic" of Context Propagation

You asked: *"How does the trace know about the validation error?"*

This is **AsyncLocalStorage** (Node.js feature).

1.  **Request In**: `POST /register` hits the server.
2.  **OTel**: unique Trace ID `abc-123` is generated and stored in the "Invisible Backpack" (AsyncContext).
3.  **Controller**: Your code runs. The Backpack is still there.
4.  **Validation Error**: You call `addSpanAttributes()`.
5.  **Helper**: The helper looks in the Backpack: *"Is there a Trace ID?"* -> *"Yes, abc-123"*.
6.  **Enrich**: It writes `validation.failed=true` onto trace `abc-123`.

This happens automatically across functions, promises, and even database calls.

---

## 📦 Package Structure Advice: Errors

**Question:** *"Should errors be a different package?"*

**Current State:**
Errors are currently in `@auth/utils` (specifically `packages/utils/src/errors`).

**Recommendation:**
**Keep them in `@auth/utils` for now.**

**Why?**
1.  **Simplicity**: You don't want 50 tiny packages.
2.  **Shared Nature**: `ValidationError`, `DatabaseConnectionError`, `BadRequestError` are universally used utilities, just like `date-fns` or `lodash`.
3.  **No Dependencies**: These error classes are usually simple classes extending `Error`. They don't depend on complex logic, so they fit well in a "Core Utils" package.

**When to move them?**
Move them to `@auth/errors` ONLY IF:
- You have very complex error logic (e.g., error codes mapping, multi-language error hydration).
- `@auth/utils` becomes huge and bloated.

**Golden Standard Verdict:**
Your current setup (Errors in `utils`, Interfaces in `contracts`) is a **solid 10/10** for this scale. It separates the *definition* (interface) from the *implementation* (class) without over-engineering.
