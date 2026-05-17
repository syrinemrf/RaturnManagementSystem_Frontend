# Return Management System — Frontend

A professional Angular web application for managing product returns, non-conformities, and quality tracking. Built with Angular 17, Angular Material, and Chart.js.

## Live Demo

**[https://gestion-retours-frontend-176480887870.europe-west1.run.app](https://gestion-retours-frontend-176480887870.europe-west1.run.app)**

> Deployed on Google Cloud Run.

---

## Features

- **Authentication** — JWT-based login with role-based access control (ADMIN, QUALITE, EMPLOYE)
- **Return Management** — Create, view, update, and track product returns through their full lifecycle
- **Non-Conformity Tracking** — Log and manage quality non-conformities with severity levels
- **Dashboard** — Real-time statistics and charts powered by Chart.js
- **Audit History** — Full traceability of all state changes per return
- **User Management** — Admin panel to manage user accounts and roles
- **Responsive UI** — Built with Angular Material for a clean, professional interface
- **Dark / Light Theme** — User-selectable theme

---

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

---

## Prerequisites

- Node.js 20+
- npm 9+
- Angular CLI 17: `npm install -g @angular/cli@17`

---

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

> By default, the frontend connects to the backend API at `http://localhost:8080`. Update `src/environments/environment.ts` if your backend runs on a different URL.

---

## Default Credentials

| Role | Email | Password |
|------|-------|----------|
| ADMIN | admin@retours.com | Admin123! |
| QUALITE | qualite@retours.com | Qualite123! |
| EMPLOYE | employe@retours.com | Employe123! |

---

## Build for Production

```bash
ng build --configuration production
```

Build output will be in `dist/frontend/browser/`.

---

## Run with Docker

```bash
# Build the image
docker build -t return-management-frontend .

# Run the container
docker run -p 80:8080 -e BACKEND_URL=http://your-backend-url return-management-frontend
```

The app will be available at **http://localhost**.

---

## Environment Variables (Docker)

| Variable | Description | Default |
|----------|-------------|---------|
| `BACKEND_URL` | Backend API base URL | `http://localhost:8080` |

---

## Related Repository

- **Backend API:** [ReturnManagementSystem_Backend](https://github.com/syrinemrf/ReturnManagementSystem_Backend)

---

## License

MIT License
