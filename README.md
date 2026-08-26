# EventHub — Full-Stack Event Planning Application

A production-grade, full-stack event planning web application built according to the Technical Assessment specifications. The project features secure JWT + 2FA authentication, complete event CRUD lifecycle, category & tag classification, RSVP management with attendee statistics, server-side search, filtering, and pagination, structured logging, Knex.js query builder (strictly no ORMs), MySQL database with Docker Compose, interactive Swagger API documentation, unit test suites, and solutions for the Bonus SQL Analytics challenge.

---

## 🌟 Key Features

### 1. Event Management

- **Create Events**: Rich inputs for title, description, start/end dates, location, max capacity, banner cover image, and category tags.
- **Edit & Delete Events**: Protected by creator-only authorization checks.
- **Browse & Filter**: Separate views for **Upcoming** and **Past** events.
- **Event Privacy**: Support for **Public** (open to all) and **Private** (exclusive to signed-in community members) events.
- **Search & Sorting**: Instant server-side search across title, description, or venue location; sorting by Date, RSVP Popularity, or Creation Time.
- **Event Details View**: Deep-dive page with date countdown, interactive Google Maps link, creator profile, full description, and attendee list.

### 2. Tags & Categories

- Multi-tag assignment for events (e.g. `Conference`, `Workshop`, `Meetup`, `Birthday`, `Tech`, `Design`).
- Dynamic custom tag creation directly from event creation modals.
- Filter events by clicking tag chips with active counts.

### 3. Authentication & Authorization

- **JWT Authentication**: Short-lived access tokens with secure refresh token rotation in database.
- **Two-Factor Authentication (2FA)**: Time-based One-Time Password (TOTP) compatible with Google Authenticator, Authy, and 1Password with QR code setup.
- **Email Verification Flow**: Tokenized email confirmation endpoint and UI badge.
- **Creator Authorization**: Strict backend and frontend ownership validation so only the creator can edit or delete an event.

### 4. Interactive RSVP System

- **RSVP Options**: Users can respond with **Going (Yes)**, **Interested (Maybe)**, or **Can't Go (No)**.
- **Capacity Limits**: Real-time enforcement prevents excess "Yes" RSVPs when an event reaches maximum capacity while allowing "Maybe" responses.
- **Live Attendee Tracking**: Real-time attendee counter and attendee avatar list with response statuses.
- **My RSVPs Dashboard**: Dedicated dashboard tab tracking all events the user has RSVP'd to.

### 5. Bonus Section: Employee Designation & Allocation SQL Analytics

- Integrated database queries and interactive frontend runner for **Q1**, **Q2**, and **Q4** answering the employee designation timeline challenge using window functions (`ROW_NUMBER()`, `LAG()`, `LEAD()`, correlated subqueries, and edge-case handling).

---

## 🛠️ Technology Stack

| Layer                | Technology                                 | Rationale                                                                                              |
| :------------------- | :----------------------------------------- | :----------------------------------------------------------------------------------------------------- |
| **Frontend**         | **React 18 + TypeScript (Vite)**           | High-performance build tooling, strict type safety, responsive UI, component reusability.              |
| **Styling**          | **Tailwind CSS + CSS Design System**       | Curated palette, dark/light theme support, glassmorphism, responsive micro-animations.                 |
| **Backend**          | **Node.js + Express with TypeScript**      | Robust RESTful API architecture, modular service/controller layers, typed middleware.                  |
| **Query Builder**    | **Knex.js (No ORMs)**                      | Direct SQL query control, transaction management, migration scripts, and seeders without ORM overhead. |
| **Database**         | **MySQL 8.0**                              | Normalized 3NF relational database schema with foreign key integrity and indexes.                      |
| **Containerization** | **Docker Compose**                         | One-command local database service provisioning with persistent volumes and healthchecks.              |
| **Validation**       | **Zod**                                    | Type-safe schema validation on both incoming request payloads and query filters.                       |
| **Security**         | **JWT, bcryptjs, Speakeasy, Helmet, CORS** | Salted password hashing, TOTP 2FA, HTTP-only refresh tokens, secure response headers.                  |
| **Logging**          | **Winston + Morgan**                       | Multi-transport structured JSON logger (error logs, combined logs, colored console output).            |
| **API Docs**         | **Swagger UI / OpenAPI 3.0**               | Interactive interactive documentation accessible live at `/api-docs`.                                  |
| **Testing**          | **Jest + Supertest + Vitest**              | Automated backend unit/integration tests and frontend component tests.                                 |

---

## 📐 Normalized Database Schema Design

The relational database adheres strictly to Third Normal Form (3NF):

```
users (id, name, email, password_hash, is_email_verified, two_factor_enabled, two_factor_secret, avatar_url, created_at, updated_at)
  │
  ├──< events (id, creator_id [FK->users.id], title, description, location, event_type, start_time, end_time, capacity, banner_url, created_at, updated_at)
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

- **Node.js**: v18+ (tested on Node v24)
- **npm**: v9+
- **Docker & Docker Compose** (for running MySQL container)

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

### Step 2: Start MySQL Database via Docker Compose

```bash
# Start MySQL 8 container in background
docker compose up -d

