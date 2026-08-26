# EventHub — Full-Stack Event Planning Application

A production-grade, full-stack event planning web application built according to the Technical Assessment specifications. The project features secure JWT + 2FA authentication, complete event CRUD lifecycle, category & tag classification, RSVP management with real-time capacity enforcement, server-side search, filtering, and pagination, structured logging, Knex.js query builder (**strictly no ORMs**), MySQL database with Docker Compose, interactive Swagger API documentation, unit test suites, and solutions for the Bonus SQL Analytics challenge.

---

## 🌟 Key Features

### 1. Event Management
- **Create Events**: Rich inputs for title, description, start/end dates, location, max capacity, banner cover image, and category tags.
- **Edit & Delete Events**: Protected by creator-only authorization checks with real-time validation.
- **Browse & Filter**: Dedicated views for **Upcoming** and **Past** events.
- **Event Privacy**: Support for **Public** (open to everyone) and **Private** (exclusive to signed-in community members) events.
- **Search & Sorting**: Instant server-side search across title, description, or venue location; sorting by Date (`start_time`), RSVP Popularity (`rsvp_count`), or Recently Created (`created_at`).
- **Event Details View**: Deep-dive page with date countdown, interactive Google Maps link, creator profile, full description, capacity indicator, and live attendee list.

### 2. Tags & Categories
- **Multi-tag Assignment**: Assign multiple tags to events (e.g. `Conference`, `Workshop`, `Meetup`, `Birthday`, `Tech`, `Design`, `Networking`).
- **Dynamic Custom Tag Creation**: Create custom tags with unique color hex codes directly from the event creation modal.
- **Interactive Tag Filtering**: Filter events by clicking tag chips with active counts.

### 3. Authentication & Security
- **JWT Authentication**: Short-lived access tokens (15m) with secure refresh token rotation in database (7d).
- **Two-Factor Authentication (2FA)**: Time-based One-Time Password (TOTP) compatible with Google Authenticator, Authy, and 1Password with QR code setup.
- **Email Verification Flow**: Tokenized email confirmation endpoint and UI verification badge.
- **Creator Authorization**: Strict backend and frontend ownership validation so only the creator can edit or delete an event.
- **Security Headers & Hashing**: Salted password hashing via `bcryptjs` (10 rounds), Helmet security headers, CORS origin whitelisting, and rate limiting.

### 4. Interactive RSVP System
- **RSVP Options**: Users can respond with **Going (Yes)**, **Interested (Maybe)**, or **Can't Go (No)**.
- **Capacity Limits**: Real-time enforcement prevents excess "Yes" RSVPs when an event reaches maximum capacity while still allowing "Maybe" responses.
- **Live Attendee Tracking**: Real-time attendee counter and attendee avatar list with response statuses.
- **My Events & RSVPs Dashboard**: Dedicated dashboard tab tracking all events created by the user and all events the user has RSVP'd to.
- **Celebration Effects**: Interactive confetti animation on confirmed RSVPs.

### 5. Bonus Section: Employee Designation & Allocation SQL Analytics
- **Integrated SQL Analytics Runner**: Interactive playground for **Q1**, **Q2**, and **Q4** executing against the live MySQL dataset.
- **Window Functions**: Implementation of `ROW_NUMBER()`, `LAG()`, `LEAD()`, correlated subqueries, and deterministic tie-breaking.
- **In-App Modal Viewers**: View the full 167-line SQL script and markdown answers guide directly inside the application with one-click copy and download options.

---

## 🛠️ Technology Stack

| Layer | Technology | Rationale |
| :--- | :--- | :--- |
| **Frontend** | **React 18 + TypeScript (Vite)** | High-performance build tooling, strict type safety, responsive UI, component reusability. |
| **Styling** | **Tailwind CSS + CSS Design System** | Curated palette, dark/light theme support, glassmorphism, responsive micro-animations. |
| **Backend** | **Node.js + Express with TypeScript** | Robust RESTful API architecture, modular service/controller layers, typed middleware. |
| **Query Builder** | **Knex.js (Strictly No ORMs)** | Direct SQL query control, transaction management, migration scripts, and seeders without ORM overhead. |
| **Database** | **MySQL 8.0** | Normalized 3NF relational database schema with foreign key integrity and indexes. |
| **Containerization** | **Docker Compose** | One-command local database service provisioning with persistent volumes and healthchecks. |
| **Validation** | **Zod** | Type-safe schema validation on both incoming request payloads and query filters. |
| **Security** | **JWT, bcryptjs, Speakeasy, Helmet, CORS** | Salted password hashing, TOTP 2FA, HTTP-only refresh tokens, secure response headers. |
| **Logging** | **Winston + Morgan** | Multi-transport structured JSON logger (error logs, combined logs, colored console output). |
| **API Docs** | **Swagger UI / OpenAPI 3.0** | Interactive documentation accessible live at `/api-docs`. |
| **Testing** | **Jest + Supertest + Vitest** | Automated backend integration tests and frontend component unit tests. |

