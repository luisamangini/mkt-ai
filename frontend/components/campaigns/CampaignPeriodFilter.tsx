type Props = { requestedPeriod?: string; usedPeriod?: string; generatedAt?: string };

export function CampaignPeriodFilter({ requestedPeriod, usedPeriod, generatedAt }: Props) {
  const generated = generatedAt ? new Date(generatedAt).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" }) : null;
  return <div className="flex flex-wrap items-center justify-between gap-3"><div><h1 className="text-base font-semibold text-foreground">Campanhas</h1><p className="mt-1 text-[11px] text-muted-foreground">Acompanhe investimento, eficiência e conversão dos snapshots persistidos</p></div>{usedPeriod ? <div className="flex flex-wrap items-center gap-2 text-[10px] text-muted-foreground"><span className="rounded-md border border-border bg-card px-2 py-1">Período utilizado: {usedPeriod}</span>{requestedPeriod && requestedPeriod !== usedPeriod ? <span className="rounded-md border border-amber-200 bg-amber-50 px-2 py-1 text-amber-700">Solicitado: {requestedPeriod}</span> : null}{generated ? <span>Atualizado em {generated}</span> : null}</div> : null}</div>;
}
