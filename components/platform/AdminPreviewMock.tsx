import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { CalendarDays, Clock3, Users } from "lucide-react";

const appointments = [
  { time: "10:00", client: "María G.", service: "Manicure gel" },
  { time: "14:30", client: "Ana R.", service: "Uñas acrílicas" },
  { time: "16:00", client: "Disponible", service: "—" },
];

export default function AdminPreviewMock() {
  return (
    <Card className="relative overflow-hidden border-border/80 bg-card shadow-xl ring-1 ring-foreground/5">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="size-2.5 rounded-full bg-red-400/80" />
          <div className="size-2.5 rounded-full bg-amber-400/80" />
          <div className="size-2.5 rounded-full bg-emerald-400/80" />
        </div>
        <Badge variant="secondary" className="font-mono text-[10px]">
          Panel admin
        </Badge>
      </div>

      <CardContent className="space-y-4 p-4">
        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-lg bg-muted/60 p-3">
            <Users className="mb-1 size-4 text-primary" aria-hidden />
            <p className="text-lg font-semibold tabular-nums">24</p>
            <p className="text-[11px] text-muted-foreground">Clientes</p>
          </div>
          <div className="rounded-lg bg-muted/60 p-3">
            <CalendarDays className="mb-1 size-4 text-primary" aria-hidden />
            <p className="text-lg font-semibold tabular-nums">8</p>
            <p className="text-[11px] text-muted-foreground">Esta semana</p>
          </div>
          <div className="rounded-lg bg-muted/60 p-3">
            <Clock3 className="mb-1 size-4 text-champagne" aria-hidden />
            <p className="text-lg font-semibold tabular-nums">3</p>
            <p className="text-[11px] text-muted-foreground">Hoy</p>
          </div>
        </div>

        <div className="rounded-lg border border-border bg-background p-3">
          <p className="mb-2 text-xs font-medium text-muted-foreground">
            Agenda de hoy
          </p>
          <ul className="space-y-2" aria-label="Citas de ejemplo">
            {appointments.map((item) => (
              <li
                key={item.time}
                className="flex items-center justify-between gap-3 rounded-md bg-muted/40 px-3 py-2 text-sm"
              >
                <span className="font-mono text-xs tabular-nums text-muted-foreground">
                  {item.time}
                </span>
                <span className="min-w-0 flex-1 truncate font-medium">
                  {item.client}
                </span>
                <span className="hidden truncate text-xs text-muted-foreground sm:inline">
                  {item.service}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </CardContent>

      <div
        className="pointer-events-none absolute -right-8 -top-8 size-32 rounded-full bg-primary/10 blur-2xl"
        aria-hidden
      />
    </Card>
  );
}
