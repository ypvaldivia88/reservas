import Link from "next/link";

export default function PlatformFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-border bg-card">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">
              R
            </div>
            <div>
              <p className="font-semibold">ReservaSalón</p>
              <p className="text-sm text-muted-foreground">
                Reservas online para salones
              </p>
            </div>
          </div>

          <nav
            className="flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground"
            aria-label="Enlaces del pie de página"
          >
            <Link href="/registro" className="hover:text-foreground">
              Registrar salón
            </Link>
            <Link href="/admin" className="hover:text-foreground">
              Iniciar sesión
            </Link>
            <Link href="#funciones" className="hover:text-foreground">
              Funciones
            </Link>
            <Link href="#precios" className="hover:text-foreground">
              Precios
            </Link>
          </nav>
        </div>

        <p className="mt-8 text-center text-xs text-muted-foreground">
          © {year} ReservaSalón. Todos los derechos reservados.
        </p>
      </div>
    </footer>
  );
}
