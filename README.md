# AdMetrics Pro — Marketing SaaS Platform

A full-stack multi-client marketing reporting platform for digital marketing agencies.

---

## 🚀 Quick Start (Local Dev — No Docker Required)

You need: **Node.js 20+** and **PostgreSQL** running locally.

### 1. Clone & Setup

```bash
# Root
cp .env.example .env    # (already done)

# Backend
cd backend
npm install
cp .env backend/.env    # (already done)

# Frontend
cd ../frontend
npm install
```

### 2. Start PostgreSQL (if not using Docker)
```bash
# Using Docker just for DB:
docker run -d --name saas_pg -p 5432:5432 -e POSTGRES_USER=saas_user -e POSTGRES_PASSWORD=saas_pass -e POSTGRES_DB=saas_db postgres:16-alpine
```

### 3. Run Database Migrations & Seed
```bash
cd backend
npx prisma migrate dev --name init
npm run db:seed
```

### 4. Start Backend
```bash
cd backend
npm run dev
# Runs on http://localhost:4000
```

### 5. Start Frontend
```bash
cd frontend
npm run dev
# Runs on http://localhost:5173
```

---

## 🐳 Docker Compose (Full Stack)

```bash
docker-compose up --build
```

Services:
- Frontend: http://localhost:5173
- Backend API: http://localhost:4000
- pgAdmin: http://localhost:5050 (admin@agency.com / admin123)

Then seed the database:
```bash
docker exec saas_backend npm run db:seed
```

---

## 🔑 Default Credentials

| Role   | Email                      | Password    |
|--------|---------------------------|-------------|
| Admin  | admin@agency.com          | admin123    |
| Client | client@techcorp.com       | client123   |
| Client | client@fashionbrand.com   | client456   |

---

## 🔌 Meta API Setup (Live Data)

1. Go to [Meta for Developers](https://developers.facebook.com/)
2. Create an app with **Marketing API** and **Pages API** access
3. Create a **System User** in Business Manager
4. Add to `backend/.env`:
   ```
   META_APP_ID=your_app_id
   META_APP_SECRET=your_secret
   META_SYSTEM_USER_TOKEN=your_system_token
   USE_MOCK_DATA=false
   ```
5. In Admin dashboard → Client → add Meta Ad Account ID and Page IDs
6. Click **Sync Data** to fetch live data

---

## 📁 Project Structure

```
SOCIAL/
├── docker-compose.yml
├── backend/
│   ├── prisma/schema.prisma      # DB schema
│   ├── prisma/seed.ts            # Sample data
│   └── src/
│       ├── index.ts              # Express app
│       ├── middleware/           # Auth, errors, rate limit
│       ├── routes/               # API routes
│       ├── services/             # Business logic
│       └── jobs/                 # Cron jobs
└── frontend/
    └── src/
        ├── pages/                # React pages
        ├── components/           # Reusable components
        ├── hooks/                # React Query hooks
        ├── store/                # Zustand state
        └── lib/                  # API client, utils
```

---

## 🔐 Security Features

- **JWT** access tokens (7d) + **HTTP-only** refresh tokens (30d)
- **AES-256** encrypted Meta token storage
- **Helmet** HTTP security headers
- **Rate limiting** on all APIs (200 req/15min, 10 on auth)
- **Role-based** route protection (ADMIN vs CLIENT)

---

## 📊 API Endpoints

| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/auth/login` | Login |
| POST | `/api/auth/refresh` | Refresh token |
| GET | `/api/clients` | List clients |
| POST | `/api/clients` | Create client (admin) |
| GET | `/api/insights` | Get ad insights |
| GET | `/api/insights/social` | Social insights |
| GET | `/api/insights/campaigns` | Campaign list |
| POST | `/api/meta/sync` | Trigger data sync |
| POST | `/api/reports/generate` | Generate PDF |
| GET | `/api/reports/:id/download` | Download PDF |

---

## 🚀 Deployment

### Frontend → Vercel

```bash
cd frontend
npm run build
# Deploy dist/ to Vercel — set VITE_API_URL to your backend URL
```

### Backend → DigitalOcean / AWS

```bash
cd backend
npm run build
# Set NODE_ENV=production and all env vars
# Run: node dist/index.js (or use PM2)
```

### Database → Managed PostgreSQL

Use Supabase, Railway, or DigitalOcean Managed DB. Set `DATABASE_URL` to the connection string.

---

## ⚙️ Features

- ✅ Admin + Client role-based dashboards
- ✅ Meta Marketing API + Graph API (mock + live)
- ✅ KPI cards: Spend, Leads, ROAS, CTR, CPC, Reach
- ✅ Charts: Daily spend, followers growth, campaign comparison
- ✅ Sortable campaign performance table
- ✅ PDF report generation (Puppeteer) with branding
- ✅ Daily cron sync + weekly auto-reports
- ✅ White-labeling (logo, brand colors per client)
- ✅ AES token encryption
- ✅ In-memory API response caching

---

Built with ❤️ for digital marketing agencies.