---

## 📐 Normalized Database Schema Design

The relational database adheres strictly to Third Normal Form (3NF):

```
users (id, name, email, password_hash, is_email_verified, two_factor_enabled, two_factor_secret, avatar_url, created_at, updated_at)
  │
  ├──< events (id, creator_id [FK->users.id], title, description, location, event_type, is_true_private, start_time, end_time, capacity, banner_url, created_at, updated_at)
  │      │
  │      ├──< event_tags (id, event_id [FK->events.id], tag_id [FK->tags.id]) >── tags (id, name, color_hex, created_at)
  │      │
  │      └──< rsvps (id, event_id [FK->events.id], user_id [FK->users.id], status, created_at, updated_at)
  │
  └──< refresh_tokens (id, user_id [FK->users.id], token_hash, expires_at, is_revoked, created_at)

Bonus Challenge Tables:
emp_designation_log (txn_id [PK], emp_id, emp_name, designation, effective_date)
emp_allocation_log (allocation_id [PK], emp_id, project_name, allocated_role, allocation_start, allocation_end)
```

---

## 🚀 Setup & Local Execution Instructions

### Prerequisites
- **Node.js**: v18+ (tested on Node v20/v22/v24)
- **npm**: v9+
- **Docker & Docker Compose** (for running the MySQL container)

---

### Step 1: Clone Repository & Install Dependencies

```bash
# Clone the repository
git clone <repo_url>
cd lf_assessment

# Install dependencies across root, backend, and frontend
npm run install:all
```

---

### Step 2: Configure Environment Variables

Create the backend environment configuration file from the example template:

```bash
# Copy example env file
cp backend/.env.example backend/.env
```

*Default environment variables configured in `backend/.env`:*
```env
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173

DB_CLIENT=mysql2
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=eventuser
DB_PASSWORD=eventpassword
DB_NAME=event_planner_db

JWT_SECRET=super-secret-jwt-access-token-key-32-chars-long
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_SECRET=super-secret-jwt-refresh-token-key-32-chars-long
REFRESH_TOKEN_EXPIRES_IN=7d
COOKIE_SECRET=super-secret-cookie-signing-key
```

---

### Step 3: Start MySQL Database via Docker Compose

```bash
# Start MySQL 8 container in background
docker compose up -d

# Verify container status is healthy
docker compose ps
```

*Note: The MySQL container is mapped to port `3306` with database `event_planner_db`, user `eventuser`, and password `eventpassword`.*

---

### Step 4: Run Database Migrations & Seed Sample Data

```bash
# Run Knex migrations (creates all 8 tables including bonus tables)
npm run migrate

# Seed database with users, upcoming/past events, tags, RSVPs, and bonus dataset
npm run seed
```

---

### Step 5: Start the Development Servers

```bash
# Start both Backend API (:5000) and Frontend Vite (:5173) concurrently:
npm run dev
```

Alternatively, you can run them in separate terminals:
```bash
# Terminal 1: Backend
npm run dev:backend

# Terminal 2: Frontend
npm run dev:frontend
```

---

### 🌐 Accessing the Application

