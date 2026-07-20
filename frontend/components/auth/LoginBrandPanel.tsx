import { BarChart3, FileText, KanbanSquare, Megaphone } from "lucide-react";

const benefits = [
  {
    label: "Conteúdo orientado por dados",
    icon: FileText,
  },
  {
    label: "Leads organizados em um só lugar",
    icon: KanbanSquare,
  },
  {
    label: "Visão completa das campanhas",
    icon: BarChart3,
  },
];

const barHeights = [
  "h-8",
  "h-12",
  "h-10",
  "h-14",
  "h-12",
  "h-16",
  "h-14",
  "h-[74px]",
];

export function LoginBrandPanel() {
  return (
    <section className="hidden min-h-[calc(100vh-96px)] flex-1 items-center rounded-[10px] border border-black/10 bg-gray-50 px-8 py-8 lg:flex xl:px-12">
      <div className="mx-auto w-full max-w-[560px]">
        <div className="mb-12 inline-flex items-center gap-2 rounded-full border border-black/10 bg-white px-3 py-1.5 text-xs font-medium text-[#0A0A0A]">
          <span className="flex h-5 w-5 items-center justify-center rounded-md bg-[#030213] text-[10px] font-semibold text-white">
            C
          </span>
          ConsorIA
        </div>

        <div className="max-w-[500px]">
          <h1 className="text-3xl font-semibold leading-tight text-[#0A0A0A] xl:text-4xl">
            Marketing inteligente, do conteúdo à conversão.
          </h1>
          <p className="mt-4 text-sm leading-6 text-[#717182]">
            Centralize sua produção de conteúdo, acompanhe campanhas e gerencie
            oportunidades em uma única plataforma.
          </p>
        </div>

        <div className="mt-8 grid gap-2">
          {benefits.map((benefit) => {
            const Icon = benefit.icon;

            return (
              <div
                key={benefit.label}
                className="flex items-center gap-3 text-xs font-medium text-[#0A0A0A]"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-black/10 bg-white text-[#717182]">
                  <Icon className="h-3.5 w-3.5" strokeWidth={1.8} />
                </span>
                {benefit.label}
              </div>
            );
          })}
        </div>

        <div className="mt-12 grid max-w-[500px] grid-cols-2 gap-3">
          <div className="rounded-[10px] border border-black/10 bg-white p-4">
            <div className="mb-5 flex items-center justify-between">
              <span className="text-[10px] font-semibold uppercase tracking-wide text-[#717182]">
                Campanhas
              </span>
              <Megaphone className="h-4 w-4 text-[#717182]" strokeWidth={1.8} />
            </div>
            <div className="text-2xl font-semibold text-[#0A0A0A]">342</div>
            <div className="mt-1 text-[11px] text-[#717182]">
              leads em 30 dias
            </div>
          </div>

          <div className="rounded-[10px] border border-black/10 bg-white p-4">
            <div className="mb-5 text-[10px] font-semibold uppercase tracking-wide text-[#717182]">
              CRM
            </div>
            <div className="text-2xl font-semibold text-[#0A0A0A]">89</div>
            <div className="mt-1 text-[11px] text-[#717182]">qualificados</div>
          </div>

          <div className="col-span-2 rounded-[10px] border border-black/10 bg-white p-4">
            <div className="mb-3 flex items-center justify-between text-[11px] text-[#717182]">
              <span>Eficiência da verba</span>
              <span className="font-medium text-green-600">CPL -R$ 4,20</span>
            </div>
            <div className="grid grid-cols-8 items-end gap-1.5">
              {barHeights.map((heightClass, index) => (
                <div
                  key={`${heightClass}-${index}`}
                  className={`rounded-sm bg-[#93C5FD] ${heightClass}`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
