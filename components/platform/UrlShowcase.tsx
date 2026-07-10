export default function UrlShowcase() {
  return (
    <section className="py-16 sm:py-20">
      <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
        <p className="text-sm font-semibold uppercase tracking-wider text-champagne">
          Tu enlace único
        </p>
        <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
          Tu salón, tu URL
        </h2>
        <p className="mt-4 text-lg text-muted-foreground">
          Al registrarte recibes una dirección personalizada para compartir con
          tus clientes. Ellos ven tus servicios y reservan directamente.
        </p>

        <div className="mt-8 rounded-xl border border-border bg-card px-6 py-5 shadow-sm">
          <p className="font-mono text-lg sm:text-xl">
            <span className="text-muted-foreground">tudominio.com/</span>
            <span className="font-semibold text-primary">mi-salon</span>
          </p>
        </div>
      </div>
    </section>
  );
}
