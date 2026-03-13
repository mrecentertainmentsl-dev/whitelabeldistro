# MREC Entertainment — White-Label Music Distribution Platform

> A production-ready, white-label SaaS music distribution platform built with Next.js, NestJS, PostgreSQL, Redis, and AWS.

---

## 📐 Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                          NGINX (Port 80/443)                        │
│                  White-label domain routing (CNAME)                 │
│              Passes X-Domain header → tenant resolution             │
└───────────────────────┬─────────────────────┬───────────────────────┘
                        │                     │
              ┌─────────▼──────┐   ┌──────────▼──────────┐
              │  Next.js 14    │   │   NestJS Backend     │
              │  (Frontend)    │   │   REST API           │
              │  Port 3000     │   │   Port 3001          │
              └────────────────┘   └──────────┬───────────┘
                                              │
              ┌───────────────────────────────┼───────────────────────┐
              │                               │                       │
    ┌─────────▼──────┐            ┌───────────▼──────┐   ┌───────────▼──────┐
    │   PostgreSQL   │            │     Redis         │   │    AWS S3        │
    │   Port 5432    │            │     Port 6379     │   │  (file storage)  │
    └────────────────┘            └──────────────────┘   └──────────────────┘
                                         │
                                ┌────────▼────────┐
                                │   BullMQ Queue  │
                                │ Release Process │
                                └─────────────────┘
                                         │
                                ┌────────▼────────┐
                                │   AWS SES        │
                                │  (transactional │
                                │    email)        │
                                └─────────────────┘
```

---

## 🗂️ Monorepo Structure

```
mrec-platform/
├── apps/
│   ├── frontend/                    # Next.js 14 App Router
│   │   ├── src/
│   │   │   ├── app/
│   │   │   │   ├── page.tsx              # Landing page
│   │   │   │   ├── layout.tsx            # Root layout + font loading
│   │   │   │   ├── globals.css           # CSS variables (white-label tokens)
│   │   │   │   ├── auth/
│   │   │   │   │   ├── login/page.tsx
│   │   │   │   │   ├── register/page.tsx
│   │   │   │   │   ├── forgot-password/page.tsx
│   │   │   │   │   └── verify-email/page.tsx
│   │   │   │   ├── dashboard/            # Artist dashboard
│   │   │   │   │   ├── layout.tsx        # Sidebar nav
│   │   │   │   │   ├── page.tsx          # Overview + stats
│   │   │   │   │   ├── releases/         # My releases list
│   │   │   │   │   ├── upload/page.tsx   # Multi-step upload flow
│   │   │   │   │   ├── analytics/page.tsx
│   │   │   │   │   └── settings/page.tsx
│   │   │   │   └── admin/                # Admin panel
│   │   │   │       ├── layout.tsx        # Admin sidebar
│   │   │   │       ├── page.tsx          # Overview stats
│   │   │   │       ├── users/page.tsx    # User management
│   │   │   │       ├── releases/page.tsx # All releases
│   │   │   │       ├── approvals/page.tsx# Review queue
│   │   │   │       ├── settings/page.tsx # Platform config
│   │   │   │       └── logs/page.tsx     # System logs
│   │   │   ├── components/
│   │   │   │   └── providers.tsx         # QueryClient + BrandingProvider
│   │   │   ├── lib/
│   │   │   │   ├── api.ts                # Axios + auth interceptors
│   │   │   │   └── branding-context.tsx  # White-label CSS var injection
│   │   │   └── store/
│   │   │       └── auth.store.ts         # Zustand auth state
│   │   ├── Dockerfile
│   │   └── package.json
│   │
│   └── backend/                     # NestJS REST API
│       ├── src/
│       │   ├── main.ts                   # Bootstrap + Swagger
│       │   ├── app.module.ts             # Root module
│       │   ├── auth/                     # JWT auth, strategies, guards
│       │   ├── users/                    # User entity + service
│       │   ├── releases/                 # Release + Song entities + CRUD
│       │   ├── uploads/                  # Presigned S3 URL generation
│       │   ├── admin/                    # Admin controller + logging
│       │   ├── branding/                 # White-label branding API
│       │   ├── settings/                 # Encrypted platform settings
│       │   ├── storage/                  # AWS S3 service
│       │   ├── mail/                     # AWS SES email templates
│       │   ├── queue/                    # BullMQ release processing
│       │   └── common/
│       │       ├── guards/               # JWT, Admin, Roles guards
│       │       └── middleware/           # Tenant (white-label) middleware
│       ├── Dockerfile
│       └── package.json
│
├── infrastructure/
│   ├── nginx/nginx.conf             # Reverse proxy + domain routing
│   └── scripts/init.sql            # Full database schema
│
├── docker-compose.yml               # Full stack local dev
└── README.md
```

---

## 🗄️ Database Schema

```sql
users           → Auth, profile, role
roles           → admin | artist | label
releases        → Title, type, status, artwork, metadata
songs           → Audio files, ISRC, composer, track metadata
uploads         → S3 file tracking
artists         → Stage name, bio, platform IDs
branding        → Platform name, colors, logo, CSS
domains         → Custom CNAME domains → branding mapping
settings        → Encrypted key/value store (AWS keys, etc.)
admin_logs      → Audit trail for all admin actions
notifications   → In-app user notifications
distribution_submissions → Per-platform delivery tracking (future)
```

---

## 🔌 REST API Endpoints

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/auth/register` | Register new account |
| POST | `/api/v1/auth/login` | Login → JWT |
| POST | `/api/v1/auth/verify-email/:token` | Email verification |
| POST | `/api/v1/auth/forgot-password` | Password reset email |
| POST | `/api/v1/auth/reset-password` | Reset with token |
| POST | `/api/v1/auth/refresh` | Refresh access token |
| GET  | `/api/v1/auth/me` | Current user |

