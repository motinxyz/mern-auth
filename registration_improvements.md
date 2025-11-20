# Registration Flow Improvement Plan

This plan outlines specific enhancements to the user registration flow to meet production-grade, scalable, and modern standards.

## 1. Security & Validation

### 1.1 Enhanced Password Policy
- [ ] **Update Zod Schema**: Enforce password complexity (uppercase, lowercase, number, special char).
  ```javascript
  z.string().min(8).regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/, "Password must be complex")
  ```

### 1.2 Strict Input Validation
- [ ] **Strict Mode**: Use `.strict()` on Zod schemas to reject unknown fields.
- [ ] **Sanitization**: Use `.trim()` on all string inputs in Zod.

### 1.3 Advanced Rate Limiting
- [ ] **Granular Limits**: Ensure `authLimiter` distinguishes between registration and login attempts if needed.
- [ ] **Fail2Ban**: Implement a mechanism to block IPs after multiple failed attempts (using Redis).

## 2. Scalability & Reliability

### 2.1 Idempotency
- [ ] **Idempotency Keys**: Support `Idempotency-Key` header to prevent duplicate operations on network retries.

### 2.2 Job Deduplication
- [ ] **Unique Job IDs**: When adding email jobs to BullMQ, use a deterministic Job ID (e.g., `verify-email-${userId}`) to prevent duplicate emails if the producer retries.

## 3. Code Quality & Architecture

### 3.1 Decoupling
- [ ] **DTO Pattern**: Define a clear Data Transfer Object for passing data from Controller to Service, rather than passing the raw `req` or `req.body`.
- [ ] **Dependency Injection**: Refactor `auth.service.js` to accept dependencies (User model, Redis client) via a factory or class constructor for better unit testing.

### 3.2 Observability
- [ ] **Tracing**: Add OpenTelemetry spans to trace the registration transaction and queue handoff.