# Verify container is healthy
docker compose ps
```

_Note: The MySQL container is configured on port `3306` with database `event_planner_db`, user `eventuser`, and password `eventpassword`._

---

### Step 3: Run Database Migrations & Seed Sample Data

```bash
# Run Knex migrations (creates all tables including bonus tables)
npm run migrate

# Seed database with initial users, upcoming/past events, tags, RSVPs, and bonus dataset
npm run seed
```

---

### Step 4: Start the Development Servers

```bash
# Start both Backend API (:5000) and Frontend Vite (:5173) concurrently:
npm run dev
```

- **Frontend Application**: [http://localhost:5173](http://localhost:5173)
- **Backend API Base**: [http://localhost:5000/api/v1](http://localhost:5000/api/v1)
- **Interactive Swagger Docs**: [http://localhost:5000/api-docs](http://localhost:5000/api-docs)

---

### Demo Accounts for Instant Testing

| Account               | Email               | Password       | Role                    |
| :-------------------- | :------------------ | :------------- | :---------------------- |
| **Alice (Organizer)** | `alice@example.com` | `Password123!` | Event Host & Creator    |
| **Bob (Attendee)**    | `bob@example.com`   | `Password123!` | Active Community Member |
| **Carol (New User)**  | `carol@example.com` | `Password123!` | Unverified User         |

_(Quick one-click login buttons are also built directly into the login screen!)_

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

## 📚 API Documentation (Swagger / OpenAPI)

Interactive documentation is served at [http://localhost:5000/api-docs](http://localhost:5000/api-docs).

### Key Endpoints:

- `POST /api/v1/auth/register` — Register a new user account
- `POST /api/v1/auth/login` — Sign in and obtain access + refresh tokens (supports 2FA challenge)
- `POST /api/v1/auth/refresh-token` — Rotate and obtain fresh access token
- `POST /api/v1/2fa/setup` — Generate TOTP secret and QR code Data URL
- `POST /api/v1/2fa/enable` — Verify 6-digit TOTP code and enable 2FA
- `GET /api/v1/events` — List events with server-side pagination, search, tag filters, and timeframe
- `GET /api/v1/events/:id` — Get full event details, creator, tags, and attendee breakdown
- `POST /api/v1/events` — Create new event (authenticated)
- `PUT /api/v1/events/:id` — Update event (creator authorization required)
- `DELETE /api/v1/events/:id` — Delete event (creator authorization required)
- `POST /api/v1/rsvps/events/:id` — Set RSVP status (`yes`, `no`, `maybe`)
- `GET /api/v1/bonus/q1` — Execute Q1 SQL query
- `GET /api/v1/bonus/q2` — Execute Q2 SQL query
- `GET /api/v1/bonus/q4` — Execute Q4 SQL query

---

## 💡 Engineering Decisions & Architecture Rationale

1. **Knex.js Query Builder over ORMs**:
   - Strictly followed the assessment requirement avoiding heavyweight ORMs (TypeORM, Prisma). Knex gives explicit query visibility, avoids N+1 query traps through clean multi-join and subquery strategies, and facilitates deterministic migration and seed scripts.
2. **Short-Lived JWT + Refresh Token Rotation**:
   - Access tokens expire in 15 minutes to minimize exposure in case of client-side compromise. Refresh tokens are hashed and persisted with expiration dates in the database, allowing immediate token revocation on logout.
3. **TOTP Two-Factor Authentication**:
   - Utilizes standard RFC 6238 TOTP algorithms via `speakeasy` and `qrcode`, making it universally compatible with Google Authenticator, Authy, and iOS Keychain.
4. **Zod Validation & Centralized Error Formatting**:
   - Standardized error schema (`{ success: false, error: { message, code, details } }`) provides predictable frontend error handling and inline form validation feedback.
5. **Database Indexing Strategy**:
   - Created composite indexes on `(emp_id, effective_date)` for designation queries, foreign keys (`creator_id`, `event_id`, `tag_id`, `user_id`), and filter columns (`start_time`, `event_type`) to optimize large-scale query performance.

---

## 📋 Assumptions Made During Development

1. **Private Event Access**:
   - Public events are discoverable by unauthenticated guests. Private events are visible to registered and signed-in members of the application.
2. **RSVP Capacity Enforcement**:
   - When an event reaches maximum capacity, further `yes` (Going) RSVPs are restricted with an informative message, while users can still indicate `maybe` (Interested).
3. **Tie-Breaking in Designation Logs**:
   - If an employee has multiple designation changes on the same `effective_date`, `txn_id DESC` is utilized as the tie-breaker to determine the latest transaction.
4. **Allocations Without Prior Designation**:
   - If a project allocation start date precedes any recorded designation in `emp_designation_log`, a `LEFT JOIN` preserves the allocation row and outputs `NULL` for `designation_at_allocation`.
