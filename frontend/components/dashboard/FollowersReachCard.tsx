import type { InstagramSummary } from "@/types/dashboard";

const integer = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 0 });

export function FollowersReachCard({ instagram }: { instagram: InstagramSummary | null }) {
  return <section className="rounded-[10px] border border-border bg-card p-4"><div><h2 className="text-xs font-semibold text-foreground">Instagram</h2>{instagram?.username ? <p className="mt-1 text-[10px] text-muted-foreground">@{instagram.username.replace(/^@/, "")}</p> : null}</div>{instagram ? <div className="mt-5 grid grid-cols-2 gap-3"><Metric label="Seguidores" value={instagram.followers} /><Metric label="Alcance" value={instagram.reach} /><Metric label="Visualizações" value={instagram.views} /><Metric label="Visitas ao perfil" value={instagram.profileVisits} /><Metric label="Posts" value={instagram.posts} /></div> : <p className="mt-5 text-[11px] text-muted-foreground">Nenhum resumo do Instagram disponível neste snapshot.</p>}</section>;
}

function Metric({ label, value }: { label: string; value: number }) { return <div className="rounded-lg border border-border bg-muted/50 p-3"><div className="text-[9px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</div><div className="mt-1 text-lg font-semibold text-foreground">{integer.format(value)}</div></div>; }
