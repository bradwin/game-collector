# Game Collector (Scaffold)

## Recommended stack
- Backend: Node.js + TypeScript + Fastify + Prisma (SQLite)
- Frontend: React + Vite + TypeScript
- Shared types: workspace package (`@game-collector/shared`)
- Runtime: single container for local development

## Quick start (local dev)
1. Copy environment file:
   ```bash
   cp .env.example .env
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Generate Prisma client and apply migrations:
   ```bash
   npm run prisma:generate
   npm run prisma:deploy
   ```
4. Start backend and frontend:
   ```bash
   npm run dev
   ```

Backend: `http://localhost:4000`  
Frontend: `http://localhost:5173`

## Docker Compose (single-container)
```bash
docker compose up --build
```

## Current scaffold coverage
- Health endpoints: `GET /health/live`, `GET /health/ready`
- Auth skeleton: `/auth/login`, `/auth/register`
- Domain skeleton routes: `/games`, `/ownership`, `/purchases`
- Metadata provider interface + RAWG adapter stub
- Import/export service skeleton
- Backup service skeleton

All non-trivial business flows are marked with `TODO` comments.
