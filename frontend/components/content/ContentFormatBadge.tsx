import { CirclePlay, Layers3, Video } from "lucide-react";
import type { ComponentType } from "react";

import type { ContentFormat } from "@/types/content";

type ContentFormatBadgeProps = {
  format: ContentFormat;
};

const formatConfig = {
  reel: {
    label: "Reel",
    icon: Video,
    className: "border-violet-200 bg-violet-50 text-violet-600",
  },
  carrossel: {
    label: "Carrossel",
    icon: Layers3,
    className: "border-cyan-200 bg-cyan-50 text-cyan-600",
  },
  stories: {
    label: "Stories",
    icon: CirclePlay,
    className: "border-pink-200 bg-pink-50 text-pink-600",
  },
} satisfies Record<
  ContentFormat,
  {
    label: string;
    icon: ComponentType<{ className?: string; strokeWidth?: number }>;
    className: string;
  }
>;

export function ContentFormatBadge({ format }: ContentFormatBadgeProps) {
  const config = formatConfig[format];
  const Icon = config.icon;

  return (
    <span
      className={`inline-flex h-[24px] items-center gap-1.5 rounded-md border px-2 text-[11px] font-medium leading-4 ${config.className}`}
    >
      <Icon className="h-3.5 w-3.5" strokeWidth={1.7} />
      {config.label}
    </span>
  );
}
