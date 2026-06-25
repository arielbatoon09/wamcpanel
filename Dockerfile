# WAMCPanel Docker Configuration
#
# Individual service Dockerfiles are located in their respective directories:
#   - Backend:  ./backend/Dockerfile
#   - Frontend: ./frontend/Dockerfile
#
# ─── Local Development ────────────────────────────────────────────────────
#
#   1. Start infrastructure only (PostgreSQL + Redis):
#      docker compose up pg redis -d
#
#   2. Run backend natively:
#      cd backend && npm run dev
#      (or from root: npm run dev:backend)
#
#   3. Run frontend natively:
#      cd frontend && npm run dev
#      (or from root: npm run dev:frontend)
#
#   4. Stop infrastructure when done:
#      docker compose down
#
# ─── Pre-deploy Docker check (full stack) ─────────────────────────────────
#
#      docker compose up --build
