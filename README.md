# EventHub — Full-Stack Event Planning & Community Platform

A production-grade, full-stack event planning and community web application built according to the Technical Assessment specifications. The platform features secure JWT + 2FA authentication, complete event CRUD lifecycle, category & tag classification, interactive RSVP management with capacity enforcement, server-side search, filtering, and pagination, structured logging, Knex.js query builder (**strictly no ORMs**), MySQL 8.0 database with Docker/Podman Compose, interactive Swagger API documentation, comprehensive test suites, and solutions for the Bonus SQL Analytics challenge.

---

## Table of Contents

- [Key Features](#key-features)
  - [1. Event Management Lifecycle](#1-event-management-lifecycle)
  - [2. Authentication, 2FA & Verification Security](#2-authentication-2fa--verification-security)
  - [3. Interactive RSVP System](#3-interactive-rsvp-system)
  - [4. Tag & Category Management System](#4-tag--category-management-system)
  - [5. Metrics & Analytics Drawer](#5-metrics--analytics-drawer)
  - [6. Bulk Operations & Management Dashboard](#6-bulk-operations--management-dashboard)
  - [7. Server-Side Pagination & URL State Synchronization](#7-server-side-pagination--url-state-synchronization)
  - [8. Theme Engine](#8-theme-engine)
  - [9. Bonus Challenge: SQL Analytics & Playground](#9-bonus-challenge-sql-analytics--playground)
- [Technology Stack](#technology-stack)
- [Normalized Database Schema Design (3NF)](#normalized-database-schema-design-3nf)
- [Setup & Local Execution Instructions](#setup--local-execution-instructions)
  - [Prerequisites](#prerequisites)
  - [Step 1: Clone Repository & Install Dependencies](#step-1-clone-repository--install-dependencies)
  - [Step 2: Configure Environment Variables](#step-2-configure-environment-variables)
  - [Step 3: Start MySQL Database via Docker/Podman Compose](#step-3-start-mysql-database-via-dockerpodman-compose)
  - [Step 4: Run Database Migrations & Seed Sample Data](#step-4-run-database-migrations--seed-sample-data)
  - [Step 5: Start the Application](#step-5-start-the-application)
  - [Accessing the Application](#accessing-the-application)
  - [Convenient Root NPM Scripts](#convenient-root-npm-scripts)
  - [Pre-seeded Demo Accounts for Testing](#pre-seeded-demo-accounts-for-testing)
- [Running Automated Test Suites](#running-automated-test-suites)
- [RESTful API Specification (OpenAPI 3.0 / Swagger)](#restful-api-specification-openapi-30--swagger)
  - [Authentication & Profile](#authentication--profile)
  - [Two-Factor Authentication (TOTP 2FA)](#two-factor-authentication-totp-2fa)
  - [Events Management](#events-management)
  - [Category & Tag Management](#category--tag-management)
  - [RSVPs & Attendance](#rsvps--attendance)
  - [Bonus Challenge SQL Analytics](#bonus-challenge-sql-analytics)
- [Engineering Decisions & Architecture Rationale](#engineering-decisions--architecture-rationale)
- [Assumptions & Business Logic Policies](#assumptions--business-logic-policies)

---

## Key Features

### 1. Event Management Lifecycle

- **Create & Publish Events**: Rich inputs for title, description, start/end dates with date-ordering validation, venue location, max capacity, banner cover images (with random Unsplash generator), and multi-tag categorization.
- **Event Privacy & Confidentiality Levels**:
  - **Public Events**: Discoverable by all visitors and guests.
  - **Private Events**: Visible in listings with confidential schedule/location indicators for signed-in members.
  - **True Private Events**: Restricted exclusively to verified community members with locked information cards and protected attendee rosters.
- **Edit & Delete Events**: Protected by creator-only authorization checks with real-time validation and confirmation dialogs.
- **Search, Sorting & Timeframe Filtering**:
  - Instant server-side search across title, description, and venue location with debounced input.
  - Dedicated timeframe navigation: **Upcoming** vs **Past** events.
  - Multi-criteria sorting: by **Date** (`start_time`), **RSVP Popularity** (`rsvp_count`), or **Recently Created** (`created_at`).
- **Deep-Dive Event Detail View**: Interactive schedule breakdown, external Google Maps navigation links, creator profile badge, full description, capacity indicator, and live attendee roster.

### 2. Authentication, 2FA & Verification Security

- **JWT Authentication & Token Rotation**: Short-lived access tokens (15m) with cryptographically hashed refresh tokens rotated and stored in the database (7d) for immediate revocation on logout.
- **Two-Factor Authentication (2FA)**: Standard RFC 6238 Time-based One-Time Password (TOTP) compatible with Google Authenticator, Authy, and 1Password with QR code setup and 6-digit challenge verification on login.
- **Email Verification Guard Flow**:
  - Tokenized email confirmation endpoint with single-use verification links.
  - Action Guards: Unverified users attempting to create events, RSVP ("Going", "Maybe", "No"), or access protected features are smoothly redirected to the Profile page with the **Email Verification Card** highlighted (`ring-4`, glowing shadow, pulsing action banner) and automatically scrolled into view.
  - In-app "Send Verification Link" / "Resend Verification Link" controls with immediate UI feedback.
- **Security Headers & Hashing**: Salted password hashing via `bcryptjs` (10 rounds), Helmet security headers, CORS origin whitelisting, and rate limiting.

### 3. Interactive RSVP System

- **RSVP Status Options**: Users can respond with **Going (Yes)**, **Interested (Maybe)**, or **Can't Go (No)**.
- **Capacity Limits Enforcement**: Real-time server and client enforcement prevents excess "Yes" RSVPs when an event reaches maximum capacity while continuing to allow "Maybe" and "No" responses.
- **Intent-Preserving Auto-RSVP**: When an unauthenticated visitor clicks an RSVP button, they are seamlessly redirected to login with their intended action preserved (`?auto_rsvp=yes`), automatically completing the RSVP upon successful authentication.
- **Live Attendee Tracking**: Filterable community attendee roster (All, Going, Maybe, No) with user avatars and response timestamps.
- **Celebration Feedback**: Interactive confetti animation on confirmed "Going" RSVPs.

### 4. Tag & Category Management System

- **Custom Color-Coded Tags**: Assign and create custom tags with hex color codes and curated color swatches.
- **Tag Usage Safety Checks**: Tag edit and delete dialogs (`TagEditModal`, `TagDeleteModal`) with live usage inspection (`/tags/:id/usage`) preventing accidental removal of active tags.
- **Overflow Tag Popover**: Clean badge rendering with expandable popover (`TagsPopover`) for events with numerous tags.
- **Duplicate Prevention**: Case-insensitive tag matching ensuring consistent category reuse.

### 5. Metrics & Analytics Drawer

- **Overview Stat Cards**: Dynamic counters for Total Events, Upcoming Events, Past Events, and Total RSVPs with count badges.
- **Interactive Sliding Analytics Drawer**: In-depth analytical breakdown featuring timeframe distribution, capacity utilization metrics, category frequency charts, and quick-filter navigation.

### 6. Bulk Operations & Management Dashboard

- **My Events & RSVPs Dashboard**: Dual-tab dashboard tracking all events created by the user and all events the user has RSVP'd to.
- **Bulk Event Deletion**: Multi-select checkboxes on created events allowing bulk removal via a safety confirmation dialog.
- **Bulk RSVP Removal**: Multi-select selection for withdrawing multiple event RSVPs in a single operation.

### 7. Server-Side Pagination & URL State Synchronization

- **Configurable Page Limits**: Select between `3`, `6`, `9`, `12`, or `24` items per page.
- **URL Query State Persistence**: Filter, search, sorting, page number, limit, and active tab selections are synchronized in URL search params (`?timeframe=upcoming&sort_by=popularity&page=1&limit=6&search=meetup`), preserving exact view state on page refresh and back-navigation.

### 8. Theme Engine

- **Theme Mode Switcher**: Supports **System Auto**, **Dark Mode**, and **Light Mode** with immediate CSS variable adaptation and `localStorage` persistence.

### 9. Bonus Challenge: SQL Analytics & Playground

- **Live SQL Analytics Runner**: Interactive playground executing **Q1** (Current Designation), **Q2** (Timeline with `LAG`/`LEAD`), and **Q4** (Designation at Project Allocation) against the live MySQL dataset with query execution time benchmarking.
- **In-App Modal Code Viewers**: Built-in modal viewers for the complete SQL solution script and analytical markdown documentation with one-click clipboard copying and dynamic browser Blob downloads.

---

## Technology Stack

| Layer                | Technology                                 | Rationale                                                                                                 |
| :------------------- | :----------------------------------------- | :-------------------------------------------------------------------------------------------------------- |
| **Frontend**         | **React 18 + TypeScript (Vite)**           | Fast development cycle, strict type safety, responsive component architecture.                            |
| **Styling**          | **Tailwind CSS + CSS Design Tokens**       | Curated palette, dark/light theme switching, glassmorphism cards, micro-animations.                       |
| **Backend**          | **Node.js + Express with TypeScript**      | Scalable RESTful API architecture, modular service/controller layers, typed middleware.                   |
| **Query Builder**    | **Knex.js (Strictly No ORMs)**             | Direct SQL query control, transaction management, migration scripts, and seeders without ORM overhead.    |
| **Database**         | **MySQL 8.0**                              | Normalized 3NF relational database schema with foreign key integrity and indexes.                         |
| **Containerization** | **Docker / Podman Compose**                | Reproducible local database service provisioning with persistent volumes and healthchecks.                |
| **Validation**       | **Zod**                                    | Type-safe schema validation on incoming request payloads and query parameters.                            |
| **Security**         | **JWT, bcryptjs, Speakeasy, Helmet, CORS** | Salted password hashing, TOTP 2FA, HTTP-only refresh tokens, secure response headers.                     |
| **Logging**          | **Winston + Morgan**                       | Structured JSON logging with multi-transport loggers (error logs, combined logs, colored console output). |
| **API Docs**         | **Swagger UI / OpenAPI 3.0**               | Interactive documentation accessible live at `/api-docs`.                                                 |
| **Testing**          | **Jest + Supertest + Vitest**              | Automated backend integration test suite and frontend unit/integration test suite.                        |

---

## Normalized Database Schema Design (3NF)

The relational database strictly adheres to Third Normal Form (3NF) with foreign key constraints, cascade rules, and composite indexes:

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

## Setup & Local Execution Instructions

### Prerequisites

- **Node.js**: v18+ (tested on Node v20/v22/v24)
- **npm**: v9+
- **Docker** or **Podman** with Compose (for running the MySQL container)

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

Create the single root environment configuration file from the template:

```bash
# Copy example env file to root .env
cp .env.example .env
```

_Default environment variables configured in `/.env`:_

```env
PORT=5000
NODE_ENV=development

# Application Configuration
CLIENT_URL=http://localhost:5173
APP_NAME=EventPlanner

# Database Configuration (MySQL 8)
DB_CLIENT=mysql2
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=eventuser
DB_PASSWORD=eventpassword
DB_NAME=event_planner_db
MYSQL_ROOT_PASSWORD=rootpassword

MYSQL_ROOT_PASSWORD=rootpassword
MYSQL_PASSWORD=eventpassword
MYSQL_USER=eventuser
MYSQL_DATABASE=event_planner_db

# Authentication & Security
JWT_SECRET=super-secret-jwt-key-minimum-32-chars-length
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_SECRET=super-secret-refresh-key-minimum-32-chars
REFRESH_TOKEN_EXPIRES_IN=7d
COOKIE_SECRET=super-secret-cookie-key

# Email & SMTP (Optional - defaults to mock/logged transport if omitted)
SMTP_HOST=smtp.mailtrap.io
SMTP_PORT=2525
SMTP_SECURE=false
SMTP_USER=
SMTP_PASS=
SMTP_FROM="EventHub" <noreply@eventhub.local>
```

#### How to Obtain & Configure SMTP Credentials (Optional)

Email delivery is used for the **Email Verification** flow. You can configure any of the following options in `/.env`:

##### Option A: Gmail SMTP (For Real Email Delivery)

1. Go to your **[Google Account Security](https://myaccount.google.com/security)** page.
2. Ensure **2-Step Verification** is enabled on your account.
3. Search for **App passwords** in the top search bar (or navigate to _2-Step Verification_ -> _App Passwords_).
4. Enter an App Name (e.g. `EventHub`) and click **Create**.
5. Copy the generated **16-character password** (e.g. `abcd efgh ijkl mnop`).
6. Set the values in `/.env`:
   ```env
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_SECURE=false
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=abcd efgh ijkl mnop
   SMTP_FROM="EventHub" <your-email@gmail.com>
   ```

##### Option B: Mailtrap (Recommended for Safe Sandbox Testing)

1. Create a free account at **[Mailtrap.io](https://mailtrap.io/)**.
2. Navigate to **Sandboxes** -> **My Inbox** -> **Settings**.
3. Under **SMTP, Email, API, POP3**, select **SMTP** in the _Integrations_ toggle buttons.
4. Copy the credentials into `/.env`:
   ```env
   SMTP_HOST=sandbox.smtp.mailtrap.io
   SMTP_PORT=2525
   SMTP_SECURE=false
   SMTP_USER=your_mailtrap_username
   SMTP_PASS=your_mailtrap_password
   SMTP_FROM="EventHub"
   ```
5. All verification emails will be captured in your virtual Mailtrap inbox.

##### Option C: Mock Transport (Zero Setup / Default)

- If `SMTP_USER` and `SMTP_PASS` are left empty, the application automatically uses Nodemailer's built-in stream transport without external network calls. Verification links and tokens will continue to function seamlessly in development and automated tests.

---

### Step 3: Start MySQL Database via Docker/Podman Compose

```bash
# Start MySQL 8 container in background (Docker or Podman)
docker compose up -d mysql
# or: podman compose up -d mysql

# Verify container status is healthy
docker compose ps
```

_Note: The database service runs with database `event_planner_db`, user `eventuser`, password `eventpassword`, and root password `rootpassword` mapped locally to port `3306`._

---

### Step 4: Run Database Migrations & Seed Sample Data

```bash
# Run Knex migrations (creates all 8 tables including bonus tables)
npm run migrate

# Seed database with users, upcoming/past events, tags, RSVPs, and bonus dataset
npm run seed
```

---

### Step 5: Start the Application

#### Option A: Local Development Server (Recommended for Fast Hot-Reloading)

```bash
# Start both Backend API (:5000) and Frontend Vite (:5173) concurrently:
npm run dev
```

Alternatively, you can run them in separate terminals:

```bash
# Terminal 1: Backend API
npm run dev:backend

# Terminal 2: Frontend Client
npm run dev:frontend
```

<!-- #### Option B: Full-Stack Docker Containerization

To run all 3 services (`mysql`, `backend`, `frontend`) entirely inside Docker/Podman:

```bash
docker compose up -d
# or: podman compose up -d
``` -->

---

### Accessing the Application

- **Frontend Web App**: [http://localhost:5173](http://localhost:5173)
- **Backend API Base**: [http://localhost:5000/api/v1](http://localhost:5000/api/v1)
- **Interactive Swagger Documentation**: [http://localhost:5000/api-docs](http://localhost:5000/api-docs)

---

### Convenient Root NPM Scripts

| Command                 | Description                                                               |
| :---------------------- | :------------------------------------------------------------------------ |
| `npm run install:all`   | Installs all dependencies across root, backend, and frontend              |
| `npm run dev`           | Starts backend (:5000) and frontend (:5173) concurrently                  |
| `npm run db:mysql:up`   | Starts only the MySQL 8 database service in Docker                        |
| `npm run db:up`         | Starts MySQL container in background daemon mode                          |
| `npm run db:down`       | Stops and tears down database container                                   |
| `npm run migrate`       | Executes Knex database migrations (creates all tables)                    |
| `npm run seed`          | Populates database with demo users, events, tags, RSVPs, and bonus tables |
| `npm test`              | Runs both backend and frontend automated test suites                      |
| `npm run test:backend`  | Runs backend Jest + Supertest integration tests                           |
| `npm run test:frontend` | Runs frontend Vitest + React Testing Library tests                        |
| `npm run build`         | Builds production bundles for backend and frontend                        |

---

### Pre-seeded Demo Accounts for Testing

| Account               | Email               | Password       | Status / Permissions |
| :-------------------- | :------------------ | :------------- | :------------------- |
| **Alice (Organizer)** | `alice@example.com` | `Password123!` | Verified Atendee     |
| **Bob (Attendee)**    | `bob@example.com`   | `Password123!` | Verified Attendee    |

_(Quick one-click demo login buttons are available directly on the login screen for rapid evaluation.)_

---

## Running Automated Test Suites

```bash
# Run all backend and frontend test suites
npm test

# Run backend integration tests only (Jest + Supertest)
npm run test:backend

# Run frontend unit & component tests only (Vitest + React Testing Library)
npm run test:frontend
```

---

## RESTful API Specification (OpenAPI 3.0 / Swagger)

Interactive API documentation with live testing is available at [http://localhost:5000/api-docs](http://localhost:5000/api-docs).

### API Endpoints Summary:

#### Authentication & Profile

- `POST /api/v1/auth/register` — Register a new user account
- `POST /api/v1/auth/login` — Sign in with email and password (supports 2FA challenge)
- `POST /api/v1/auth/refresh-token` — Rotate and issue a fresh access token
- `POST /api/v1/auth/logout` — Revoke active refresh token and invalidate auth session
- `GET /api/v1/auth/profile` — Get authenticated user profile & security status
- `POST /api/v1/auth/verify-email` — Verify user email address with verification token
- `POST /api/v1/auth/request-verification` — Send new email verification link to authenticated user
- `POST /api/v1/auth/resend-verification` — Resend verification link to specified email address

#### Two-Factor Authentication (TOTP 2FA)

- `POST /api/v1/auth/2fa/setup` — Generate TOTP secret and QR code Data URL
- `POST /api/v1/auth/2fa/enable` — Verify 6-digit TOTP code and enable 2FA
- `POST /api/v1/auth/2fa/disable` — Verify 6-digit TOTP code and disable 2FA

#### Events Management

- `GET /api/v1/events` — List events with server-side pagination, search, tag filters, sorting, and timeframe
- `GET /api/v1/events/metrics` — Aggregate metrics (total events, upcoming, past, total RSVPs)
- `GET /api/v1/events/:id` — Get full event details, creator info, tags, and attendee list
- `POST /api/v1/events` — Create new event (verified authenticated user required)
- `PUT /api/v1/events/:id` — Update event details (creator authorization required)
- `DELETE /api/v1/events/:id` — Delete single event (creator authorization required)
- `POST /api/v1/events/bulk-delete` — Bulk delete multiple events owned by user

#### Category & Tag Management

- `GET /api/v1/tags` — List all available tags with usage counts and search
- `POST /api/v1/tags` — Create a new custom tag with color hex
- `PUT /api/v1/tags/:id` — Update tag name and color hex
- `DELETE /api/v1/tags/:id` — Delete unused tag
- `GET /api/v1/tags/:id/usage` — Inspect events currently using a specific tag

#### RSVPs & Attendance

- `GET /api/v1/events/:id/attendees` — List attendee avatars and RSVP responses for an event
- `POST /api/v1/events/:id/rsvps` — Set user RSVP response (`yes`, `maybe`, `no`) with capacity checks
- `DELETE /api/v1/rsvps/events/:id` — Remove user RSVP for an event
- `GET /api/v1/rsvps/me` — Get all events the authenticated user has RSVP'd to with pagination
- `POST /api/v1/rsvps/bulk-delete` — Bulk remove user RSVPs across multiple events

#### Bonus Challenge SQL Analytics

- `GET /api/v1/bonus/data` — Fetch raw dataset from `emp_designation_log` and `emp_allocation_log`
- `GET /api/v1/bonus/q1` — Execute Q1 SQL query (Current Designation per employee)
- `GET /api/v1/bonus/q2` — Execute Q2 SQL query (Timeline with `LAG` and `LEAD`)
- `GET /api/v1/bonus/q4` — Execute Q4 SQL query (Active Designation at Allocation Start)

---

## Engineering Decisions & Architecture Rationale

1. **Knex.js Query Builder over ORMs**:
   - Strictly adhering to the assessment guidelines avoiding heavyweight ORMs. Knex provides explicit SQL visibility, eliminates N+1 query overhead via multi-joins and correlated subqueries, and manages database migrations deterministically.
2. **Short-Lived JWT + Database Refresh Token Rotation**:
   - Access tokens expire in 15 minutes to limit exposure. Refresh tokens are cryptographically hashed and persisted in MySQL with expiration dates, enabling immediate token revocation on logout and preventing replay attacks.
3. **RFC 6238 TOTP Two-Factor Authentication**:
   - Implements standard RFC 6238 TOTP algorithms via `speakeasy` and `qrcode`, ensuring compatibility with standard authenticator applications without external service dependencies.
4. **Zod Type-Safe Validation & Standardized API Responses**:
   - Standardized API payload contracts (`{ success: boolean, data?: T, error?: { message, code, details }, message?: string }`) providing uniform error handling, inline form feedback, and query parsing.
5. **Database Indexing & Normalization (3NF)**:
   - Optimized composite indexes on `(emp_id, effective_date, txn_id)` for analytical queries, foreign keys (`creator_id`, `event_id`, `tag_id`, `user_id`), and filter columns (`start_time`, `event_type`, `is_true_private`) to guarantee sub-millisecond query execution.
6. **Embedded Bonus Solutions & Zero-Dependency File Export**:
   - Markdown solutions and SQL script exports in the Bonus Section are embedded directly in the frontend component layer and downloaded on-demand via browser in-memory `Blob` objects, eliminating server-side file dependencies and static file drift.

---

## Assumptions & Business Logic Policies

1. **Event Privacy Model**:
   - **Public**: Open and discoverable by all visitors.
   - **Private**: Discoverable with confidential details unlocked upon signing in.
   - **True Private**: Completely restricted to verified community members; confidential placeholders shown to unverified/guest visitors.
2. **RSVP Capacity Enforcement**:
   - When an event reaches maximum capacity (`capacity`), further **"Going" (Yes)** responses are blocked with an alert, while **"Maybe"** and **"No"** responses remain open. Existing "Yes" attendees may update or withdraw their RSVP anytime.
3. **Email Verification Access Guard**:
   - Verified email status is required to publish events and submit RSVPs. Unverified users attempting these actions are automatically redirected to their Profile page with the verification card highlighted.
4. **Deterministic Tie-Breaking in Bonus SQL (Q1 & Q4)**:
   - When an employee has multiple designation changes on the same `effective_date`, `txn_id DESC` is utilized as the deterministic tie-breaker representing the latest system transaction.
5. **Project Allocations Preceding Recorded Designation (Bonus Q4)**:
   - When a project allocation start date precedes any recorded designation in `emp_designation_log`, a `LEFT JOIN` preserves the allocation row without data loss, returning `NULL` for `designation_at_allocation` and retrieving `emp_name` via subquery.
