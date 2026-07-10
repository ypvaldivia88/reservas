import { CheckCircle2 } from "lucide-react";
import { SalonStat } from "@/lib/types";
import { CompactMetricRow } from "@/components/design/dashboard";

interface StatsSectionProps {
  stats?: SalonStat[];
  primaryColor?: string;
}

const DEFAULT_STATS: SalonStat[] = [
  { number: "100+", label: "Clientas Felices" },
  { number: "4+", label: "Años de Experiencia" },
  { number: "6+", label: "Servicios Disponibles" },
  { number: "98%", label: "Satisfacción Garantizada" },
];

export default function StatsSection({
  stats = DEFAULT_STATS,
}: StatsSectionProps) {
  return (
    <section className="py-12 sm:py-14 lg:py-16 bg-muted/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat, index) => (
            <CompactMetricRow
              key={index}
              icon={CheckCircle2}
              title={stat.label}
              subtitle="Nuestro salón"
              value={stat.number}
              badge={{ label: "Destacado", variant: "muted" }}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
