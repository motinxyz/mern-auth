# 🌲 Logger Manual

This document explains the Logging system (`@auth/logger`) and how to use it to record application events.

---

## ⚡ Quick Start (How to use it)

### 1. Basic Logging
Do NOT use `console.log`. Use the injected `logger` instance.

```typescript
// ✅ Good: Structured & Searchable
this.logger.info({ userId: "123" }, "User logged in");

// ❌ Bad: Unstructured text
console.log("User 123 logged in");
```

### 2. Error Logging
Always pass the error object in the first argument property named `err`.

```typescript
try {
  await db.connect();
} catch (error) {
  // ✅ Good: Serializes the Error Stack Trace
  this.logger.error({ err: error }, "Database connection failed");
}
```

### 3. Scoped Logging (`child`)
If you want a group of logs to share the same context (like a specific request ID or module name).

```typescript
// Create a specialized logger for the "Payment" module
const paymentLogger = this.logger.child({ module: "payment" });

paymentLogger.info("Processing"); 
// Trace: { "msg": "Processing", "module": "payment" }
```

---

## ⚙️ Configuration (Tweaking the System)

### 1. Change Log Level
In your `.env` file:
```ini
# Options: debug, info, warn, error
LOG_LEVEL=debug 
```

### 2. Change Service Name
This controls the `service` label in Grafana logs.
```ini
OTEL_SERVICE_NAME=my-awesome-service
```

---

## 🛠️ Advanced Customization

### Where are the rules defined?

#### A. Change Redaction Rules (Hiding Secrets)
**File:** [`packages/logger/src/constants.ts`](file:///packages/logger/src/constants.ts)

Modify this file to add new keywords that should be hidden (scrubbed) from logs.

```typescript
export const REDACT_PATHS = [
    "password",
    "token",
    // Add your custom field here:
    "socialSecurityNumber" 
];
```

#### B. Change Transport Logic (Where logs go)
**File:** [`packages/logger/src/logger.ts`](file:///packages/logger/src/logger.ts)

Edit this file if you want to:
*   Switch from Loki to a different provider (e.g., Datadog, CloudWatch).
*   Change the development pretty-printer settings.

#### C. Change Env Variable Parsing
**File:** [`packages/logger/src/utils.ts`](file:///packages/logger/src/utils.ts)

Edit this if you change the names of your environment variables (e.g. renaming `GRAFANA_LOKI_URL`).

---

## 🧠 How it Works (Under the Hood)

1.  **Factory Pattern**: We don't export a global logger. We export a `createLogger()` function.
2.  **Singleton**: The app creates **one** logger instance at startup (`app-bootstrap`).
3.  **Redaction**: The logger uses `pino`'s built-in redaction to scan every log object for sensitive keys *before* it leaves memory.
4.  **Transport Split**: 
    *   **Dev**: Uses `pino-pretty` for colors.
    *   **Prod**: Uses `pino-loki` to batch-send logs over HTTP.
