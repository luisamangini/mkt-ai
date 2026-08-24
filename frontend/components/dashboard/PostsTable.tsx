export type DashboardPostMetric = {
  id: string;
  title: string;
  format: string;
  reach: number;
  leads: number;
};

export function PostsTable({ posts }: { posts: DashboardPostMetric[] }) {
  return <section className="overflow-hidden rounded-[10px] border border-border bg-card"><div className="border-b border-border px-5 py-3"><h2 className="text-xs font-semibold text-foreground">Posts que mais geraram leads</h2></div>{posts.length ? <div className="divide-y divide-black/5">{posts.map((post) => <div key={post.id} className="grid grid-cols-[1fr_auto_auto] gap-4 px-5 py-3 text-[11px]"><span className="text-foreground">{post.title}</span><span className="text-muted-foreground">{post.reach.toLocaleString("pt-BR")} alcance</span><span className="font-semibold">{post.leads} leads</span></div>)}</div> : <p className="p-5 text-[11px] text-muted-foreground">Nenhuma métrica por post disponível.</p>}</section>;
}
