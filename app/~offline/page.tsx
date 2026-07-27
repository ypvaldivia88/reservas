import Link from "next/link";
import { CalendarDays, WifiOff } from "lucide-react";

export const metadata = {
  title: "Sin conexión",
};

export default function OfflinePage() {
  return (
    <main className="flex min-h-[70vh] items-center justify-center px-4 py-16">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 text-center shadow-lg">
        <div className="mx-auto mb-5 flex size-14 items-center justify-center rounded-2xl bg-amber-500/15 text-amber-700 dark:text-amber-300">
          <WifiOff className="size-7" aria-hidden />
        </div>
        <h1 className="text-2xl font-bold tracking-tight">Sin conexión</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          No hay internet ahora mismo. Si ya abriste el panel antes, tus turnos
          guardados siguen disponibles en el calendario.
        </p>
        <div className="mt-8 flex flex-col gap-2.5">
          <Link
            href="/admin/calendario?view=month"
            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
          >
            <CalendarDays className="size-4" />
            Ir al calendario
          </Link>
          <form action="/admin/calendario?view=month">
            <button
              type="submit"
              className="inline-flex h-11 w-full items-center justify-center rounded-xl border border-border bg-background px-4 text-sm font-medium transition-colors hover:bg-muted"
            >
              Reintentar conexión
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
