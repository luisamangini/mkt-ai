const reach = {
  nonFollowers: 57,
  followers: 43,
};

export function FollowersReachCard() {
  const nonFollowersDegrees = reach.nonFollowers * 3.6;

  return (
    <section className="rounded-[10px] border border-black/10 bg-white p-4">
      <h2 className="text-xs font-semibold leading-[18px] text-[#0A0A0A]">
        Alcance por Seguidor
      </h2>

      <div className="flex min-h-[248px] flex-col items-center justify-center gap-5">
        <div
          className="grid h-40 w-40 place-items-center rounded-full"
          style={{
            background: `conic-gradient(#6366F1 0deg ${nonFollowersDegrees}deg, #D4D4D4 ${nonFollowersDegrees}deg 360deg)`,
          }}
        >
          <div className="flex h-28 w-28 flex-col items-center justify-center rounded-full bg-white">
            <div className="text-3xl font-semibold leading-8 text-[#0A0A0A]">
              {reach.nonFollowers}%
            </div>
            <div className="text-[11px] leading-4 text-[#717182]">
              não-seguidores
            </div>
          </div>
        </div>

        <div className="grid w-full gap-2 text-[11px] leading-4 text-[#717182]">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[#6366F1]" />
            <span>{reach.nonFollowers}% Descoberta</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[#D4D4D4]" />
            <span>{reach.followers}% Seguidores</span>
          </div>
        </div>
      </div>
    </section>
  );
}
