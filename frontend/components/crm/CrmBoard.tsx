import type { KanbanColumnData, Lead } from "@/types/crm";

import { KanbanColumn } from "./KanbanColumn";

type CrmBoardProps = {
  compact?: boolean;
  selectedLead: Lead | null;
  onSelectLead: (lead: Lead) => void;
};

const columns: KanbanColumnData[] = [
  {
    id: "novo",
    title: "Novo",
    count: 7,
    accent: "blue",
    leads: [
      {
        id: "L-091",
        name: "Carlos Mendes",
        stage: "novo",
        objective: "Imóvel",
        amount: "R$ 280k",
        source: "Reel #45",
        date: "02 Jul",
        priority: "alta",
        suggestion:
          "Enviar simulação personalizada e apresentar grupo com contemplação aberta",
      },
      {
        id: "L-090",
        name: "Fernanda Lima",
        stage: "novo",
        objective: "Auto",
        amount: "R$ 85k",
        source: "Stories",
        date: "01 Jul",
        priority: "normal",
        suggestion:
          "Qualificar renda e prazo ideal. Apresentar consórcio 60x",
      },
    ],
  },
  {
    id: "qualificado",
    title: "Qualificado",
    count: 5,
    accent: "purple",
    leads: [
      {
        id: "L-087",
        name: "Ricardo Souza",
        stage: "qualificado",
        objective: "Imóvel",
        amount: "R$ 320k",
        source: "Reel #43",
        date: "28 Jun",
        priority: "alta",
        progress: 72,
        suggestion:
          "Marcar call de fechamento — cliente já comparou com banco e está decidido",
        phone: "+55 11 99876-5432",
        temperature: "quente",
      },
      {
        id: "L-086",
        name: "Juliana Costa",
        stage: "qualificado",
        objective: "Moto",
        amount: "R$ 18k",
        source: "Carrossel #12",
        date: "27 Jun",
        priority: "normal",
        progress: 58,
        suggestion:
          "Responder dúvida sobre lance fixo. Enviar vídeo explicativo",
      },
    ],
  },
  {
    id: "em_negociacao",
    title: "Em Negociação",
    count: 4,
    accent: "orange",
    leads: [
      {
        id: "L-083",
        name: "Marcos Oliveira",
        stage: "em_negociacao",
        objective: "Imóvel",
        amount: "R$ 450k",
        source: "DM orgânico",
        date: "24 Jun",
        priority: "alta",
        progress: 84,
        suggestion:
          "Follow-up proposta enviada há 2 dias — probabilidade alta de fechar hoje",
      },
      {
        id: "L-081",
        name: "Patricia Ramos",
        stage: "em_negociacao",
        objective: "Auto",
        amount: "R$ 120k",
        source: "Reel #40",
        date: "23 Jun",
        priority: "normal",
        progress: 67,
        suggestion:
          "Apresentar opção de reforço de lance para acelerar contemplação",
      },
    ],
  },
  {
    id: "fechado",
    title: "Fechado",
    count: 12,
    accent: "green",
    leads: [],
  },
  {
    id: "perdido",
    title: "Perdido",
    count: 3,
    accent: "red",
    leads: [],
  },
];

export function CrmBoard({
  compact = false,
  selectedLead,
  onSelectLead,
}: CrmBoardProps) {
  return (
    <div className="min-h-0 w-full overflow-x-auto">
      <div
        className={`flex gap-3 p-5 ${
          compact
            ? "min-w-max [&>section]:w-[244px] [&>section]:flex-none"
            : "min-w-full [&>section]:min-w-[230px] [&>section]:flex-1 [&>section]:shrink"
        }`}
      >
        {columns.map((column) => (
          <KanbanColumn
            key={column.id}
            column={column}
            selectedLeadId={selectedLead?.id}
            onSelectLead={onSelectLead}
          />
        ))}
      </div>
    </div>
  );
}
