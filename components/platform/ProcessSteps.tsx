const steps = [
  {
    number: "01",
    title: "Regístrate gratis",
    description:
      "Crea tu cuenta en minutos. 14 días de prueba sin tarjeta de crédito.",
  },
  {
    number: "02",
    title: "Configura tu salón",
    description:
      "Añade servicios, horarios, fotos y datos de contacto desde el panel.",
  },
  {
    number: "03",
    title: "Comparte tu enlace",
    description:
      "Recibe tu URL personalizada y compártela por WhatsApp o redes sociales.",
  },
];

export default function ProcessSteps() {
  return (
    <section id="como-funciona" className="py-16 sm:py-20">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-primary">
            Cómo funciona
          </p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
            De registro a primera reserva en tres pasos
          </h2>
        </div>

        <ol className="mt-12 space-y-0">
          {steps.map((step, index) => (
            <li
              key={step.number}
              className="relative flex gap-6 border-l border-border pb-10 pl-8 last:pb-0"
            >
              <span
                className="absolute -left-px top-0 h-full w-px bg-gradient-to-b from-primary via-primary/40 to-transparent last:hidden"
                aria-hidden
              />
              <span className="absolute -left-4 top-0 flex size-8 items-center justify-center rounded-full border border-primary/30 bg-background font-mono text-xs font-semibold text-primary">
                {step.number}
              </span>
              <div className={index < steps.length - 1 ? "pb-2" : ""}>
                <h3 className="text-lg font-semibold">{step.title}</h3>
                <p className="mt-1 text-muted-foreground">{step.description}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
