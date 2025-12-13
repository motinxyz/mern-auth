# TypeScript Migration Plan

> **Goal**: Migrate the `auth-monorepo` from JavaScript (ESM) to TypeScript while maintaining production stability, improving type safety, and enabling better developer experience.

---

## Table of Contents

1. [Overview](#1-overview)
2. [Prerequisites](#2-prerequisites)
3. [Phase 1: Foundation Setup](#phase-1-foundation-setup)
4. [Phase 2: Shared Packages Migration](#phase-2-shared-packages-migration)
5. [Phase 3: Core Services Migration](#phase-3-core-services-migration)
6. [Phase 4: API & Worker Migration](#phase-4-api--worker-migration)
7. [Phase 5: Testing Infrastructure](#phase-5-testing-infrastructure)
8. [Phase 6: Build & Deploy Pipeline](#phase-6-build--deploy-pipeline)
9. [Best Practices](#best-practices)
10. [Rollback Strategy](#rollback-strategy)

---

## 1. Overview

### Current State
- **Language**: JavaScript (ESM with `"type": "module"`)
- **Packages**: 11 workspace packages
- **Build Tool**: Turbo
- **Test Framework**: Vitest
- **Linting**: ESLint 9.x

### Target State
- **Language**: TypeScript 5.x (strict mode)
- **Module System**: ESM with `.js` extensions in imports
- **Build Output**: Compiled to `dist/` directories
- **Type Declarations**: Generated `.d.ts` files for all packages

### Migration Order (Dependency Graph)
```
@auth/contracts  ──┐
@auth/utils      ──┼──► @auth/config ──► @auth/database ──► @auth/core
                   │                                              │
                   └──► @auth/email ◄────────────────────────────┘
                                     │
                   ┌─────────────────┴───────────────────┐
                   ▼                                     ▼
            @auth/queues ──► @auth/worker         @auth/api
                                     │                   │
                                     └───────────────────┘
                                              │
                                     @auth/app-bootstrap
```

---

## 2. Prerequisites

### 2.1 Install TypeScript & Related Dependencies (Root)

```bash
pnpm add -Dw typescript @types/node tsx tsup
```

### 2.2 Install ESLint TypeScript Support

```bash
pnpm add -Dw @typescript-eslint/parser @typescript-eslint/eslint-plugin
```

### 2.3 Create Root `tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "lib": ["ES2022"],
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "outDir": "dist",
    "rootDir": "src",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": false,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "exactOptionalPropertyTypes": true,
    "noImplicitReturns": true,
    "noUncheckedIndexedAccess": true
  },
  "exclude": ["node_modules", "dist", "coverage"]
}
```

---

## Phase 1: Foundation Setup

### Step 1.1: Create Base TypeScript Configs

Create `tsconfig.base.json` in root:

```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "composite": true,
    "incremental": true
  }
}
```

Create `tsconfig.build.json` for production builds:

```json
{
  "extends": "./tsconfig.base.json",
  "compilerOptions": {
    "sourceMap": false,
    "declarationMap": false
  }
}
```

### Step 1.2: Update Package Manager Scripts

Update root `package.json`:

```json
{
  "scripts": {
    "build": "turbo run build",
    "typecheck": "turbo run typecheck",
    "dev:api": "pnpm --filter @auth/api dev"
  }
}
```

### Step 1.3: Configure Turbo for TypeScript

Update `turbo.json`:

```json
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**"]
    },
    "typecheck": {
      "dependsOn": ["^typecheck"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "lint": {},
    "test": {}
  }
}
```

---

## Phase 2: Shared Packages Migration

> **Order**: `@auth/contracts` → `@auth/utils` → `@auth/config`

### Step 2.1: Migrate `@auth/contracts`

This is the **perfect starting point** — it's pure interfaces with no implementation.

1. **Create package `tsconfig.json`**:

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "dist",
    "rootDir": "src"
  },
  "include": ["src/**/*"]
}
```

2. **Rename files**: `.js` → `.ts`

```bash
cd packages/contracts/src
for f in *.js; do mv "$f" "${f%.js}.ts"; done
```

3. **Convert interfaces to proper TypeScript**:

```typescript
// src/IEmailProvider.ts
export interface EmailSendResult {
  messageId: string;
  provider: string;
  accepted?: string[];
  response?: number;
}

export interface IEmailProvider {
  name: string;
  send(mailOptions: MailOptions): Promise<EmailSendResult>;
  verifyWebhookSignature(payload: string, headers: Record<string, string>): boolean;
  parseWebhookEvent(event: unknown): BounceData | null;
  checkHealth(): Promise<{ healthy: boolean; name: string; error?: string }>;
}
```

4. **Update `package.json`**:

```json
{
  "name": "@auth/contracts",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js"
    }
  },
  "scripts": {
    "build": "tsc",
    "typecheck": "tsc --noEmit",
    "dev": "tsc --watch"
  }
}
```

5. **Build and verify**:

```bash
pnpm --filter @auth/contracts build
```

### Step 2.2: Migrate `@auth/utils`

1. **Install package-specific types**:

```bash
pnpm --filter @auth/utils add -D @types/node
```

2. **Create `tsconfig.json`** (same pattern as contracts)

3. **Rename and convert files** one by one:
   - `ApiError.js` → `ApiError.ts`
   - `ApiResponse.js` → `ApiResponse.ts`
   - `circuit-breaker.js` → `circuit-breaker.ts`

4. **Add type annotations**:

```typescript
// src/ApiError.ts
export class ApiError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(
    message: string,
    statusCode: number = 500,
    isOperational: boolean = true
  ) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    Error.captureStackTrace(this, this.constructor);
  }
}
```

### Step 2.3: Migrate `@auth/config`

1. **Install types for dependencies**:

```bash
pnpm --filter @auth/config add -D @types/node
```

2. **Type the configuration object**:

```typescript
// src/types.ts
export interface AppConfig {
  nodeEnv: 'development' | 'production' | 'test';
  port: number;
  mongoUri: string;
  redisUrl: string;
  jwtSecret: string;
  resendApiKey?: string;
  mailersendApiKey?: string;
  // ... all config fields
}
```

3. **Type Zod schemas explicitly** (if using Zod):

```typescript
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3001),
  // ...
});

export type EnvConfig = z.infer<typeof envSchema>;
```

---

## Phase 3: Core Services Migration

> **Order**: `@auth/database` → `@auth/email` → `@auth/core`

### Step 3.1: Migrate `@auth/database`

1. **Type Mongoose models properly**:

```typescript
// src/models/User.ts
import { Schema, model, Document, Model } from 'mongoose';

export interface IUser {
  email: string;
  password: string;
  isEmailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IUserDocument extends IUser, Document {}

export interface IUserModel extends Model<IUserDocument> {
  findByEmail(email: string): Promise<IUserDocument | null>;
}

const userSchema = new Schema<IUserDocument, IUserModel>({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  isEmailVerified: { type: Boolean, default: false },
}, { timestamps: true });

userSchema.statics.findByEmail = function(email: string) {
  return this.findOne({ email: email.toLowerCase() });
};

export const User = model<IUserDocument, IUserModel>('User', userSchema);
```

2. **Type repositories**:

```typescript
// src/repositories/user.repository.ts
import { IUserDocument, User } from '../models/User.js';

export interface IUserRepository {
  findById(id: string): Promise<IUserDocument | null>;
  findByEmail(email: string): Promise<IUserDocument | null>;
  create(data: Partial<IUser>): Promise<IUserDocument>;
  updateById(id: string, data: Partial<IUser>): Promise<IUserDocument | null>;
}

export class UserRepository implements IUserRepository {
  async findById(id: string): Promise<IUserDocument | null> {
    return User.findById(id);
  }
  // ...
}
```

### Step 3.2: Migrate `@auth/email`

1. **Type provider implementations**:

```typescript
// src/providers/resend.provider.ts
import { Resend } from 'resend';
import type { IEmailProvider, EmailSendResult, MailOptions } from '@auth/contracts';

interface ResendProviderConfig {
  apiKey: string;
  webhookSecret?: string;
  logger: Logger;
}

export class ResendProvider implements IEmailProvider {
  public readonly name = 'resend-api';
  private client?: Resend;
  private webhookSecret?: string;
  private logger: Logger;

  constructor(config: ResendProviderConfig) {
    if (config.apiKey) {
      this.client = new Resend(config.apiKey);
    }
    this.webhookSecret = config.webhookSecret;
    this.logger = config.logger.child({ provider: this.name });
  }

  async send(mailOptions: MailOptions): Promise<EmailSendResult> {
    if (!this.client) {
      throw new Error('Resend API key not configured');
    }
    // ...
  }
}
```

### Step 3.3: Migrate `@auth/core`

1. **Type service classes with dependency injection**:

```typescript
// src/features/auth/registration/registration.service.ts
import type { IUserRepository } from '@auth/database';
import type { IEmailProducer } from '@auth/queues';
import type { ITokenService } from '../../token/token.service.js';

interface RegistrationServiceDeps {
  userRepository: IUserRepository;
  emailProducer: IEmailProducer;
  tokenService: ITokenService;
  logger: Logger;
}

export class RegistrationService {
  private readonly userRepository: IUserRepository;
  private readonly emailProducer: IEmailProducer;
  private readonly tokenService: ITokenService;
  private readonly logger: Logger;

  constructor(deps: RegistrationServiceDeps) {
    this.userRepository = deps.userRepository;
    this.emailProducer = deps.emailProducer;
    this.tokenService = deps.tokenService;
    this.logger = deps.logger;
  }

  async register(email: string, password: string): Promise<RegisterResult> {
    // ...
  }
}
```

---

## Phase 4: API & Worker Migration

### Step 4.1: Migrate `@auth/api`

1. **Install Express types**:

```bash
pnpm --filter @auth/api add -D @types/express @types/compression @types/cors
```

2. **Type Express handlers**:

```typescript
// src/features/auth/auth.controller.ts
import type { Request, Response, NextFunction } from 'express';

export class AuthController {
  register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // ...
      res.status(201).json({ success: true });
    } catch (error) {
      next(error);
    }
  };
}
```

3. **Type middleware**:

```typescript
// src/middleware/core/errorHandler.ts
import type { Request, Response, NextFunction, ErrorRequestHandler } from 'express';
import { ApiError } from '@auth/utils';

export const errorHandler: ErrorRequestHandler = (
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  // ...
};
```

4. **Use `tsx` for development**:

```json
{
  "scripts": {
    "dev": "tsx watch src/server.ts",
    "start": "node dist/server.js",
    "build": "tsc"
  }
}
```

### Step 4.2: Migrate `@auth/worker`

1. **Type BullMQ jobs**:

```typescript
// src/types/jobs.ts
export interface VerificationEmailJobData {
  user: {
    id: string;
    email: string;
  };
  token: string;
  lang: string;
  preferredProvider?: string;
}

export type EmailJobData = VerificationEmailJobData | PasswordResetJobData;
```

2. **Type consumers**:

```typescript
// src/consumers/email.consumer.ts
import type { Job } from 'bullmq';
import type { EmailJobData } from '../types/jobs.js';

export class EmailConsumer {
  async process(job: Job<EmailJobData>): Promise<void> {
    const { user, token, lang } = job.data;
    // TypeScript now knows all properties!
  }
}
```

---

## Phase 5: Testing Infrastructure

### Step 5.1: Configure Vitest for TypeScript

Update `vitest.config.ts` (rename from `.js`):

```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
    },
  },
});
```

### Step 5.2: Type Test Mocks

```typescript
// src/__tests__/mocks.ts
import { vi } from 'vitest';
import type { IUserRepository } from '@auth/database';

export function createMockUserRepository(): IUserRepository {
  return {
    findById: vi.fn(),
    findByEmail: vi.fn(),
    create: vi.fn(),
    updateById: vi.fn(),
  };
}
```

### Step 5.3: Rename Test Files

```bash
# In each package
find src -name "*.test.js" -exec bash -c 'mv "$0" "${0%.js}.ts"' {} \;
```

---

## Phase 6: Build & Deploy Pipeline

### Step 6.1: Update CI/CD

```yaml
# .github/workflows/ci.yml
jobs:
  typecheck:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: 'pnpm'
      - run: pnpm install
      - run: pnpm typecheck

  build:
    needs: typecheck
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: 'pnpm'
      - run: pnpm install
      - run: pnpm build
```

### Step 6.2: Production Build with `tsup`

For optimized builds, consider using `tsup`:

```typescript
// packages/api/tsup.config.ts
import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/server.ts'],
  format: ['esm'],
  dts: true,
  clean: true,
  sourcemap: true,
  target: 'node22',
});
```

---

## Best Practices

### 1. Incremental Migration

- **Never migrate everything at once**
- Keep `.js` and `.ts` files working together during migration
- Use `allowJs: true` in `tsconfig.json` during transition

### 2. Import Extensions

Always use `.js` extensions in imports (even for `.ts` files):

```typescript
// ✅ Correct
import { User } from './models/User.js';

// ❌ Wrong
import { User } from './models/User';
import { User } from './models/User.ts';
```

### 3. Strict Mode from Day One

Enable `"strict": true` immediately. It prevents:
- `any` type leakage
- Null/undefined errors
- Missing property checks

### 4. Prefer Interfaces Over Types

```typescript
// ✅ Prefer for object shapes
interface User {
  id: string;
  email: string;
}

// ✅ Use type for unions, intersections
type Status = 'pending' | 'active' | 'suspended';
```

### 5. Use `unknown` Over `any`

```typescript
// ✅ Forces type checking
function parseJson(input: string): unknown {
  return JSON.parse(input);
}

// ❌ Bypasses type system
function parseJson(input: string): any {
  return JSON.parse(input);
}
```

---

## Rollback Strategy

If issues arise during migration:

1. **Git checkpoints**: Create a branch/tag before each phase
2. **Package-level rollback**: Revert individual packages without affecting others
3. **CI gate**: Don't merge until all tests pass

```bash
# Create checkpoint before each phase
git tag -a "pre-ts-phase-1" -m "Before TypeScript Phase 1"

# Rollback if needed
git checkout pre-ts-phase-1
```

---

## Estimated Timeline

| Phase | Duration | Packages |
|-------|----------|----------|
| Phase 1: Foundation | 1 day | Root config |
| Phase 2: Shared | 2-3 days | contracts, utils, config |
| Phase 3: Core | 3-4 days | database, email, core |
| Phase 4: Services | 2-3 days | api, worker, queues |
| Phase 5: Tests | 1-2 days | All packages |
| Phase 6: CI/CD | 1 day | Pipeline |

**Total: ~10-14 days** for a careful, production-safe migration.

---

## Summary Checklist

- [x] **Phase 1: Foundation & Tooling**
  - [x] Install TypeScript & dependencies
  - [x] Create root `tsconfig.json`
  - [x] Create `tsconfig.base.json`
  - [x] Update `turbo.json` and root `package.json`

- [x] **Phase 2: Bulk Rename & Initial Fixes**
  - [x] Rename all `.js` to `.ts` in packages
  - [x] Rename all `.js` to `.ts` in tests
  - [ ] Fix critical build errors (Imports, Class Properties)
  - [ ] Rebuild all packages

- [ ] **Phase 3: Shared Packages Migration (@auth/contracts, @auth/utils, @auth/config)**
  - [x] `@auth/contracts` (Deep Migration)
  - [x] `@auth/utils` (Deep Migration)
  - [ ] `@auth/config` (Fixing build errors)
- [ ] Migrate `@auth/database` (Mongoose models)
- [ ] Migrate `@auth/email` (providers)
- [ ] Migrate `@auth/core` (business logic)
- [ ] Migrate `@auth/queues` (job types)
- [ ] Migrate `@auth/worker` (consumers)
- [ ] Migrate `@auth/api` (Express handlers)
- [ ] Migrate `@auth/app-bootstrap` (DI container)
- [ ] Update all tests to `.ts`
- [ ] Update CI/CD pipeline
- [ ] Remove `allowJs` and verify strict mode
- [ ] 🎉 Full TypeScript monorepo!
