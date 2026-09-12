# Project Architecture & Developer Guide

Welcome to the **Unified Outreach & Socio-Legal Counselling (SLC) Case Management System**.
This document explains the system architecture, directory structure, data flows, and how backend and frontend components collaborate.

---

## 1. System Overview & Technology Stack

The application is an end-to-end management platform designed for legal aid organizations, social workers, and outreach teams. It facilitates legal camp outreach, inmate discovery, socio-legal assessments, case follow-ups, and document archival.

### Tech Stack
- **Frontend**:
  - React 19 (Vite)
  - Tailwind CSS v4
  - Zustand (Centralized reactive state management)
  - Axios (HTTP client with Bearer token authentication)
  - React Router DOM v7 (Client-side routing)
  - React Hot Toast (Toast notifications)
- **Backend**:
  - Node.js & Express 5 (REST API)
  - MongoDB & Mongoose (Document Database)
  - Cloudinary & Multer (Document attachments supporting PDFs and images up to 2 GB)
  - JWT (`jsonwebtoken`) & BcryptJS (Secure authentication & Role-Based Access Control)
- **Architecture Philosophy**:
  - **Unified Document Model**: Outreach cases and Socio-Legal cases share a single, unified database collection (`outreachrecords`). An outreach record can seamlessly graduate into an enriched socio-legal case without data duplication.

---

## 2. Directory Structure Map

```
gagan/
├── CODEBASE_GUIDE.md           # This comprehensive architecture & code walkthrough
├── README.md                   # Repository overview
├── backend/                    # Node.js & Express REST API
│   ├── config/
│   │   └── connectDb.js        # MongoDB connection configuration
│   ├── controllers/
│   │   ├── auth.controller.js     # User registration and login
│   │   ├── outreach.controller.js # Outreach case CRUD & queries
│   │   ├── slc.controller.js      # Socio-legal enrichment & metrics
│   │   └── document.controller.js # File uploads (Cloudinary / Local)
│   ├── middlewares/
│   │   ├── auth.middleware.js     # JWT token verification & RBAC
│   │   └── upload.middleware.js   # Multer storage configuration
│   ├── models/
│   │   ├── user.model.js          # User credentials and role definitions
│   │   └── outreach.model.js      # Unified case schema (Demographics, Legal, Followups, Files)
│   ├── routers/
│   │   ├── auth.router.js         # /api/auth routes
│   │   ├── outreach.route.js      # /api/outreach routes
│   │   └── slc.route.js           # /api/slc routes
│   ├── uploads/                   # Local file storage fallback
│   ├── server.js                  # Application entry point, CORS, timeouts
│   └── package.json
│
└── frontend/                   # React + Vite Single Page Application
    ├── src/
    │   ├── App.jsx             # Root router, protected routes, API base URL
    │   ├── main.jsx            # React root mount
    │   ├── components/
    │   │   ├── Common/
    │   │   │   └── DocumentManager.jsx    # Reusable file drag-and-drop & list component
    │   │   ├── HomePage.jsx               # Navigation portal between Outreach & SLC modules
    │   │   ├── LoginForm.jsx              # Role-aware login interface
    │   │   ├── OutreachDashboard.jsx      # Outreach module dashboard view
    │   │   ├── SlcDashboard.jsx           # Socio-legal counseling dashboard view
    │   │   ├── Outreach Components/       # Outreach cards, filters, and multi-step modal
    │   │   └── SLC Components/            # SLC cards, filters, follow-up modal, and 5-step wizard
    │   ├── store/
    │   │   ├── useAuthStore.js            # User session & token state
    │   │   ├── useOutreachStore.js        # Outreach records state & API calls
    │   │   └── useSlcStore.js             # SLC cases state & API calls
    │   └── assets/                        # Static UI assets
    ├── vite.config.js          # Vite config & API reverse proxy
    └── package.json
```

---

## 3. Core Domain Concepts & Data Flow

### A. Role-Based Access Control (RBAC)
- **User Roles**: Roles are identified by prefix in User IDs:
  - `ADM`: Administrator (Full access)
  - `LAW`: Legal Counsel / Lawyer
  - `SW`: Social Worker / Counsellor
  - `PM`: Project Manager
  - `INT`: Intern / Outreach Field Volunteer
- **Authentication Flow**:
  1. User enters ID and password in `LoginForm.jsx`.
  2. POST request to `/api/auth/login` verifies bcrypt hash in `auth.controller.js`.
  3. Server signs a JWT with `userId`, `role`, and expiration.
  4. Frontend stores user object and token in `localStorage` via `useAuthStore.js`.
  5. Subsequent requests pass `Authorization: Bearer <token>` in headers.

### B. Unified Case Lifecycle
The lifecycle follows a natural progression:
1. **Outreach Phase**:
   - Initial discovery at prisons, courts, legal aid camps, or through family contacts.
   - Basic inmate demographic data, offence types, and contact persons logged.
2. **Socio-Legal Counselling (SLC) Phase**:
   - Case is enriched with SLC number, priority tier (`Tier 1` to `Tier 4`), prisoner classification (`Undertrial`, `Convict`), and legal assessment (offence categories, RLI score, health concerns, legal representation status).
   - Multi-step wizard modal guides legal workers through 5 structured sections.
3. **Follow-ups & Documents**:
   - Continuous phone and prison follow-up logs recorded with dates, POCs, and document bottlenecks.
   - Case documents (FIR, Chargesheets, Bail orders, Medical records) attached directly to the case record.

---

## 4. API Endpoints Reference

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/login` | Authenticate user and return JWT | No |
| `POST` | `/api/auth/register` | Register a new user | No |
| `GET` | `/api/auth/me` | Fetch currently logged-in user profile | Yes |
| `GET` | `/api/outreach` | Fetch case records (supports search, filters, pagination) | Yes |
| `POST` | `/api/outreach` | Create a new outreach / SLC case record | Yes |
| `GET` | `/api/outreach/:id` | Get full details of a specific case | Yes |
| `PUT` | `/api/outreach/:id` | Update case details or enrich with socio-legal data | Yes |
| `DELETE` | `/api/outreach/:id` | Delete a case record (Admin / Manager) | Yes |
| `POST` | `/api/outreach/:id/followups` | Append a new follow-up interaction log | Yes |
| `POST` | `/api/outreach/:id/documents` | Upload and attach case documents (up to 2 GB) | Yes |
| `DELETE` | `/api/outreach/:id/documents/:docId` | Delete attached document from Cloudinary / storage | Yes |
| `GET` | `/api/slc/metrics` | Calculate high-level metrics (Tiers, Heinous crimes, etc.) | Yes |

---

## 5. State Management Architecture

State is cleanly separated into 3 lightweight Zustand stores in `frontend/src/store/`:
- **`useAuthStore`**: Controls authentication tokens, login/logout, and user profile state. Persists to browser `localStorage`.
- **`useOutreachStore`**: Manages outreach records list, pagination, filter filters (search, stage, date), modal visibility, and API sync.
- **`useSlcStore`**: Manages socio-legal counseling records, tier filtering, 5-stage case form state, and follow-up interaction logs.
