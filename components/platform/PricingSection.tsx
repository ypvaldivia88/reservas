import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Check } from "lucide-react";
import { DEFAULT_PLANS } from "@/lib/subscription";

export default function PricingSection() {
  const plan = DEFAULT_PLANS[0];

  return (
    <section id="precios" className="border-y border-border/60 bg-muted/30 py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-primary">
            Precios
          </p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
            Prueba gratis, luego un plan simple
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Sin sorpresas. Un solo plan con todo incluido para tu salón.
          </p>
        </div>

        <div className="mx-auto mt-12 max-w-lg">
          <Card className="overflow-hidden border-primary/20 shadow-lg ring-1 ring-primary/10">
            <CardHeader className="border-b border-border/60 bg-primary/5 pb-6 text-center">
              <Badge className="mx-auto mb-3 w-fit">Más popular</Badge>
              <CardTitle className="text-2xl">{plan.nombre}</CardTitle>
              <p className="text-sm text-muted-foreground">{plan.descripcion}</p>
              <div className="mt-4 flex items-baseline justify-center gap-1">
                <span className="text-5xl font-bold tabular-nums tracking-tight">
                  ${plan.precioMensual}
                </span>
                <span className="text-muted-foreground">USD / mes</span>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                14 días gratis al registrarte
              </p>
            </CardHeader>
            <CardContent className="space-y-6 p-6">
              <ul className="space-y-3">
                {plan.caracteristicas.map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm">
                    <Check
                      className="mt-0.5 size-4 shrink-0 text-primary"
                      aria-hidden
                    />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>

              <div className="rounded-lg border border-border bg-muted/40 p-4 text-sm text-muted-foreground">
                <p>
                  <span className="font-medium text-foreground">
                    {plan.descuentoSemestralPorcentaje}% descuento
                  </span>{" "}
                  en plan semestral ·{" "}
                  <span className="font-medium text-foreground">
                    {plan.descuentoAnualPorcentaje}% descuento
                  </span>{" "}
                  en plan anual
                </p>
              </div>

              <Link
                href="/registro"
                className="flex min-h-11 w-full items-center justify-center rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                Empezar prueba gratis
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
