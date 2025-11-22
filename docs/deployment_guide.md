# Deployment Guide (Production Grade)

This guide outlines the best strategies for deploying the `@auth` monorepo.

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

Railway natively understands monorepos (Turborepo/PNPM) and requires **NO Docker**.

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

### Option C: Docker (VPS / Self-Hosted)

For maximum control, use the provided Dockerfiles to deploy on any VPS (AWS, DigitalOcean, Hetzner).

1.  **Build Images**:
    ```bash
    # Build API
    docker build -f packages/api/Dockerfile -t auth-api .

    # Build Worker
    docker build -f packages/worker/Dockerfile -t auth-worker .

    # Build Frontend (Nginx)
    docker build -f packages/web/Dockerfile -t auth-web .
    ```

2.  **Run Containers**:
    ```bash
    # Run API
    docker run -d -p 3001:3001 --env-file .env --name api auth-api

    # Run Worker
    docker run -d --env-file .env --name worker auth-worker

    # Run Frontend
    docker run -d -p 80:80 --name web auth-web
    ```

    *Note: For production, use **Docker Compose** to orchestrate these services together.*

---

## Level 4: Automated CI/CD (GitHub Actions)

**Question:** "If I automate deployment with GitHub Actions, is it the same as doing it manually?"
**Answer:** **YES.** The end result (a running container on your server) is identical. The difference is **who** does the work.

| Manual Deployment | Automated Deployment (GitHub Actions) |
| :--- | :--- |
| You run `docker build` on your laptop. | GitHub runs `docker build` on their servers. |
| You run `docker push`. | GitHub runs `docker push`. |
| You SSH into server to pull changes. | GitHub triggers a webhook (or SSH) to pull changes. |
| **Risk:** Human error, slow. | **Benefit:** Consistent, fast, automatic. |

### How to Automate?
I've created a workflow file for you at `.github/workflows/deploy.yml`.

1.  **Secrets**: Go to GitHub Repo -> Settings -> Secrets -> Actions.
2.  **Add**: `DOCKERHUB_USERNAME` and `DOCKERHUB_TOKEN`.
3.  **Push**: When you push to `main`, GitHub will automatically build your Docker images and push them to Docker Hub.
4.  **Deploy**: You can add a step to SSH into your VPS and run `docker pull && docker restart`.

---

## ⚖️ Comparison: Docker vs. Direct Deployment

| Feature | Direct Deployment (Railway/Render) | Docker Deployment (VPS) |
| :--- | :--- | :--- |
| **Ease of Use** | ⭐⭐⭐⭐⭐ (Connect GitHub & Go) | ⭐⭐ (Requires Docker knowledge) |
| **Maintenance** | Zero (Platform handles OS/Updates) | High (You manage OS, Security, Updates) |
| **Cost** | Higher (Pay for convenience) | Lower (Pay for raw compute) |
| **Control** | Limited (Platform constraints) | Full (Root access to OS) |
| **Scaling** | Auto-scaling (One click) | Manual (Orchestration needed) |
| **Best For** | **Startups, MVPs, Speed** | **Enterprise, Custom Infrastructure** |

**Verdict:**
-   Start with **Direct Deployment** (Railway/Render). It saves you hours of devops work.
-   Switch to **Docker/VPS** only when your bill exceeds $100/mo or you need custom OS-level configurations.

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
