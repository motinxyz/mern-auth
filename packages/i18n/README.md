# @auth/i18n

The dedicated Internationalization (i18n) package for the Auth Monorepo.
It wraps `i18next`, `i18next-http-middleware`, and `i18next-fs-backend` into a unified, easy-to-use API.

## 🧠 Core Concepts

This package uses the **Facade Pattern**. Instead of dealing with complex `i18next` configuration in every app, you import a pre-configured instance.

### Key Components

1.  **`initI18n()`**: Async function that boots up the i18n engine, connects to the filesystem to read JSON files, and prepares the cache.
2.  **`i18nMiddleware`**: Express middleware that auto-detects the user's language and attaches the `req.t` function.
3.  **`t()`**: Standalone translation function for use outside of request contexts (e.g., in utility functions).

---

## ⚙️ Configuration (`src/i18n.ts`)

The configuration is centralized in `src/i18n.ts`. Here is how it works:

### 1. Language Detection
The middleware checks for the language in this specific order:
1.  **Query String**: `?lang=es` (Highest priority)
2.  **Cookie**: `lang=es`
3.  **Header**: `Accept-Language: es-ES` (Browser default)

### 2. Namespaces
Translations are split into multiple files (namespaces) to keep JSONs small and organized.
**Current Namespaces**:
- `system` (Default)
- `auth`, `validation`, `errors`, `email`, `queue`, `token`, `worker`

**File Structure**:
```text
packages/i18n/src/locales/
├── en/
│   ├── auth.json
│   ├── system.json
│   └── validation.json
└── es/
    ├── auth.json
    └── ...
```

### 3. Backend (Filesystem)
It uses `i18next-fs-backend` to read files directly from the disk.
*   **Load Path**: `src/locales/{{lng}}/{{ns}}.json`
*   **Missing Keys**: If `saveMissing: true`, it creates `*.missing.json` files for untranslated keys (Dev mode).

---

## 🔄 Lifecycle & Flow

### Initialization (Boot)
1.  **Server Start**: `apps/api/src/app.ts` calls `await initI18n()`.
2.  **Loading**: `i18next` scans the `locales/` directory.
3.  **Ready**: Once the Promise resolves, the translation engine is hot.

### Request Flow (Runtime)
1.  **Incoming Request**: `GET /api/v1/login`.
2.  **Middleware**: `i18nMiddleware` runs.
    -   Detects `Accept-Language: es`.
    -   Sets `req.language = 'es'`.
    -   Binds `req.t` to the Spanish resource bundle.
3.  **Controller**:
    -   Calls `req.t("auth:login.success")`.
    -   Returns "Inicio de sesión exitoso".

---

## 🛠 Usage Guide

### 1. In Express Controllers (Recommended)
Always use `req.t` so it respects the user's detected language.
```typescript
import { Request, Response } from "express";

export const login = (req: Request, res: Response) => {
  const message = req.t("auth:login.success"); // "Login successful"
  res.json({ message });
};
```

### 2. In Standalone Utils (Use with caution)
If you are effectively "offline" (no request context), use the exported `t`.
**Note**: This defaults to the **System Locale (en)** unless properly contextualized, so avoid it for user-facing messages if possible.
```typescript
import { t } from "@auth/i18n";

export const systemLog = () => {
    console.log(t("system:boot_message"));
};
```

---

## 📝 How to Tweak

### Adding a New Language
1.  Create a folder: `packages/i18n/src/locales/fr/` (French).
2.  Copy `system.json` from `en/` to `fr/`.
3.  Translate the values.
4.  Restart the server (Filesystem backend caches loaded files).

### Adding a New Namespace
1.  Add the string to the `ns` array in `src/i18n.ts`:
    ```typescript
    ns: ["system", "auth", ..., "newFeature"],
    ```
2.  Create `en/newFeature.json`.

### Changing Detection Order
Edit `detection` object in `src/i18n.ts`:
```typescript
detection: {
    order: ["cookie", "header"], // Removed querystring support
    caches: ["cookie"],
}
```
