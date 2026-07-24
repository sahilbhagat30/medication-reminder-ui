# Medication Reminder Platform UI

[![React](https://img.shields.io/badge/React-19.2-blue.svg?logo=react)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-8.1-646CFF.svg?logo=vite)](https://vitejs.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-Express-339933.svg?logo=nodedotjs)](https://nodejs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16.0-4169E1.svg?logo=postgresql)](https://www.postgresql.org/)

A production-grade, full-stack application designed for the **Aetna Medication Reminder System**. This platform empowers administrators and healthcare providers with a suite of intuitive dashboards to manage prescriptions, evaluate member eligibility, coordinate outreach campaigns, and monitor real-time communication delivery.

---

## Key Features

The application is composed of 5 primary, interconnected workflows:

- **Prescription Dashboard**: A comprehensive view of pending pickups, fulfillment statuses, and member prescription details.
- **Eligibility Review**: An intelligent rules-engine interface to determine member communication eligibility, consent status, and preferred channels.
- **Campaign Preview**: A command center for scheduling, previewing, and managing targeted reminder campaigns across SMS, Email, and Push notifications.
- **Communication Status**: Real-time telemetry on notification delivery, bounce rates, and message suppression logs.
- **Summary Dashboard**: High-level aggregated metrics, success rates, and active campaign analytics at a glance.

---

## Architecture & Tech Stack

This project follows a modern **Backend-For-Frontend (BFF)** architectural pattern.

- **Frontend (`src/`)**: React 19, Vite, React Router DOM, Recharts, Lucide Icons.
- **Backend/BFF (`server/`)**: Node.js, Express, node-postgres (`pg`), CORS.
- **Database**: PostgreSQL (Schemas and Seed scripts provided).
- **Deployment**: Dockerized multi-stage builds optimized for GCP Cloud Run.

*For detailed architectural diagrams, logical data models, and presentation materials, please refer to the `docs/` directory.*

---

## Getting Started

### Prerequisites
- Node.js (v20+ recommended)
- PostgreSQL (if running the full stack locally)
- Docker (optional)

### Option 1: Frontend Development (Mock Data)
You can run the frontend completely decoupled from the database. It will automatically fallback to comprehensive local mock data.

```bash
# Install dependencies
npm install

# Start the Vite development server
npm run dev
```

### Option 2: Full Stack Local Development
To test the application against a live PostgreSQL database:

**1. Setup the Database & BFF**
```bash
cd server
npm install

# Create your local environment file
cp .env.example .env
# Edit server/.env with your PostgreSQL credentials

# Start the Express server (runs on port 5001 by default)
npm run dev
```

**2. Connect the Frontend**
Open a new terminal at the project root and point Vite to your local BFF:
```bash
# Create local environment config
cp .env.local.example .env.local
# Ensure VITE_API_URL=http://localhost:5001 is set

# Start the frontend
npm run dev
```

---

## Docker Deployment

The application includes a highly optimized, multi-stage Dockerfile that builds the React application and serves it statically via the Express BFF.

```bash
# Build the production image
docker build -t medication-reminder-ui .

# Run the container (maps to port 8080)
docker run -p 8080:8080 -e DB_HOST=... -e DB_USER=... medication-reminder-ui
```

---

## Project Structure

```text
medication-reminder-ui/
├── docs/                   # Architectural diagrams, ERDs, and assignment details
├── server/                 # Node.js Express BFF
│   ├── db/                 # PostgreSQL connection pool, schema, and seed scripts
│   ├── middleware/         # Express middleware (logging, etc.)
│   ├── routes/             # Modular API routes
│   └── index.js            # Server entry point
├── src/                    # React Frontend
│   ├── components/         # Reusable UI components (Sidebar, Topbar)
│   ├── constants/          # Application-wide constants (Routes)
│   ├── data/               # Local mock data fallback payload
│   ├── pages/              # The 5 primary dashboard views
│   ├── services/           # Universal API fetch layer
│   ├── utils/              # Helper functions (PDF/CSV exports)
│   ├── App.jsx             # Main Router and Layout
│   └── index.css           # Global design system tokens
├── .github/workflows/      # CI/CD Pipelines (Cloud Run deployment)
├── Dockerfile              # Multi-stage container build
└── package.json            # Project configuration and scripts
```

---

## Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Starts the Vite dev server with HMR. |
| `npm run build` | Compiles the React app for production into `dist/`. |
| `npm run lint` | Runs `oxlint` across the codebase to catch errors. |
| `npm run lint:fix` | Automatically fixes auto-correctable linting issues. |

*(The `server/` directory has its own `npm start` and `npm run dev` scripts for managing the backend.)*