- **Frontend Application**: [http://localhost:5173](http://localhost:5173)
- **Backend API Base**: [http://localhost:5000/api/v1](http://localhost:5000/api/v1)
- **Interactive Swagger Documentation**: [http://localhost:5000/api-docs](http://localhost:5000/api-docs)

---

### 👥 Pre-seeded Demo Accounts for Instant Testing

| Account | Email | Password | Role / Access |
| :--- | :--- | :--- | :--- |
| **Alice (Organizer)** | `alice@example.com` | `Password123!` | Event Host & Creator (Verified) |
| **Bob (Attendee)** | `bob@example.com` | `Password123!` | Active Community Member (Verified) |
| **Carol (New User)** | `carol@example.com` | `Password123!` | Unverified User |

*(Quick one-click demo login buttons are also available directly on the login screen for instant evaluation.)*

---

## 🧪 Running Automated Test Suites

```bash
# Run all backend and frontend test suites
npm test

# Run backend integration tests only (Jest + Supertest)
npm run test:backend

# Run frontend unit tests only (Vitest)
npm run test:frontend
```

---

## 📚 API Documentation (Swagger / OpenAPI 3.0)

Interactive documentation is served live at [http://localhost:5000/api-docs](http://localhost:5000/api-docs).

### Key Endpoints:

#### Authentication & Profile
- `POST /api/v1/auth/register` — Register a new user account
- `POST /api/v1/auth/login` — Sign in and obtain access + refresh tokens (supports 2FA challenge)
- `POST /api/v1/auth/refresh-token` — Rotate and obtain fresh access token
- `POST /api/v1/auth/logout` — Revoke active refresh token and clear auth session
- `GET /api/v1/auth/profile` — Get current user profile (authenticated)
- `POST /api/v1/auth/verify-email` — Verify user email address with token
- `POST /api/v1/auth/request-verification` — Send new email verification token

#### Two-Factor Authentication (2FA)
- `POST /api/v1/2fa/setup` — Generate TOTP secret and QR code Data URL
- `POST /api/v1/2fa/enable` — Verify 6-digit TOTP code and enable 2FA
- `POST /api/v1/2fa/disable` — Verify 6-digit TOTP code and disable 2FA

#### Events & Categories
- `GET /api/v1/events` — List events with server-side pagination, search, tag filters, and timeframe
- `GET /api/v1/events/metrics` — Aggregate metrics (total events, upcoming, past, total RSVPs)
- `GET /api/v1/events/:id` — Get full event details, creator, tags, and attendee breakdown
- `POST /api/v1/events` — Create new event (authenticated)
- `PUT /api/v1/events/:id` — Update event (creator authorization required)
- `DELETE /api/v1/events/:id` — Delete event (creator authorization required)
- `GET /api/v1/tags` — List all available tags with usage counts
- `POST /api/v1/tags` — Create a new custom tag with color

#### RSVPs & Attendees
- `GET /api/v1/events/:id/attendees` — List all attendee avatars and RSVP responses for an event
- `POST /api/v1/events/:id/rsvps` — Set user RSVP status (`yes`, `maybe`, `no`)
- `GET /api/v1/rsvps/me` — Get all events the authenticated user has RSVP'd to

#### Bonus Challenge SQL Analytics
- `GET /api/v1/bonus/data` — Fetch raw dataset from `emp_designation_log` and `emp_allocation_log`
- `GET /api/v1/bonus/q1` — Execute Q1 SQL query (Current Designation per employee)
- `GET /api/v1/bonus/q2` — Execute Q2 SQL query (Timeline with `LAG` and `LEAD`)
- `GET /api/v1/bonus/q4` — Execute Q4 SQL query (Active Designation at Allocation Start)

---

## 💡 Engineering Decisions & Architecture Rationale

1. **Knex.js Query Builder over ORMs**:
   - Strictly followed the assessment requirement avoiding heavyweight ORMs (TypeORM, Prisma). Knex gives explicit query visibility, avoids N+1 query traps through clean multi-join and subquery strategies, and facilitates deterministic migration and seed scripts.
2. **Short-Lived JWT + Refresh Token Rotation in Database**:
   - Access tokens expire in 15 minutes to minimize exposure in case of client-side compromise. Refresh tokens are cryptographically hashed and persisted with expiration dates in the database, allowing immediate token revocation on logout and preventing replay attacks.
3. **RFC 6238 TOTP Two-Factor Authentication**:
   - Utilizes standard RFC 6238 TOTP algorithms via `speakeasy` and `qrcode`, making it universally compatible with Google Authenticator, Authy, and iOS Keychain. When 2FA is enabled, the login endpoint responds with a secure temporary challenge token requiring 6-digit TOTP verification before issuing session tokens.
4. **Zod Validation & Centralized Error Formatting**:
   - Standardized error schema (`{ success: false, error: { message, code, details } }`) provides predictable frontend error handling and inline form validation feedback for both body payloads and query parameters.
5. **Database Indexing & Normalization (3NF)**:
   - Created composite indexes on `(emp_id, effective_date)` for designation queries, foreign keys (`creator_id`, `event_id`, `tag_id`, `user_id`), and filter columns (`start_time`, `event_type`, `is_true_private`) to optimize large-scale query performance.
6. **In-App Interactive Modal Viewers**:
   - Built dedicated in-app modal viewers for SQL code and markdown documentation to eliminate browser download flashes and deliver a seamless reading and code copying experience.

---

## 📋 Assumptions Made During Development

1. **Public vs. Private Event Access**:
   - Public events are discoverable by unauthenticated guests to maximize community engagement. Private events are visible only to registered and signed-in members of the application.
2. **RSVP Capacity Enforcement**:
   - When an event reaches maximum capacity (`capacity`), further **"Going" (Yes)** RSVPs are blocked with an informative message, while users can still indicate **"Interested" (Maybe)** or **"Can't Go" (No)**. Users who previously RSVP'd "Yes" are always permitted to update or cancel their response.
3. **Past Event Policy**:
   - Past events remain searchable and visible for historical reference, but attendee lists and past details are preserved as immutable archive records.
4. **Tie-Breaking in Designation Logs (Bonus Q1 & Q4)**:
   - If an employee has multiple designation changes recorded on the exact same `effective_date`, `txn_id DESC` is utilized as the deterministic tie-breaker representing the latest system transaction.
5. **Project Allocations Preceding Recorded Designation (Bonus Q4)**:
   - If a project allocation start date precedes any recorded designation in `emp_designation_log`, a `LEFT JOIN` preserves the allocation row without data loss, returning `NULL` for `designation_at_allocation` and looking up `emp_name` via subquery.
6. **2FA Enrollment Flow**:
   - 2FA is optional on user registration. Users can enroll and enable 2FA anytime from their profile page by scanning a generated QR code and confirming a valid TOTP code.
