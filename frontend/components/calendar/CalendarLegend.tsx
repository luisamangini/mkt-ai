import { pillarClasses, pillarLabels, statusLabels } from "./CalendarContentCard";
import type { CalendarPillar, CalendarStatus } from "@/types/calendar";

const pillars: CalendarPillar[] = [
  "atualidades",
  "educacao_financeira",
  "mitos",
  "prova_social",
  "conversao",
];

const statuses: CalendarStatus[] = ["sem_status", "aprovado", "publicado", "descartado"];

const statusDot: Record<CalendarStatus, string> = {
  sem_status: "bg-gray-400",
  aprovado: "bg-green-500",
  publicado: "bg-green-500",
  descartado: "bg-red-500",
};

export function CalendarLegend() {
  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-b border-border px-5 py-3 text-[10px] text-muted-foreground">
      <div className="flex flex-wrap items-center gap-2">
        {pillars.map((pillar) => (
          <span key={pillar} className="flex items-center gap-1.5">
            <span className={`h-2 w-2 rounded-full ${pillarClasses[pillar].split(" ")[1]}`} />
            {pillarLabels[pillar]}
          </span>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {statuses.map((status) => (
          <span key={status} className="flex items-center gap-1.5">
            <span className={`h-2 w-2 rounded-full ${statusDot[status]}`} />
            {statusLabels[status]}
          </span>
        ))}
      </div>
    </div>
  );
}
