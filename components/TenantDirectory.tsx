import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { SalonDirectoryItem } from "@/lib/types";
import { ArrowUpRight } from "lucide-react";

interface TenantDirectoryProps {
  salons: SalonDirectoryItem[];
}

export default function TenantDirectory({ salons }: TenantDirectoryProps) {
  if (salons.length === 0) {
    return null;
  }

  return (
    <section id="salones" className="border-b border-border/60 py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-wider text-primary">
            Directorio
          </p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
            Salones en la plataforma
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Explora los salones registrados y reserva directamente desde su
            página.
          </p>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {salons.map((salon) => (
            <Card
              key={salon.slug}
              className="group overflow-hidden border-border/80 transition-shadow hover:shadow-md"
            >
              <div
                className="h-1"
                style={{
                  background: `linear-gradient(to right, ${salon.primaryColor}, ${salon.secondaryColor})`,
                }}
                aria-hidden
              />

              <CardContent className="flex flex-col gap-4 p-5">
                <div className="flex items-start gap-3">
                  {salon.logoUrl ? (
                    <div className="relative size-12 shrink-0 overflow-hidden rounded-lg border border-border bg-background">
                      <Image
                        src={salon.logoUrl}
                        alt={`Logo de ${salon.nombre}`}
                        fill
                        className="object-contain p-1"
                      />
                    </div>
                  ) : (
                    <div
                      className="flex size-12 shrink-0 items-center justify-center rounded-lg text-lg font-bold text-white"
                      style={{ background: salon.primaryColor }}
                      aria-hidden
                    >
                      {salon.nombre.charAt(0).toUpperCase()}
                    </div>
                  )}

                  <div className="min-w-0 flex-1">
                    <h3 className="truncate font-semibold">{salon.nombre}</h3>
                    <Badge variant="secondary" className="mt-1">
                      {salon.categoryLabel}
                    </Badge>
                  </div>
                </div>

                {salon.subtitle && (
                  <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">
                    {salon.subtitle}
                  </p>
                )}

                <div className="mt-auto flex gap-2 pt-2">
                  <Link
                    href={`/${salon.slug}`}
                    className="inline-flex min-h-10 flex-1 items-center justify-center gap-1 rounded-lg border border-border bg-background px-3 text-sm font-medium transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    Ver salón
                    <ArrowUpRight className="size-3.5" aria-hidden />
                  </Link>
                  <Link
                    href={`/reserva?slug=${salon.slug}`}
                    className="inline-flex min-h-10 flex-1 items-center justify-center rounded-lg px-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    style={{ background: salon.primaryColor }}
                  >
                    Reservar
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
