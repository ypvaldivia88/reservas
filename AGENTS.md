# AGENTS.md

## Cursor Cloud specific instructions

This is a single **Next.js 15 (App Router) + TypeScript + MongoDB** app: a multi-tenant
salon booking platform. Use **npm** (matches `package-lock.json` and the README). The
stray `pnpm-lock.yaml` / `pnpm-workspace.yaml` are not usable (the workspace file only
contains placeholder text) — ignore them.

Standard commands live in `package.json` (`dev`, `build`, `start`, `lint`, `type-check`,
`format`). Dev server runs on port **3000** via Turbopack.

### Required runtime dependency: MongoDB
The app has no mocked DB. `lib/mongodb.ts` throws at import if `MONGODB_URI` is unset, so a
MongoDB instance and `.env.local` are mandatory to run anything.

- MongoDB Community server is installed in the VM image. It is not managed by systemd here;
  start it manually and leave it running:
  ```bash
  sudo mongod --dbpath /var/lib/mongodb --logpath /var/log/mongodb/mongod.log --bind_ip 127.0.0.1 --port 27017
  ```
  (run it in a background/tmux session).
- `.env.local` is gitignored and NOT committed, so recreate it if missing:
  ```
  MONGODB_URI="mongodb://127.0.0.1:27017/nailsalon"
  ```
  The DB name is fixed to `nailsalon` in code (`lib/db/collections.ts`).

### Fresh-database bootstrap (non-obvious gotcha)
On an empty database, request handlers and `scripts/create-indexes.ts` call
`collection.indexes()` on collections that do not exist yet and crash with
`NamespaceNotFound` (`ns does not exist: nailsalon.<collection>`). Before first use, create
the empty collections, then create the indexes:
```bash
mongosh nailsalon --quiet --eval 'const c=["users","sessions","reservas","schedules","availability_overrides","servicios","categorias","imagenes","galeria","salons","subscription_plans","tenant_subscriptions","payment_requests","financial_transactions","financial_categories"];const e=db.getCollectionNames();c.forEach(n=>{if(!e.includes(n))db.createCollection(n)})'
npx tsx scripts/create-indexes.ts
```

### Seeding for a usable app
- Create the default salon-admin user (`admin` / `admin`): `curl -X POST http://localhost:3000/api/auth/init`
- Public reservations without a `?slug=` use the default salon. Salon admin login is at
  `/admin`; the platform super-admin area is under `/admin/platform`.
- `POST /api/servicios/init` requires an authenticated admin session (401 otherwise).

### Optional integrations (safe to skip locally)
`BLOB_READ_WRITE_TOKEN` (Vercel Blob — only for image upload/delete),
`UNSPLASH_ACCESS_KEY` (placeholder seeding on salon registration), and the
`NEXT_PUBLIC_*_WHATSAPP_NUMBER` vars (WhatsApp deep links) all have fallbacks or fail only
on their specific feature. The core booking/admin flows work without them.
