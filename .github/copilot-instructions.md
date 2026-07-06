# Copilot Instructions - Reservas (Nail Salon Management System)

## Project Overview
Next.js 15 (App Router) + TypeScript + MongoDB nail salon reservation system deployed on Vercel. Core features: client reservations, admin CRUD, WhatsApp notifications, dynamic content management (services, galleries, images).

**Live:** https://reservas-taupe.vercel.app  
**Stack:** Next.js 15, React 19, TypeScript, Tailwind CSS 4, MongoDB, Vercel Blob Storage

## Architecture Patterns

### 1. Client/Server Component Split
- **All admin pages:** `"use client"` (interactive forms, modals, state)
- **API routes:** Server-side only (`app/api/**/*.ts`)
- **Public pages:** Mix - server by default, client for interactive forms
- **Pattern:** Keep data fetching in API routes, not in components

### 2. Data Flow & Database Access
```
Component → API Route → MongoDB (lib/mongodb.ts) → Response
```
- **Never** access MongoDB directly from components
- All DB operations go through `clientPromise` from `@/lib/mongodb`
- Database name: `"nailsalon"` (hardcoded)
- Connection pooling configured: max 10 connections, 45s timeout

### 3. Type System (lib/types.ts)
**Critical types:**
- `Reserva`: Reservations with `clienteId`, `fechaCita`, `horaCita`, `estado`
- `User`: Dual-role (`'admin' | 'cliente'`), admins have `username/password`, clients have `telefono`
- `ImageData`: **New system** - uses Vercel Blob (`blobUrl` required), has gallery flags (`enGaleriaDashboard`, `enGaleriaInspiracion`)
- `ApiResponse<T>`: Standard wrapper with `success`, `data?`, `error?`, `message?`

**Always** return `ApiResponse<T>` from API routes. TypeScript strict mode enabled.

### 4. Phone Number Normalization (lib/utils.ts)
**Critical:** All phone operations use `phoneUtils`:
- `normalize()`: Always stores as `+53XXXXXXXX` (11 chars)
- `isValid()`: Validates Cuban format (8 digits after +53)
- `format()`: Display as `+53 XXXX XXXX`
- **Why:** Prevents duplicate clients (different formats = same person)

```typescript
// CORRECT
const normalized = phoneUtils.normalize(input); // "+5355551234"
await db.users.findOne({ telefono: normalized });

// WRONG - will create duplicates
await db.users.findOne({ telefono: input }); // "5555 1234" vs "55551234"
```

### 5. Image Storage Migration
**Old:** Base64 in MongoDB (deprecated, causes performance issues)  
**New:** Vercel Blob Storage (lib/blobStorage.ts)

```typescript
// Upload pattern
import { uploadImageToBlob } from '@/lib/blobStorage';
const { url } = await uploadImageToBlob(file, filename);
await db.imagenes.insertOne({ 
  blobUrl: url, // REQUIRED
  enGaleriaInspiracion: true // Gallery flags
});
```

**Environment:** Requires `BLOB_READ_WRITE_TOKEN` in `.env.local`

### 6. WhatsApp Integration (lib/whatsapp.ts)
**No external APIs** - uses WhatsApp Web links to pre-fill messages:

```typescript
import { openWhatsAppNotification } from '@/lib/whatsapp';
// After creating reservation
openWhatsAppNotification(reservaDetails, reservaId);
// Opens whatsapp://send with pre-filled admin notification
```

**Admin number:** `+5363233073` (env: `NEXT_PUBLIC_ADMIN_WHATSAPP_NUMBER`)  
**Pattern:** Client's WhatsApp opens → Pre-filled message → Client sends → Admin receives

## Key Workflows

### Creating a Reservation
1. Form validation (client-side: `components/ReservaForm.tsx`)
2. POST `/api/reservas` with normalized phone
3. Check time slot availability (`fechaCita + horaCita`)
4. Auto-register client if phone not found
5. Create reservation with `estado: 'pendiente'`
6. **Auto-open WhatsApp** with notification link to `/admin/dashboard?reserva={id}`

### Admin Dashboard Access
- Login: `/admin` → Session cookie (24h, `session-token`)
- Protected routes: `app/admin/(protected)/**` (see middleware.ts)
- Middleware checks cookie existence, **full validation in API routes**
- Default credentials: `admin/admin` (change after first login!)

### Content Management (New Unified System)
**Page:** `/admin/contenido` replaces 4 separate pages  
**Pattern:** Upload image → Assign to galleries via checkboxes:
- `enGaleriaDashboard`: Shows in "Nuestros Trabajos" carousel
- `enGaleriaInspiracion`: Shows in booking page inspiration gallery

