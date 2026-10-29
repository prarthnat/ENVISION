# Deployment & Operations Runbook — EnvisionStudio

## 1. Hosting Topology & Architecture

To support a persistent SQLite relational database alongside a modern Vite frontend, the recommended production setup separates static asset delivery from the stateful Node.js backend.

| Service | Recommended Host | Reason |
|---|---|---|
| **Frontend** | Vercel or Netlify | Global Edge CDN, instant previews, zero-config SPA routing. |
| **Backend** | Railway or Render | Persistent volume support, Docker/Node container execution, zero-idle sleep options. |
| **Database** | SQLite File (`prod.db`) on Persistent Volume | Zero infrastructure overhead, ACID compliant, file-level backups. |

> ⚠️ **Important Hosting Constraint:** Never deploy the SQLite backend to serverless or ephemeral container environments (e.g. AWS Lambda, Vercel Serverless Functions) without an attached persistent volume. Ephemeral disks reset on container shutdown, wiping database writes.

---

## 2. Environment Variables Configuration

### 2.1 Server Environment (`server/.env`)
```bash
# Database connection string (path relative to schema.prisma on disk volume)
DATABASE_URL="file:/app/server/prisma/prod.db"

# Server Port
PORT=3001

# CORS Allowed Origin (set to your public frontend URL)
CORS_ORIGIN="https://envision-studio.vercel.app"

# Node Environment
NODE_ENV="production"
```

### 2.2 Client Environment (`client/.env`)
```bash
# Public API URL pointing to the deployed backend
VITE_API_URL="https://envision-studio-api.up.railway.app"
```

---

## 3. Build & Deployment Commands

### 3.1 Server Deployment Steps (Railway / Render)
1. **Mount Volume:** Attach a persistent volume to the container at `/app/server/prisma`.
2. **Build Command:**
   ```bash
   cd server && npm install && npx prisma generate && npx prisma migrate deploy
   ```
3. **Start Command:**
   ```bash
   cd server && npm run build && node dist/index.js
   ```
4. **Initial Database Seed (Run Once via Shell Console):**
   ```bash
   cd server && npm run seed
   ```

### 3.2 Client Deployment Steps (Vercel)
1. Set **Root Directory** to `client`.
2. Set **Build Command** to `npm run build`.
3. Set **Output Directory** to `dist`.
4. Configure SPA Rewrite (`vercel.json`):
   ```json
   {
     "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
   }
   ```

---

## 4. Production Health & Smoke Checks

Immediately following deployment, run the following verification checks:

1. **Service Health Check:**
   ```bash
   curl -i https://your-backend.railway.app/health
   # Expected: HTTP 200 OK {"status":"ok","service":"envision-studio-api"}
   ```
2. **Summary Data Aggregation Check:**
   ```bash
   curl -i https://your-backend.railway.app/api/projects/summary
   # Expected: HTTP 200 OK with totalProjects >= 10
   ```
3. **CORS Validation:**
   ```bash
   curl -H "Origin: https://envision-studio.vercel.app" \
        -H "Access-Control-Request-Method: GET" \
        -X OPTIONS https://your-backend.railway.app/api/projects
   # Expected: Access-Control-Allow-Origin: https://envision-studio.vercel.app
   ```
4. **End-to-End User Flow:**
   - Open public frontend URL in a browser.
   - Verify KPI metric cards render with data.
   - Navigate to `/projects`, create a test project, and delete it.

---

## 5. Rollback & Disaster Recovery

- **Database Backup:**
  To take a snapshot of the production database file:
  ```bash
  cp /app/server/prisma/prod.db /app/server/prisma/backup-$(date +%F).db
  ```
- **Database Restore:**
  To restore from a previous backup:
  ```bash
  cp /app/server/prisma/backup-2026-10-28.db /app/server/prisma/prod.db
  ```
- **Code Rollback:**
  Use the Git provider's redeploy trigger to redeploy the previous stable commit SHA on Railway/Vercel.
