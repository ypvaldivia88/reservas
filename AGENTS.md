# AGENTS.md

## Cursor Cloud specific instructions

This is a single-product **Next.js 15 (App Router) + TypeScript + MongoDB** nail-salon reservation app (`reservas-nails-salon`). Frontend and backend API routes run in one process. Standard commands live in `package.json` (`dev`, `build`, `lint`, `type-check`, `format`) and `README.md`.

### Services

- **Next.js app (web + API):** `npm run dev` serves both the UI and `/api/*` on `http://localhost:3000`.
- **MongoDB (required):** the app throws on startup if `MONGODB_URI` is unset (`lib/mongodb.ts`); DB name is hardcoded to `nailsalon`. MongoDB Community 8.0 is installed on the VM but is **not managed by systemd** here — start it manually with:
  `mongod --dbpath /data/db --bind_ip 127.0.0.1 --port 27017`
  (the `/data/db` dir already exists). Run it in a background tmux session; it is not started by the update script.

### Environment

- `.env.local` (gitignored) must contain `MONGODB_URI`. For local dev use `mongodb://127.0.0.1:27017/nailsalon`. This file is not committed, so recreate it if missing.
- Optional/degrades gracefully: `BLOB_READ_WRITE_TOKEN` (Vercel Blob image upload — without it the inspiration gallery just shows a broken-image placeholder), `NEXT_PUBLIC_ADMIN_WHATSAPP_NUMBER` (WhatsApp deep links are purely client-side, no server/API needed).

### Notes

- Admin panel is at `/admin`; default credentials are `admin` / `admin` (admin user auto-initialized via `AdminInitializer` + `app/api/auth/init`).
- Phone numbers are normalized to Cuban format `+53XXXXXXXX` (see `phoneUtils` in `lib/utils.ts`); the reservation form expects 8 digits.
- `npm test` is a no-op stub — there is no automated test suite. Use `npm run lint` and `npm run type-check` for programmatic checks.
- On submit, the reservation flow opens a `wa.me`/WhatsApp deep link in a new tab; this is expected behavior, not an error.
