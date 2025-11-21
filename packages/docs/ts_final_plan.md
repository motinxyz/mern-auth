# TypeScript Migration Plan (Final) - Production Grade

This document outlines the detailed, step-by-step strategy to migrate the `auth-monorepo` to TypeScript. The approach is **bottom-up**, leveraging **Project References** for scalability and **modern tooling** (`tsup`, `tsx`) for performance.

## Phase 1: Infrastructure & Tooling Setup

### 1.1 Root Configuration
- [ ] **Install Dev Dependencies**:
  ```bash
  pnpm add -D typescript @types/node @types/express @types/jest tsx tsup -w
  ```
  *   `tsx`: Modern, fast execution for TypeScript files (replaces `ts-node`).
  *   `tsup`: Zero-config bundler powered by `esbuild` for building packages.

- [ ] **Create Root `tsconfig.base.json`**:
  Enforce **maximum strictness** for production-grade safety.
  ```json
  {
    "compilerOptions": {
      "target": "ES2022",
      "module": "NodeNext",
      "moduleResolution": "NodeNext",
      "strict": true,
      "noImplicitReturns": true,
      "noFallthroughCasesInSwitch": true,
      "noUncheckedIndexedAccess": true, // Prevents accessing array indices without checking
      "forceConsistentCasingInFileNames": true,
      "skipLibCheck": true,
      "esModuleInterop": true,
      "composite": true,
      "declaration": true,
      "declarationMap": true,
      "sourceMap": true
    }
  }
  ```

### 1.2 Package Configuration
- [ ] **Create `tsconfig.json` for each package**:
  ```json
  {
    "extends": "../../tsconfig.base.json",
    "compilerOptions": {
      "outDir": "./dist",
      "rootDir": "./src"
    },
    "include": ["src/**/*"],
    "exclude": ["node_modules", "**/*.test.ts"]
  }
  ```

## Phase 2: Shared Packages Migration (Bottom-Up)

Migrate packages with the fewest dependencies first. Use `tsup` for building.

### 2.1 `@auth/utils`
- [ ] Rename `.js` to `.ts`.
- [ ] Add types for error classes (`ApiError`, `ValidationError`).
- [ ] **Build Script**: Update `package.json`:
  ```json
  "scripts": {
    "build": "tsup src/index.ts --format cjs,esm --dts",
    "dev": "tsup src/index.ts --format cjs,esm --dts --watch"
  }
  ```

### 2.2 `@auth/config`
- [ ] Rename `.js` to `.ts`.
- [ ] **Runtime Validation**: Use `zod` to strictly validate `process.env` in `env.ts`. This is critical for production safety.
- [ ] Type the `logger` and `i18n` instances.

### 2.3 `@auth/database`
- [ ] Rename `.js` to `.ts`.
- [ ] Define Mongoose interfaces (`IUser`, `IUserDocument`).
- [ ] **Type Safety**: Use `InferSchemaType` from Mongoose to automatically generate types from schemas.

### 2.4 `@auth/email`
- [ ] Rename `.js` to `.ts`.
- [ ] Define interfaces for email templates.

## Phase 3: Core Logic Migration

### 3.1 `@auth/queues`
- [ ] Rename `.js` to `.ts`.
- [ ] Define strict types for Job data to prevent runtime payload errors.

### 3.2 `@auth/core` (The Big One)
- [ ] Rename `.js` to `.ts`.
- [ ] **Middleware**: Extend `Express.Request` globally to include `user` and `t` (translation function).
  ```typescript
  declare global {
    namespace Express {
      interface Request {
        user?: IUser;
        t: TFunction;
      }
    }
  }
  ```
- [ ] **Controllers**: Use `zod` for request validation.

## Phase 4: Application Entry Points

### 4.1 `@auth/worker`
- [ ] Rename `.js` to `.ts`.
- [ ] Use `tsx` for running the worker in dev: `"dev": "tsx watch src/index.ts"`.

### 4.2 `@auth/app-bootstrap`
- [ ] Rename `.js` to `.ts`.

### 4.3 `@auth/api`
- [ ] Rename `.js` to `.ts`.
- [ ] Update `server.ts`.
- [ ] **Production Build**: Use `tsc` or `tsup` to generate the final build artifacts.

## Phase 5: Testing & CI

- [ ] **Update Vitest**: Vitest supports TS natively. Ensure `vitest.config.ts` is set up.
- [ ] **CI Pipeline**:
    - **Type Check**: `turbo run type-check` (runs `tsc --noEmit` in all packages).
    - **Lint**: `turbo run lint`.
    - **Test**: `turbo run test`.

## Execution Strategy
1.  **Branching**: Keep working on the `ts` branch.
2.  **Commit Often**: Commit after migrating each package.
3.  **Verify**: Run `pnpm build` (using `tsup`) and `pnpm test` after each package migration.
