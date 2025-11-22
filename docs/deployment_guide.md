# Deployment Guide (PaaS Only)

This guide outlines the best strategies for deploying the `@auth` monorepo using modern PaaS providers.

## 🏆 Recommended Architecture (Split Stack)

For a production-grade application, we separate the frontend and backend to leverage the best platforms for each.

| Component | Deployment Target | Cost | Difficulty | Why? |
| :--- | :--- | :--- | :--- | :--- |
| **Frontend** | **Vercel** | Free | ⭐ Easy | Global CDN, instant loading, zero config. |
| **Backend** | **Railway** | $5/mo | ⭐ Easy | Best monorepo support, fast builds. |
| **Backend (Alt)** | **Render** | Free | ⭐⭐ Medium | Free tier available (spins down on inactivity). |
| **Database** | **MongoDB Atlas** | Free | ⭐ Easy | Managed, automated backups. |
| **Redis** | **Upstash** | Free | ⭐ Easy | Serverless Redis. |

---

## Part 1: Frontend Deployment (Vercel) - Always Free

1.  **Push Code**: Ensure your code is on GitHub.
2.  **New Project**: Go to [Vercel](https://vercel.com/new) and import your repo.
3.  **Configure Project**:
    *   **Framework Preset**: Vite
    *   **Root Directory**: `packages/web` (Click "Edit" next to Root Directory).
4.  **Environment Variables**:
    *   `VITE_API_URL`: `https://<your-backend-url>/api/v1` (You will get this URL after deploying the backend).
5.  **Deploy**: Click "Deploy".

---

## Part 2: Backend Deployment (Choose One)

### Option A: Railway (Recommended - $5/mo)

Railway natively understands monorepos (Turborepo/PNPM).

1.  **New Project**: Go to [Railway](https://railway.app/) -> New Project -> Deploy from GitHub repo.
2.  **Configure API Service**:
    *   Select the repo.
    *   Go to **Settings** -> **General**.
    *   **Root Directory**: `packages/api` (Crucial Step).
    *   **Build Command**: `pnpm install` (Installs dependencies at root).
    *   **Start Command**: `pnpm start` (Runs `node src/server.js`).
3.  **Environment Variables**:
    *   Add all variables from your `.env` file.
    *   Set `CLIENT_URL` to your Vercel Frontend URL.
    *   Set `NODE_ENV` to `production`.
4.  **Configure Worker Service**:
    *   Add a **New Service** -> GitHub Repo -> Select the **SAME** repo.
    *   **Root Directory**: `packages/worker`.
    *   **Build Command**: `pnpm install`.
    *   **Start Command**: `pnpm start`.
    *   Add the same Environment Variables.

### Option B: Render (Free Tier)

Render offers a free tier but is slightly slower due to "cold starts" (server sleeps when not used).

1.  **New Web Service**: Go to [Render](https://render.com/) -> New -> Web Service.
2.  **Connect Repo**: Select your repository.
3.  **Configure**:
    *   **Name**: `auth-api`
    *   **Root Directory**: `.` (Leave as root).
    *   **Build Command**: `pnpm install`
    *   **Start Command**: `node packages/api/src/server.js`
    *   **Instance Type**: Free.
4.  **Environment Variables**:
    *   Add all `.env` variables.
    *   Add `PYTHON_VERSION` = `3.10.0` (Required for some build tools).
5.  **New Background Worker** (For the Worker):
    *   Create a new "Background Worker" service.
    *   **Start Command**: `node packages/worker/src/index.js`.

---

## Part 3: Connect Frontend & Backend

1.  **Update Backend Config**:
    *   In Railway/Render variables, ensure `CLIENT_URL` matches your **Vercel Frontend URL** (e.g., `https://myapp.vercel.app`).
    *   This allows CORS requests and ensures email links point to the right place.

2.  **Update Frontend Config**:
    *   In Vercel variables, set `VITE_API_URL` to your **Backend URL** (e.g., `https://myapp.up.railway.app/api/v1`).
    *   **Redeploy** Vercel for changes to take effect.

---

## 🚀 Production Checklist

-   [ ] **Database**: Use **MongoDB Atlas** (Cloud) instead of local.
-   [ ] **Redis**: Use **Upstash** or Railway Redis.
-   [ ] **Email**: Verify your domain in **Resend** to use a custom `EMAIL_FROM` address (e.g., `noreply@myapp.com`).
-   [ ] **Security**: Ensure `NODE_ENV=production` is set on all backend services.
