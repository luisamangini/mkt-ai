type AiScoreProps = {
  score: number;
};

export function AiScore({ score }: AiScoreProps) {
  return (
    <div className="flex w-28 items-center gap-2">
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-gray-100">
        <div
          className="h-full rounded-full bg-[#030213]"
          style={{ width: `${score}%` }}
        />
      </div>
      <span className="w-6 text-right font-mono text-[10px] font-medium leading-4 text-[#0A0A0A]">
        {score}
      </span>
    </div>
  );
}
