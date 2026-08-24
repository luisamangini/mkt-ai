type AiScoreProps = {
  score: number | null;
};

export function AiScore({ score }: AiScoreProps) {
  if (score === null) {
    return (
      <span className="font-mono text-[10px] leading-4 text-muted-foreground">—</span>
    );
  }

  return (
    <div className="flex w-28 items-center gap-2">
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-[#030213]"
          style={{ width: `${score}%` }}
        />
      </div>
      <span className="w-6 text-right font-mono text-[10px] font-medium leading-4 text-foreground">
        {score}
      </span>
    </div>
  );
}
