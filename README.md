# Conceps Media — Social Media Content Approval System

An enterprise-grade, full-stack content workflow and approval management platform tailored for media agencies. The system enforces strict multi-role governance (Admin, Creator, Reviewer), deterministic finite-state workflow transitions, optimistic concurrency locking, 2-hour scheduling conflict detection, platform-specific caption limits, automated cron-driven publishing, and complete immutable audit trails.

---

## 🌟 Key Features Completed

- **Role-Based Access Control (RBAC)**:
  - **ADMIN**: Manage client brands, manage system users, and assign reviewers to specific client brands.
  - **CREATOR**: Draft and edit social posts, submit posts for review. Restricted to editing only their own posts, and only while in `DRAFT` or `CHANGES_REQUESTED` status.
  - **REVIEWER**: Scoped to view and review posts *strictly* for clients assigned to them. Can approve posts or request revisions. Self-approval is strictly prevented.
- **Deterministic Post Status Workflow**:
  - `DRAFT` → `IN_REVIEW` → `APPROVED` → `SCHEDULED` → `PUBLISHED`
  - `IN_REVIEW` → `CHANGES_REQUESTED` → `IN_REVIEW`
  - Any illegal transition is rejected with `400 Bad Request`.
- **Mandatory Feedback Rules**: Requesting changes (`CHANGES_REQUESTED`) strictly requires a comment of at least 10 characters.
- **Self-Approval Protection**: A user can never approve their own post, even if they have Reviewer or Admin credentials.
- **Platform Character Limit Validation**: Enforced both on the NestJS backend and with a live UI counter and progress bar on the React frontend:
  - **X (Twitter)**: 280 characters
  - **Instagram**: 2,200 characters
  - **LinkedIn**: 3,000 characters
  - **Facebook**: 5,000 characters
- **2-Hour Scheduling Conflict Detection**: Prevents scheduling two posts for the same client on the same platform within a 2-hour window. Returns `409 Conflict` along with the ID of the conflicting post.
- **UTC Storage & IST Display**: All timestamps are validated as future times upon scheduling, persisted in UTC, and displayed in **Indian Standard Time (IST)** across the UI.
- **Optimistic Concurrency Control**: Every update and status transition validates the post's current `version`. Stale concurrent submissions are rejected with `409 Conflict` to prevent accidental overwrites.
- **Immutable Audit Logging**: Every state transition automatically creates an `AuditLog` entry documenting actor, initial status, target status, and timestamp.
- **Automated Publishing Background Job**: A NestJS `@Cron` scheduler runs every minute, finding past-due `SCHEDULED` posts and transitioning them to `PUBLISHED` with an automated `SYSTEM` audit log.
- **Interactive Kanban Board**: 6 columns representing each status stage with real-time client and platform filters.
- **Live Social Feed Preview**: Realistic feed mockup cards mimicking Instagram, Facebook, LinkedIn, and X feeds as copy is composed.
- **Interactive Discussion Thread & Visual Audit Timeline**: Complete chronological history and contextual reviewer feedback.
- **Separated Enterprise Date & Time Pickers**:
  - **Publication Date**: Dedicated upward-opening calendar picker with month/year navigation, weekday columns, disabled past dates, and quick presets (`Today`, `Tomorrow`, `+2 Days`, `Next Wk`).
  - **Publication Time (IST)**: Dedicated 12-hour time picker with AM/PM toggle, 5-minute intervals, and smart presets including **`+2h 15m (Safe)`** (instantly jumps beyond the 2-hour scheduling conflict window), `9:00 AM` (Morning), `1:00 PM` (Afternoon), `5:00 PM` (Evening), and `8:00 PM` (Prime Time).
  - Both components automatically compute safe ISO UTC timestamps for MongoDB persistence while displaying in Indian Standard Time (IST).
- **Pixel-Perfect Enterprise Toast Notification System**: Custom-styled toasts via Sonner featuring a 5px vertical accent stripe (red for errors, green for success, amber for warnings, brand blue for info) and an integrated, accessible soft-square close button on the right inside the card.
- **Brand-Aligned Enterprise Design**: Sleek modern UI built with Conceps Media's `#4f39f6` brand palette, split login portal layout with live client governance highlights, and zero-distraction cards.
- **Automated Unit Testing**: 20 unit tests covering workflow transitions, conflict detection, platform limits, self-approval prevention, and creator edit permissions.
- **OpenAPI / Swagger Documentation**: Available at `/api/docs`.

---

## 🛠️ Tech Stack

- **Backend (`be/`)**: NestJS 11, TypeScript, Mongoose 8 / MongoDB 7, Passport JWT, Bcrypt, Class-Validator, NestJS Schedule, NestJS Swagger.
- **Frontend (`fe/`)**: React 19, TypeScript, Vite 8, Tailwind CSS v4, React Router v7, Axios, Lucide React, Sonner (custom styled), Date-Fns.
- **Database**: MongoDB 7 with compound indexes for conflict queries: `{ client: 1, platform: 1, scheduledAt: 1 }`.

---

## 🚀 Setup & Installation