**Components:**
- `DynamicInspirationGallery.tsx`: Fetches images with `enGaleriaInspiracion=true`
- `DynamicGalleryCarousel.tsx`: Fetches images with `enGaleriaDashboard=true`

## Common Patterns

### API Route Template
```typescript
import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ApiResponse, YourType } from "@/lib/types";

export async function GET(): Promise<NextResponse<ApiResponse<YourType[]>>> {
  try {
    const client = await clientPromise;
    const db = client.db("nailsalon");
    const data = await db.collection<YourType>("collection").find({}).toArray();
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { success: false, error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
```

### Date/Time Handling (lib/utils.ts)
```typescript
import { dateUtils } from '@/lib/utils';

// Store as YYYY-MM-DD string
const fechaCita = dateUtils.formatToYYYYMMDD(new Date());
// Validate future date
if (!dateUtils.isFutureDate(fechaCita)) { /* error */ }
// Validate time format (HH:mm)
if (!dateUtils.isValidTimeFormat("14:30")) { /* error */ }
```

### Modal Pattern (Admin Pages)
```typescript
const [isModalOpen, setIsModalOpen] = useState(false);
const [selectedItem, setSelectedItem] = useState<Type | null>(null);

// Edit: set item and open modal
const handleEdit = (item: Type) => {
  setSelectedItem(item);
  setIsModalOpen(true);
};

// Create: clear item and open modal
const handleCreate = () => {
  setSelectedItem(null);
  setIsModalOpen(true);
};
```

## Security Checklist
- [ ] Always validate input in API routes (check `lib/types.ts` for schemas)
- [ ] Use `phoneUtils.normalize()` before DB queries/inserts
- [ ] Check authentication for `/api/admin/**` routes (see existing patterns)
- [ ] Never expose `MONGODB_URI` or `BLOB_READ_WRITE_TOKEN` in client code
- [ ] Sanitize user input with `validationUtils.sanitizeString()`
- [ ] Return generic errors to clients, log details server-side

## Development Commands
```bash
npm run dev              # Start dev server (Turbopack)
npm run build            # Production build (check before deploy)
npm run type-check       # TypeScript validation (strict mode)
npm run lint             # ESLint check
npm run format           # Prettier formatting
```

## Critical Files for Context
- **Types:** `lib/types.ts` (single source of truth)
- **Utils:** `lib/utils.ts` (phone, date, validation)
- **DB:** `lib/mongodb.ts` (connection pool)
- **Auth:** `lib/auth.ts` (bcrypt hashing)
- **Middleware:** `middleware.ts` (route protection, security headers)
- **Docs:** `README.md`, `docs/IMPLEMENTATION_SUMMARY.md`, `docs/PHONE_NORMALIZATION.md`

## When Adding Features
1. **Check types first:** Is your data model in `lib/types.ts`? Add it.
2. **API route:** Follow `app/api/reservas/route.ts` pattern
3. **Validation:** Use `phoneUtils` for phones, `dateUtils` for dates
4. **Client component:** Add `"use client"` if using hooks/state
5. **Update docs:** Especially `README.md` if changing user-facing behavior

## Anti-Patterns (Don't Do This)
❌ Direct MongoDB access from components  
❌ Storing phones without `phoneUtils.normalize()`  
❌ Using `any` type (strict mode enabled)  
❌ Base64 images in MongoDB (use Blob Storage)  
❌ Forgetting `"use client"` directive on interactive components  
❌ Hardcoding admin WhatsApp number (use env var)  

## Deployment Notes
- **Platform:** Vercel (auto-deploy from main branch)
- **Env vars:** `MONGODB_URI`, `BLOB_READ_WRITE_TOKEN`, `NEXT_PUBLIC_ADMIN_WHATSAPP_NUMBER`
- **Build check:** `npm run build && npm run type-check` must pass
- **First deploy:** Run `/api/auth/init` to create admin user

## Need More Context?
- **Auth flow:** See `docs/AUTENTICACION.md`
- **Image system:** See `docs/GESTION_IMAGENES.md`, `docs/UNIFIED_CONTENT_MANAGEMENT.md`
- **WhatsApp:** See `docs/WHATSAPP_NOTIFICATIONS.md`
- **Security:** See `docs/SECURITY_ASSESSMENT.md`
- **Implementation history:** See `docs/IMPLEMENTATION_SUMMARY.md`
