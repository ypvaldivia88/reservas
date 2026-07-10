import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { ArrowRight } from "lucide-react";
import AdminPreviewMock from "./AdminPreviewMock";

export default function PlatformHero() {
  return (
    <section className="relative overflow-hidden border-b border-border/60">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,oklch(0.55_0.12_185/0.12),transparent)]"
        aria-hidden
      />

      <div className="mx-auto grid max-w-7xl gap-12 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-2 lg:items-center lg:gap-16 lg:px-8 lg:py-28">
        <div className="relative z-10">
          <Badge
            variant="outline"
            className="mb-6 border-primary/30 bg-primary/5 text-primary"
          >
            14 días gratis · Sin tarjeta
          </Badge>

          <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-[3.25rem] lg:leading-[1.08]">
            Tu salón online.
            <span className="mt-1 block text-primary">
              Reservas automáticas.
            </span>
          </h1>

          <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">
            Crea la página de tu salón, gestiona citas desde un panel claro y
            comparte un enlace único por WhatsApp. Listo en minutos, no en días.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link
              href="/registro"
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-md transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              Empezar gratis
              <ArrowRight className="size-4" aria-hidden />
            </Link>
            <Link
              href="/admin"
              className="inline-flex min-h-11 items-center justify-center rounded-lg border border-border bg-background px-6 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              Ya tengo cuenta
            </Link>
          </div>

          <p className="mt-6 font-mono text-sm text-muted-foreground">
            <span className="text-champagne">→</span>{" "}
            <span className="text-foreground/80">tudominio.com/</span>
            <span className="text-primary">mi-salon</span>
          </p>
        </div>

        <div className="relative z-10 lg:pl-4">
          <AdminPreviewMock />
        </div>
      </div>
    </section>
  );
}
