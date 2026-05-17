# Return Management System: Frontend

A web application for managing product returns, non-conformities, and quality tracking. Built with Angular 17 and Angular Material.

## Live Demo

**[https://gestion-retours-frontend-176480887870.europe-west1.run.app](https://gestion-retours-frontend-176480887870.europe-west1.run.app)**

Deployed on Google Cloud Run.

## Features

- JWT-based authentication with role-based access control
- Product return lifecycle management (from submission to final decision)
- Non-conformity tracking with severity classification
- Real-time dashboard with charts powered by Chart.js
- Full audit history for every return
- User account management (admin only)
- Responsive interface built with Angular Material
- Dark and light theme support

## Role-Based Access

The application enforces three roles with different levels of access:

| Role | Access |
|------|--------|
| **ADMIN** | Full access: manage users, returns, non-conformities, and delete any record |
| **QUALITE** | Manage returns (update state), create and manage non-conformities, view dashboard |
| **EMPLOYE** | Submit returns and view data; cannot change states or manage non-conformities |

## Tech Stack

| Technology | Version | Purpose |
|---|---|---|
| Angular | 17 | Frontend framework |
| Angular Material | 17 | UI component library |
| Chart.js / ng2-charts | 4 / 5 | Data visualization |
| TypeScript | 5.4 | Programming language |
| RxJS | 7.8 | Reactive programming |
| nginx | alpine | Production web server |
| Docker | latest | Containerization |

## Prerequisites

- Node.js 20+
- npm 9+
- Angular CLI 17: `npm install -g @angular/cli@17`

## Getting Started

```bash
# Clone the repository
git clone https://github.com/syrinemrf/RaturnManagementSystem_Frontend.git
cd RaturnManagementSystem_Frontend

# Install dependencies
npm install --legacy-peer-deps

# Start the development server
ng serve
```

The app will be available at **http://localhost:4200**.

By default, the frontend connects to the backend API at `http://localhost:8080`. Update `src/environments/environment.ts` if your backend runs on a different URL.

## Default Credentials

| Role | Email | Password |
|------|-------|----------|
| ADMIN | admin@retours.com | Admin123! |
| QUALITE | qualite@retours.com | Qualite123! |
| EMPLOYE | employe@retours.com | Employe123! |

## Build for Production

```bash
ng build --configuration production
```

Build output will be in `dist/frontend/browser/`.

## Run with Docker

```bash
# Build the image
docker build -t return-management-frontend .

# Run the container
docker run -p 80:8080 -e BACKEND_URL=http://your-backend-url return-management-frontend
```

The app will be available at **http://localhost**.

## Environment Variables (Docker)

| Variable | Description | Default |
|----------|-------------|---------|
| `BACKEND_URL` | Backend API base URL | `http://localhost:8080` |

## Related Repository

Backend API: [ReturnManagementSystem_Backend](https://github.com/syrinemrf/ReturnManagementSystem_Backend)

## License

MIT License
