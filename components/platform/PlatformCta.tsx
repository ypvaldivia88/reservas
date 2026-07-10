import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function PlatformCta() {
  return (
    <section className="border-t border-border/60 py-16 sm:py-20">
      <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
          ¿Listo para recibir reservas hoy?
        </h2>
        <p className="mt-4 text-lg text-muted-foreground">
          Configura tu salón en minutos y comparte tu enlace con tus clientes.
        </p>
        <Link
          href="/registro"
          className="mt-8 inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-primary px-8 py-3 text-sm font-semibold text-primary-foreground shadow-md transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          Crear mi salón gratis
          <ArrowRight className="size-4" aria-hidden />
        </Link>
      </div>
    </section>
  );
}