### Prerequisites
- Node.js (v18+ recommended)
- MongoDB 7 running locally or via Docker:
  ```bash
  docker run -d --name content-approval-mongo -p 27017:27017 mongo:7
  ```
  Or a remote MongoDB Atlas URI specified in `be/.env`.

---

### 1. Backend Setup (`be/`)

```bash
cd be

# 1. Install dependencies
npm install

# 2. Configure environment variables
# Copy .env.example to .env
cp .env.example .env

# 3. Seed Database (Creates 1 Admin, 2 Creators, 2 Reviewers, 4 Clients, 20 Posts)
npm run seed

# 4. Run automated unit tests
npm test

# 5. Start the backend development server
npm run start:dev
```
Backend will start on `http://localhost:3000` with Swagger documentation at `http://localhost:3000/api/docs`.

---

### 2. Frontend Setup (`fe/`)

```bash
cd fe

# 1. Install dependencies
npm install

# 2. Start the Vite development server
npm run dev
```
Frontend will be available at `http://localhost:5173`. Requests to `/api/*` are automatically proxied to the backend on port 3000.

---

## 🔐 Seed User Credentials

The database seeder (`npm run seed` in `be/`) populates the system with pre-configured accounts:

| Role | Name | Email | Password | Assigned Permissions |
| :--- | :--- | :--- | :--- | :--- |
| **ADMIN** | Karthik Subramaniam | `admin@concepsmedia.com` | `Admin@123` | Full access to users, clients, reviewer assignments, and all posts |
| **CREATOR 1** | Divya Natarajan | `creator1@concepsmedia.com` | `Creator@123` | Drafts & edits own posts; submits for review |
| **CREATOR 2** | Arun Prabhakaran | `creator2@concepsmedia.com` | `Creator@123` | Drafts & edits own posts; submits for review |
| **REVIEWER 1** | Meenakshi Raghunathan | `reviewer1@concepsmedia.com` | `Reviewer@123` | Reviews posts for **Kaveri Precision Engineering Pvt Ltd**, **Pampaana Aqua Systems Pvt Ltd** & **Sandpiper Coastal Hospitality Pvt Ltd** |
| **REVIEWER 2** | Sridhar Balasubramanian | `reviewer2@concepsmedia.com` | `Reviewer@123` | Reviews posts for **Kaveri Precision Engineering Pvt Ltd**, **Illam Digital Solutions Pvt Ltd** & **Sandpiper Coastal Hospitality Pvt Ltd** |

> **Note:** `npm run seed` wipes all five collections before repopulating them. Point `MONGODB_URI` at a development database only.

### Seeded client brands

The seeder creates four fictional Tamil Nadu–based client brands with fully populated approval workflows, review comments and audit trails across all six post statuses:

| Client brand | Base | Reviewers |
| :--- | :--- | :--- |
| **Kaveri Precision Engineering Pvt Ltd** | Coimbatore | Reviewer 1, Reviewer 2 |
| **Pampaana Aqua Systems Pvt Ltd** | Chennai | Reviewer 1 |
| **Illam Digital Solutions Pvt Ltd** | Chennai | Reviewer 2 |
| **Sandpiper Coastal Hospitality Pvt Ltd** | Mahabalipuram | Reviewer 1, Reviewer 2 |

The seeder self-validates before writing: it rejects any caption that exceeds its platform's character limit, mixes Latin and Tamil script, or any review action by a reviewer who is not assigned to that client.

> **Tip**: The login page provides quick one-click demo buttons to switch between Admin, Creator, and Reviewer accounts for instant evaluation.

---

## 🧪 Testing

Run backend unit tests:
```bash
cd be
npm test
```

### Test Coverage Highlights
- ✅ Valid status transitions (`DRAFT` → `IN_REVIEW`, `IN_REVIEW` → `APPROVED`, etc.)
- ✅ Rejection of invalid workflow jumps (`DRAFT` → `APPROVED`, `PUBLISHED` → `DRAFT`) with `400 Bad Request`
- ✅ Self-approval prevention (`400 Bad Request`)
- ✅ Reviewer client assignment enforcement (`403 Forbidden`)
- ✅ Rejection of `CHANGES_REQUESTED` without comment or comment < 10 characters (`400 Bad Request`)
- ✅ Optimistic locking version mismatch handling (`409 Conflict`)
- ✅ 2-hour scheduling conflict detection returning `409 Conflict` + conflicting post ID
- ✅ Rejection of past scheduled dates (`400 Bad Request`)
- ✅ Enforcement of platform character limits (X 280, Instagram 2200, LinkedIn 3000, Facebook 5000)
- ✅ Creator-only edit permissions in `DRAFT` and `CHANGES_REQUESTED`

---

## 📋 Environment Variables Reference

### Backend (`be/.env`)
```ini
PORT=3000
MONGODB_URI=mongodb://localhost:27017/content_approval_system
JWT_SECRET=conceps-media-content-approval-system-jwt-secret-key
JWT_EXPIRES_IN=24h
```

### Frontend (`fe/.env`)
```ini
VITE_API_BASE_URL=http://localhost:3000/api
```