# Medication Reminder Platform UI

A production-grade frontend application for the Aetna Medication Reminder system, providing 5 key dashboards for managing prescriptions, evaluating member eligibility, running reminder campaigns, and monitoring communication statuses.

## Features

- **Prescription Dashboard**: View and search pending prescriptions
- **Eligibility Review**: Check member eligibility and rules Engine results
- **Campaign Preview**: Schedule and preview communication campaigns
- **Communication Status**: Real-time delivery logs and analytics
- **Summary Dashboard**: High-level metrics and aggregated performance

## Architecture

This project consists of:
1. **Frontend**: React + Vite (located in `src/`)
2. **Backend-For-Frontend (BFF)**: Node + Express (located in `server/`)
3. **Database**: PostgreSQL (schemas in `server/db/`)

*For architectural diagrams, refer to `docs/architecture/`.*

## Quick Start

### 1. Frontend Development (Mock Data)
You can run the frontend completely independently using local mock data.
```bash
npm install
npm run dev
```

### 2. Full Stack (Live DB)
To run the full stack with the Express BFF and PostgreSQL:

**Setup BFF & Database**
```bash
cd server
npm install
cp .env.example .env
# Fill in your DB credentials in server/.env
npm run dev
```

**Connect Frontend to BFF**
In the root directory, create a `.env.local` file:
```env
VITE_API_URL=http://localhost:5001
```
Then start the frontend:
```bash
npm run dev
```

## Docker Deployment
```bash
docker build -t medication-reminder-ui .
docker run -p 8080:8080 medication-reminder-ui
```

## Documentation
Additional documentation and artifacts are located in `docs/`.
