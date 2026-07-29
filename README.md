# Project Management Admin App

A full-stack admin application for managing clients, projects, billing, payments, employees, salaries, and attendance. Built with **React**, **Node.js**, and **SQLite**.

## Features

- **Admin authentication** — secure login with JWT
- **Client & Projects module**
  - Clients — name, contact details
  - Projects — linked to clients, start date, details
  - Billing — invoice and billing records per project
  - Payments — payment tracking per project
  - Debit / Credit — transaction ledger per project
- **Human Resources module**
  - Employees — name, DOJ, designation, place of posting
  - Salary Details — salary records per employee
  - Attendance — daily attendance tracking
- **CRUD operations** on all modules
- **Search** on every list page
- **Add / Edit / Delete** via inline form panel

## Tech Stack

| Layer    | Technology                          |
|----------|-------------------------------------|
| Frontend | React 18, Vite, React Router        |
| Backend  | Node.js, Express                    |
| Database | SQLite (better-sqlite3)             |
| Auth     | JWT + bcrypt                        |

## Getting Started

### Prerequisites

- Node.js 18+

### Installation

```bash
# Install all dependencies
npm run install:all

# Seed database with default admin and sample data
npm run seed
```

### Run Development Servers

```bash
# Start both backend (port 5000) and frontend (port 3000)
npm run dev
```

Or run separately:

```bash
npm run dev:backend   # http://localhost:5000
npm run dev:frontend  # http://localhost:3000
```

### Default Login

| Field    | Value     |
|----------|-----------|
| Username | `admin`   |
| Password | `admin123`|

## Project Structure

```
project-management-app/
├── backend/
│   ├── src/
│   │   ├── routes/       # API routes per module
│   │   ├── middleware/   # JWT auth
│   │   ├── database.js   # SQLite schema
│   │   ├── seed.js       # Default admin + sample data
│   │   └── index.js      # Express server
│   └── data/             # SQLite database file (auto-created)
├── frontend/
│   └── src/
│       ├── components/   # Layout, ModulePage (reusable CRUD)
│       ├── config/       # Menu & module field definitions
│       ├── context/      # Auth context
│       └── pages/        # Login, Dashboard
└── package.json          # Root scripts
```

## API Endpoints

All endpoints except `/api/auth/login` require `Authorization: Bearer <token>`.

| Method | Endpoint              | Description        |
|--------|-----------------------|--------------------|
| POST   | `/api/auth/login`     | Admin login        |
| GET    | `/api/clients`        | List clients       |
| GET    | `/api/projects`       | List projects      |
| GET    | `/api/billing`        | List billing       |
| GET    | `/api/payments`       | List payments      |
| GET    | `/api/transactions`   | List transactions  |
| GET    | `/api/employees`      | List employees     |
| GET    | `/api/salaries`       | List salaries      |
| GET    | `/api/attendance`     | List attendance    |

Each resource supports `GET`, `POST`, `PUT /:id`, `DELETE /:id`, and `?search=` query on list.

## Menu Layout

**Client & Projects**
- Clients
- Projects
- Billing
- Payments
- Debit / Credit

**Human Resources**
- Employees
- Salary Details
- Attendance
