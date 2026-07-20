type PostFormat = "Reel" | "Carrossel";

type PostMetric = {
  rank: number;
  post: string;
  format: PostFormat;
  reach: string;
  saveRate: string;
  shareRate: string;
  nonFollowers: number;
  leads: number;
};

const posts: PostMetric[] = [
  {
    rank: 1,
    post: "Comprei apê sem dar entrada",
    format: "Reel",
    reach: "94.2k",
    saveRate: "3.4%",
    shareRate: "1.3%",
    nonFollowers: 66,
    leads: 48,
  },
  {
    rank: 2,
    post: "5 mitos do consórcio DESMENTIDOS",
    format: "Carrossel",
    reach: "68.4k",
    saveRate: "3.1%",
    shareRate: "1.3%",
    nonFollowers: 59,
    leads: 31,
  },
  {
    rank: 3,
    post: "Consórcio vs financiamento — números reais",
    format: "Reel",
    reach: "54.8k",
    saveRate: "3.4%",
    shareRate: "1.4%",
    nonFollowers: 62,
    leads: 26,
  },
  {
    rank: 4,
    post: "Por que 2025 é o melhor ano para entrar",
    format: "Reel",
    reach: "48.2k",
    saveRate: "2.6%",
    shareRate: "1.1%",
    nonFollowers: 45,
    leads: 19,
  },
  {
    rank: 5,
    post: "Lance embutido: o segredo que poucos sabem",
    format: "Carrossel",
    reach: "41.9k",
    saveRate: "4.3%",
    shareRate: "0.9%",
    nonFollowers: 52,
    leads: 15,
  },
];

const formatBadgeClass: Record<PostFormat, string> = {
  Reel: "border-[#51A2FF]/20 bg-[#51A2FF]/15 text-[#51A2FF]",
  Carrossel: "border-[#05DF72]/20 bg-[#05DF72]/15 text-[#05DF72]",
};

export function PostsTable() {
  return (
    <section className="overflow-hidden rounded-[10px] border border-black/10 bg-white">
      <div className="flex items-center justify-between border-b border-black/10 px-5 py-3">
        <h2 className="text-xs font-semibold leading-[18px] text-[#0A0A0A]">
          Posts que mais geraram leads
        </h2>
        <span className="text-[11px] font-medium leading-4 text-[#717182]">
          Leads por post
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[820px] border-collapse">
          <thead>
            <tr className="border-b border-black/10 text-left text-[9px] font-semibold uppercase leading-[13.5px] tracking-[0.1em] text-[#717182]/70">
              <th className="w-10 px-4 py-3">#</th>
              <th className="px-3 py-3">Post</th>
              <th className="w-28 px-3 py-3">Fmt</th>
              <th className="w-24 px-3 py-3">Alcance</th>
              <th className="w-24 px-3 py-3">Save rate</th>
              <th className="w-24 px-3 py-3">Share rate</th>
              <th className="w-28 px-3 py-3">% Não-seg.</th>
              <th className="w-20 px-4 py-3">Leads</th>
            </tr>
          </thead>
          <tbody>
            {posts.map((post) => (
              <tr
                key={post.rank}
                className="h-16 border-b border-black/5 last:border-b-0"
              >
                <td className="px-4 font-mono text-[10px] text-[#717182]">
                  {post.rank}
                </td>
                <td className="max-w-[280px] px-3 text-[11px] font-medium leading-[15px] text-[#0A0A0A]">
                  {post.post}
                </td>
                <td className="px-3">
                  <span
                    className={`inline-flex h-[22px] items-center rounded border px-1.5 text-[11px] font-medium leading-4 ${formatBadgeClass[post.format]}`}
                  >
                    {post.format}
                  </span>
                </td>
                <td className="px-3 font-mono text-[10px] text-[#717182]">
                  {post.reach}
                </td>
                <td className="px-3 font-mono text-[10px] text-[#05DF72]">
                  {post.saveRate}
                </td>
                <td className="px-3 font-mono text-[10px] text-[#717182]">
                  {post.shareRate}
                </td>
                <td className="px-3">
                  <div className="flex items-center gap-2">
                    <div className="flex h-1.5 w-10 overflow-hidden rounded-full bg-[#ECECF0]">
                      <div
                        className="h-full bg-[#030213]"
                        style={{ width: `${post.nonFollowers}%` }}
                      />
                    </div>
                    <span className="font-mono text-[10px] text-[#717182]">
                      {post.nonFollowers}%
                    </span>
                  </div>
                </td>
                <td className="px-4 text-[13px] font-bold leading-5 text-[#030213]">
                  {post.leads}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
