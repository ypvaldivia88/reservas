# AGENTS.md

## Cursor Cloud specific instructions

This is a **Next.js 15 (App Router, Turbopack) multi-tenant nail-salon SaaS** written in
TypeScript/React 19, backed by **MongoDB**. There is a single service: the Next.js app
(frontend + API routes under `app/api`). Standard scripts live in `package.json`
(`dev`, `build`, `lint`, `type-check`, `format`); DB helper scripts live in `scripts/`.

### Environment
- `MONGODB_URI` is **required** (see `lib/mongodb.ts`, which throws on startup if missing).
  It is provided via `.env.local` (gitignored). For local dev, MongoDB runs on the VM at
  `mongodb://127.0.0.1:27017/nailsalon`.
- Other env vars are optional and have defaults: WhatsApp numbers
  (`NEXT_PUBLIC_ADMIN_WHATSAPP_NUMBER`), Vercel Blob (`BLOB_READ_WRITE_TOKEN`, needed only
  for image uploads), and platform-admin creds (`PLATFORM_ADMIN_USERNAME` / `PLATFORM_ADMIN_PASSWORD`,
  default `platform`/`platform123`).

### MongoDB (not started by the update script — start it yourself)
MongoDB is installed on the VM (`mongod`, v8.0). It is a service, so start it manually per session:
```
mongod --dbpath /data/db --bind_ip 127.0.0.1 --port 27017   # run in the background (tmux)
```
Data lives in `/data/db` (outside the repo). If that directory is empty / the DB is fresh,
you MUST bootstrap collections + indexes before the app will work (see next section).

### Fresh-database bootstrap (IMPORTANT, non-obvious)
On a brand-new DB, several API routes and `scripts/create-indexes.ts` call
`collection.indexes()` on collections that do not exist yet, which throws
`MongoServerError: ns does not exist` (Mongo error code 26). Symptom: creating a reservation
returns HTTP 500 with `ns does not exist: nailsalon.reservas`.

Fix (run once against a fresh DB, with `mongod` already running):
1. Pre-create the collections so `.indexes()` calls succeed:
   ```
   mongosh nailsalon --quiet --eval 'const c=["users","sessions","reservas","schedules","availability_overrides","servicios","categorias","imagenes","galeria","salons","subscription_plans","tenant_subscriptions","payment_requests","financial_transactions","financial_categories"];c.forEach(n=>{try{db.createCollection(n)}catch(e){}});print(db.getCollectionNames().length+" collections")'
   ```
2. Create indexes: `npx tsx scripts/create-indexes.ts`

This is a one-time-per-DB step, not something for the startup update script (which cannot run
because `mongod` is a service that must be started first).

### Run / test / build (see `package.json` for exact commands)
- Dev server: `npm run dev` (Turbopack, http://localhost:3000). This is a multi-tenant app:
  create a salon at `/registro`, then that salon's public page is `/<slug>` (e.g. `/glamour-test`);
  admin login is at `/admin`.
- Lint: `npm run lint` (passes with only `react-hooks/exhaustive-deps` warnings).
- Types: `npm run type-check`.
- Tests: `npm test` is a no-op placeholder (no automated test suite exists).
- The `migrate:multi-tenant` script (`scripts/migrate-multi-tenant.ts`) is only for migrating
  legacy single-tenant data; it is NOT needed for a fresh setup.