### Releases (Artist)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/releases` | Create draft release |
| GET | `/api/v1/releases` | List my releases |
| GET | `/api/v1/releases/stats` | Release statistics |
| GET | `/api/v1/releases/:id` | Get release |
| PUT | `/api/v1/releases/:id` | Update draft |
| POST | `/api/v1/releases/:id/songs` | Add song to release |
| POST | `/api/v1/releases/:id/submit` | Submit for review |
| DELETE | `/api/v1/releases/:id` | Delete draft |

### Uploads
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/uploads/presign` | Get S3 presigned upload URL |
| GET | `/api/v1/uploads/download-url/:key` | Get presigned download URL |

### Admin
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/admin/overview` | Dashboard statistics |
| GET | `/api/v1/admin/users` | All users (paginated) |
| PATCH | `/api/v1/admin/users/:id/toggle-active` | Suspend/activate |
| DELETE | `/api/v1/admin/users/:id` | Delete user |
| GET | `/api/v1/admin/releases` | All releases |
| PATCH | `/api/v1/admin/releases/:id/metadata` | Edit metadata |
| POST | `/api/v1/releases/:id/approve` | Approve release |
| POST | `/api/v1/releases/:id/reject` | Reject with reason |
| GET | `/api/v1/admin/logs` | System audit logs |

### Branding & Settings
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/branding/public` | Public branding (domain-aware) |
| PUT | `/api/v1/branding/default/update` | Update default branding |
| GET | `/api/v1/settings` | All settings (secrets masked) |
| PUT | `/api/v1/settings` | Bulk update settings |

---

## 🎨 White-Label System

The platform supports unlimited white-label tenants via custom domains:

1. **Client points** `music.theirclient.com` via CNAME to `platform.mrec.io`
2. **Nginx** receives request, passes `X-Domain: music.theirclient.com` header
3. **TenantMiddleware** looks up domain → branding config in DB
4. **BrandingProvider** (frontend) fetches `/api/v1/branding/public`, applies CSS variables
5. **Each client** gets: own logo, colors, platform name, custom CSS, favicon

---

## 🚀 Quick Start

### Prerequisites
- Docker & Docker Compose
- AWS account (S3 + SES configured)
- Node.js 20+

### 1. Clone and configure
```bash
git clone <repo> mrec-platform
cd mrec-platform

cp apps/backend/.env.example apps/backend/.env
cp apps/frontend/.env.local.example apps/frontend/.env.local
# Edit both .env files with your AWS credentials
```

### 2. Start everything
```bash
docker-compose up -d
```

### 3. Access
| Service | URL |
|---------|-----|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:3001 |
| Swagger Docs | http://localhost:3001/api/docs |
| Admin Login | admin@mrec.io / Admin@123456 |

### 4. Change admin password immediately!
```
Settings → Account Settings → Change Password
```

---

## 📦 Upload Flow (S3 Direct Upload)

```
Artist                  Frontend              Backend           S3
  │                        │                     │              │
  ├─ Selects WAV file ──►  │                     │              │
  │                        ├─ POST /uploads/presign ──────────► │
  │                        │◄─────── { uploadUrl, key } ───────┤
  │                        │                     │              │
  │                        ├─ PUT uploadUrl (file) ────────────►│
  │                        │◄─────────────────── 200 OK ────────┤
  │                        │                     │              │
  │                        ├─ POST /releases/:id/songs ─────────┤
  │                        │     { audioUrl, audioS3Key }       │
  │                        │◄─────────────── song entity ───────┤
```

**Why direct upload?** The backend never handles the binary file — presigned URLs let clients upload directly to S3, keeping the API stateless and fast.

---

## 🔐 Security Features

- **JWT RS256** access tokens (7d) + refresh tokens (30d)
- **Rate limiting** via NestJS Throttler (configurable per-route)
- **File validation** — MIME type + extension checked server-side
- **S3 presigned URLs** expire in 1 hour — never expose raw AWS credentials
- **AES-256 encryption** for secrets stored in the settings table
- **RBAC** guards on all admin endpoints
- **Email enumeration protection** on forgot-password
- **CORS** locked to configured frontend domain

---

## 🎯 Distribution Integration (Future)

The `distribution_submissions` table and queue processor are pre-wired. To add a platform:

```typescript
// apps/backend/src/queue/release.processor.ts
@Process('approved')
async handleApproved(job: Job) {
  for (const platform of release.distributionPlatforms) {
    await this.distributionService.submit(platform, release);
    // → SpotifyDistributionAdapter
    // → AppleMusicDistributionAdapter
    // → YouTubeMusicDistributionAdapter
    // → TikTokDistributionAdapter
    // → DeezerDistributionAdapter
  }
}
```

---

## 📜 License

Proprietary — MREC Entertainment. All rights reserved.
