import {
  Calendar,
  Globe,
  LayoutTemplate,
  Palette,
  Users,
  Wallet,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const features = [
  {
    icon: Calendar,
    title: "Reservas en línea",
    description:
      "Tus clientes reservan 24/7 desde el móvil. Sin llamadas perdidas ni mensajes de WhatsApp sin responder.",
    className: "lg:col-span-2",
  },
  {
    icon: Globe,
    title: "Página web propia",
    description:
      "URL personalizada con servicios, galería y contacto listos para compartir.",
    className: "lg:col-span-1",
  },
  {
    icon: LayoutTemplate,
    title: "Calendario y agenda",
    description:
      "Gestiona citas, horarios y disponibilidad desde un panel intuitivo.",
    className: "lg:col-span-1",
  },
  {
    icon: Users,
    title: "Base de clientes",
    description:
      "Historial de reservas, contactos y seguimiento de clientes frecuentes.",
    className: "lg:col-span-1",
  },
  {
    icon: Wallet,
    title: "Control financiero",
    description:
      "Ingresos, gastos y categorías para ver la salud real de tu negocio.",
    className: "lg:col-span-1",
  },
  {
    icon: Palette,
    title: "Personalizable",
    description:
      "Plantillas por tipo de negocio, colores y contenido de tu sitio.",
    className: "lg:col-span-2",
  },
];

export default function FeaturesBento() {
  return (
    <section id="funciones" className="border-b border-border/60 py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-wider text-primary">
            Funciones
          </p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
            Todo lo que necesita tu salón, sin complicaciones
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Una plataforma pensada para negocios pequeños que quieren dejar de
            coordinar citas a mano.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <Card
                key={feature.title}
                className={`border-border/80 bg-card/50 transition-shadow hover:shadow-md ${feature.className}`}
              >
                <CardHeader className="pb-2">
                  <div className="mb-3 flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Icon className="size-5" aria-hidden />
                  </div>
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
