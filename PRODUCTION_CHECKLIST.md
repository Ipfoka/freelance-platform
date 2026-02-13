# Production Checklist

## 1. Secrets and config validation
- [x] `JWT_SECRET` and `DATABASE_URL` are validated at startup (`backend/src/app.module.ts`).
- [x] Runtime fails fast when auth secrets are missing (`backend/src/auth.module.ts`, `backend/src/strategies/jwt.strategy.ts`).
- [ ] Move all secrets to a managed vault (Render/Vercel/Cloud secret manager).

## 2. Security hardening
- [x] Global request validation with whitelist and forbid unknown fields (`backend/src/main.ts`).
- [x] Security headers via `helmet` (`backend/src/main.ts`).
- [x] Global rate limiting via `@nestjs/throttler` (`backend/src/app.module.ts`).
- [ ] Add CSRF strategy if browser cookie auth is introduced.

## 3. Monitoring and health
- [x] Health endpoint with database check (`GET /health`, `backend/src/health/*`).
- [x] Request latency logging middleware (`backend/src/main.ts`).
- [ ] Add centralized log shipping and alerts (Sentry, Datadog, Grafana, etc.).

## 4. Migrations and deploy safety
- [x] Migration scripts for deploy/status/reset (`backend/package.json`).
- [x] CI runs build + tests for both apps (`.github/workflows/ci-cd.yml`).
- [ ] Add staged rollout and smoke tests post-deploy.

## 5. Rollback readiness
- [x] Rollback documented at operational level via restore + migration reset scripts (`ops/*.ps1`, `backend/package.json`).
- [ ] Define strict rollback runbook per environment (staging/prod) with owner and SLA.

## 6. Backup and restore
- [x] PostgreSQL backup script (`ops/backup-postgres.ps1`).
- [x] PostgreSQL restore script (`ops/restore-postgres.ps1`).
- [ ] Schedule automated backups and verify restore drills.

## 7. Quality gates
- [x] Backend e2e critical flow tests (`backend/test/app.e2e-spec.ts`).
- [x] Frontend lint/build passing with MVP pages.
- [ ] Add frontend integration/e2e tests for UI regressions.
