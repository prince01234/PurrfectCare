# PurrfectCare - Pet Care Made Easy

PurrfectCare - Pet Care Made Easy is a full-stack pet care platform that combines pet health management, service booking, adoption workflows, a marketplace, lost-and-found reporting, and real-time communication in one system.

This repository is organized as a monorepo with two main applications:

- `backend/`: Express + MongoDB API, Socket.IO server, schedulers, and integrations
- `frontend/`: Next.js App Router client application

## Table of Contents

1. [What This Project Includes](#what-this-project-includes)
2. [Architecture](#architecture)
3. [Tech Stack](#tech-stack)
4. [Repository Structure](#repository-structure)
5. [Getting Started Locally](#getting-started-locally)
6. [Environment Variables](#environment-variables)
7. [API Surface Overview](#api-surface-overview)
8. [Real-Time, Notifications, and Scheduling](#real-time-notifications-and-scheduling)
9. [Roles and Access](#roles-and-access)
10. [Scripts](#scripts)
11. [Deployment Notes and Gotchas](#deployment-notes-and-gotchas)
12. [Current Testing State](#current-testing-state)

## What This Project Includes

- Authentication with email/password + OAuth (Google, Facebook, GitHub)
- JWT + cookie based session handling
- Pet profiles with image uploads
- Pet health domain:
  - Vaccinations
  - Medical records
  - Care logs
  - Reminders
- Reminder automation:
  - In-app notification dispatch
  - Push notification dispatch (FCM)
  - Email reminders (Resend)
- Service provider system:
  - Provider profiles and service options
  - Time-slot and date-range bookings
  - Booking payment via Khalti
- Marketplace:
  - Product listing and management
  - Cart and order flows
  - Order payment via Khalti
- Pet adoption:
  - Adoption listings
  - Adoption applications and admin moderation
- Lost and found:
  - Public lost/found posts
  - Geolocation support and filtering
- Messaging:
  - Conversations
  - Real-time message delivery
  - Typing indicators and read status
- Notification center:
  - In-app feed
  - Unread counters
  - Push token registration
- Admin and provider dashboards and analytics screens
- PWA manifest + service worker support for notification handling and static asset caching

## Architecture

High-level flow:

1. Next.js frontend calls REST APIs on Express backend.
2. Backend persists data in MongoDB (Mongoose models).
3. Real-time events are delivered through Socket.IO with JWT socket auth.
4. Images are uploaded to Cloudinary.
5. Push notifications use Firebase Admin (backend) and Firebase Web SDK (frontend).
6. Email notifications are sent through Resend.
7. Reminder scheduler runs cron jobs for due reminder processing.

## Tech Stack

### Backend (`backend/`)

- Node.js (ESM)
- Express `5.1.0`
- MongoDB + Mongoose `9.0.2`
- Socket.IO `4.8.3`
- Passport OAuth strategies:
  - Google
  - Facebook
  - GitHub
- JWT (`jsonwebtoken`) + bcrypt (`bcryptjs`)
- Session store: `express-session` + `connect-mongo`
- Cloudinary + Multer (memory storage)
- Firebase Admin SDK
- Resend email API
- Khalti payment integration
- node-cron scheduler

### Frontend (`frontend/`)

- Next.js `16.2.2` (App Router)
- React `19.2.3`
- TypeScript `5`
- Tailwind CSS `4`
- Framer Motion
- React Hook Form + Zod
- Leaflet + React-Leaflet
- Socket.IO client
- Firebase Web SDK (messaging)
- react-hot-toast, lucide-react, react-icons

## Repository Structure

```text
PurrfectCare/
├─ backend/
│  ├─ package.json
│  └─ src/
│     ├─ app.js
│     ├─ config/
│     ├─ constants/
│     ├─ controllers/
│     ├─ jobs/
│     ├─ middlewares/
│     ├─ models/
│     ├─ routes/
│     ├─ services/
│     └─ utils/
├─ frontend/
│  ├─ package.json
│  ├─ public/
│  └─ src/
│     ├─ app/
│     ├─ components/
│     ├─ context/
│     └─ lib/
└─ README.md
```

## Getting Started Locally

## 1) Prerequisites

- Node.js 20+ recommended
- npm
- MongoDB instance (local or cloud)
- Accounts/keys for optional integrations:
  - Cloudinary
  - Firebase (for push)
  - Resend (for email)
  - Khalti (for payments)
  - OAuth providers (Google/Facebook/GitHub)

## 2) Configure Backend

```bash
cd backend
npm install
```

Create `.env` from `backend/.env.example` and fill values.

If you want push notifications, ensure Firebase Admin credentials file exists at:

- local: `backend/src/config/serviceAccountKey.json`
- Render: `/etc/secrets/serviceAccountKey.json` with `RENDER` env set

## 3) Configure Frontend

```bash
cd frontend
npm install
```

Create `.env.local` from `frontend/.env.local.example`.

At minimum, set:

- `NEXT_PUBLIC_API_URL=http://localhost:5000`

For push notifications, also set Firebase public keys (see Environment Variables section).

## 4) Run in Development

Start backend:

```bash
cd backend
npm run dev
```

Start frontend:

```bash
cd frontend
npm run dev
```

Default URLs:

- Frontend: `http://localhost:3000`
- Backend: `http://localhost:5000` (recommended to match frontend default)

## Environment Variables

### Backend (`backend/.env`)

From code and `backend/.env.example`.

| Variable                | Required        | Purpose                                                     |
| ----------------------- | --------------- | ----------------------------------------------------------- |
| `NAME`                  | No              | App name returned by root endpoint                          |
| `PORT`                  | Yes (practical) | Backend server port                                         |
| `VERSION`               | No              | App version returned by root endpoint                       |
| `NODE_ENV`              | Yes             | Environment behavior (cookies, logs)                        |
| `JWT_SECRET`            | Yes             | JWT signing/verification secret                             |
| `SESSION_SECRET`        | Yes             | Session cookie secret                                       |
| `MONGODB_URL`           | Yes             | MongoDB connection string                                   |
| `APP_URL`               | Yes (for links) | Public app/backend URL used in links                        |
| `EMAIL_API_KEY`         | Optional        | Resend API key for email notifications                      |
| `CLOUDINARY_CLOUD_NAME` | Optional        | Cloudinary account name                                     |
| `CLOUDINARY_API_KEY`    | Optional        | Cloudinary API key                                          |
| `CLOUDINARY_API_SECRET` | Optional        | Cloudinary API secret                                       |
| `KHALTI_API_KEY`        | Optional        | Khalti API key                                              |
| `KHALTI_API_URL`        | Optional        | Khalti API endpoint                                         |
| `KHALTI_RETURN_URL`     | Optional        | Khalti callback return URL                                  |
| `GOOGLE_CLIENT_ID`      | Optional        | Google OAuth app ID                                         |
| `GOOGLE_CLIENT_SECRET`  | Optional        | Google OAuth secret                                         |
| `GOOGLE_CALLBACK_URL`   | Optional        | Google OAuth callback URL                                   |
| `FACEBOOK_APP_ID`       | Optional        | Facebook OAuth app ID                                       |
| `FACEBOOK_APP_SECRET`   | Optional        | Facebook OAuth secret                                       |
| `FACEBOOK_CALLBACK_URL` | Optional        | Facebook OAuth callback URL                                 |
| `GITHUB_CLIENT_ID`      | Optional        | GitHub OAuth app ID                                         |
| `GITHUB_CLIENT_SECRET`  | Optional        | GitHub OAuth secret                                         |
| `GITHUB_CALLBACK_URL`   | Optional        | GitHub OAuth callback URL                                   |
| `FRONTEND_URL`          | Yes             | Primary frontend origin for redirects/CORS                  |
| `CORS_ALLOWED_ORIGINS`  | Optional        | Extra comma-separated CORS origins                          |
| `RENDER`                | Optional        | Switches Firebase credential path to Render secret location |

### Frontend (`frontend/.env.local`)

From `frontend/.env.local.example` and source usage.

| Variable                                   | Required                                        | Purpose                  |
| ------------------------------------------ | ----------------------------------------------- | ------------------------ |
| `NEXT_PUBLIC_API_URL`                      | Yes (production), recommended locally           | Base URL for backend API |
| `NEXT_PUBLIC_FIREBASE_API_KEY`             | Optional (required for FCM flow)                | Firebase web config      |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`         | Optional (required for FCM flow)                | Firebase web config      |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID`          | Optional (required for FCM flow)                | Firebase web config      |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`      | Optional (required for FCM flow)                | Firebase web config      |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Optional (required for FCM flow)                | Firebase web config      |
| `NEXT_PUBLIC_FIREBASE_APP_ID`              | Optional (required for FCM flow)                | Firebase web config      |
| `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID`      | Optional                                        | Firebase web config      |
| `NEXT_PUBLIC_FIREBASE_VAPID_KEY`           | Optional (required for push token registration) | Browser push VAPID key   |

Note: `frontend/.env.local.example` currently documents `NEXT_PUBLIC_API_URL` but does not include all Firebase keys. Add them manually if enabling push notifications.

## API Surface Overview

Base route groups mounted in backend:

| Base Path                    | Description                                                              |
| ---------------------------- | ------------------------------------------------------------------------ |
| `/`                          | Backend metadata                                                         |
| `/healthz`                   | Health check endpoint                                                    |
| `/api/auth`                  | Registration, login, email verification, password reset, logout, auth me |
| `/api/users`                 | User profile CRUD + onboarding                                           |
| `/api/pets`                  | Pet CRUD, stats, photo management, soft-delete/restore                   |
| `/api/health`                | Health overview across all pets                                          |
| `/api/pets/:petId/health/*`  | Pet health nested domain routes                                          |
| `/api/reminders`             | User-level reminders + stats                                             |
| `/api/products`              | Public product browsing + admin product management                       |
| `/api/cart`                  | Cart operations                                                          |
| `/api/orders`                | Order lifecycle + Khalti payment                                         |
| `/api/admin`                 | Provider/admin application workflows + platform analytics                |
| `/api/adoption/listings`     | Adoption listing CRUD/public read                                        |
| `/api/adoption/applications` | Adoption application workflow                                            |
| `/api/conversations`         | Messaging conversations + messages                                       |
| `/api/notifications`         | Notification feed + read state + FCM token registration                  |
| `/api/map`                   | Provider/adoption/lost-found location endpoints                          |
| `/api/service-providers`     | Provider directory, profile, analytics, merchant order updates           |
| `/api/bookings`              | Booking lifecycle + Khalti booking payment                               |
| `/api/lost-found`            | Lost/found post management and discovery                                 |

Nested pet health modules under `/api/pets/:petId/health` include:

- `vaccinations`
- `medical-records`
- `care-logs`
- `reminders`

## Real-Time, Notifications, and Scheduling

### Socket.IO events (backend + frontend)

- `message:send`
- `message:new`
- `typing:start`
- `typing:stop`
- `conversation:read`
- `notification:new`

### Notification channels

1. In-app notifications stored in `Notification` model and emitted over Socket.IO.
2. Push notifications sent through Firebase Admin to registered FCM tokens.
3. Email reminders sent via Resend templates.

### Reminder scheduler

`backend/src/jobs/reminderScheduler.js`:

- Every minute: process due reminders (in-app/push + email)
- Every 15 minutes: reactivate snoozed reminders

## Roles and Access

Defined roles:

- `USER`
- `PET_OWNER`
- `ADMIN`
- `SUPER_ADMIN`

Role and verification enforcement is handled via middleware:

- `auth`
- `requireVerified`
- `requireRole(...)`

Typical patterns:

- Public reads for selected endpoints (e.g., product/provider/discovery routes)
- Auth required for account-linked data
- Verified email required for state-changing actions
- `ADMIN`/`SUPER_ADMIN` required for provider/admin workflows

## Scripts

### Backend

```bash
npm start      # node src/app.js
npm run dev    # nodemon src/app.js
```

### Frontend

```bash
npm run dev    # next dev
npm run build  # next build
npm start      # next start
npm run lint   # eslint
```

## Deployment Notes and Gotchas

1. CORS behavior
   - Backend CORS allows several hardcoded origins plus `FRONTEND_URL` and `CORS_ALLOWED_ORIGINS`.
   - If deploying to a new domain, update env vars accordingly.

2. Cookie behavior in production
   - Cookies use `secure: true` and `sameSite: none` in production.
   - HTTPS is required for cross-site cookie behavior.

3. OAuth callback alignment
   - Provider callback URLs must exactly match your deployment backend callback routes.
   - Keep OAuth app console config in sync with env callback values.

4. Firebase Admin credential path
   - Local: `src/config/serviceAccountKey.json`
   - Render: `/etc/secrets/serviceAccountKey.json` when `RENDER` is set

5. Frontend API URL
   - In production, `NEXT_PUBLIC_API_URL` must be set.
   - If missing in non-development mode, frontend API client throws an error.

6. Khalti integration
   - Ensure `KHALTI_RETURN_URL` and gateway configuration match your deployed URLs.

## Current Testing State

- Backend `package.json` currently has a placeholder `test` script (`"Error: no test specified"`).
- Frontend includes linting via `npm run lint`.
- No root-level CI pipeline is defined in this repo structure.

---

Author: Prince Shrestha
Email: princeshrestha.euphoric@gmail.com
