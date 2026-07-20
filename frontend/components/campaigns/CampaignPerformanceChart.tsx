"use client";

import { useMemo, useState } from "react";
import type {
  CampaignChartMetric,
  CampaignPerformancePoint,
} from "@/types/campaigns";
import { CampaignMetricSelector } from "./CampaignMetricSelector";

type CampaignPerformanceChartProps = {
  points: CampaignPerformancePoint[];
};

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  minimumFractionDigits: 2,
});

const integerFormatter = new Intl.NumberFormat("pt-BR", {
  maximumFractionDigits: 0,
});

const percentFormatter = new Intl.NumberFormat("pt-BR", {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

const chartWidth = 720;
const chartHeight = 320;
const padding = {
  top: 26,
  right: 52,
  bottom: 40,
  left: 58,
};

function getX(index: number, total: number) {
  const innerWidth = chartWidth - padding.left - padding.right;
  return padding.left + (innerWidth / Math.max(total - 1, 1)) * index;
}

function getY(value: number, maxValue: number, minValue = 0) {
  const innerHeight = chartHeight - padding.top - padding.bottom;
  const range = Math.max(maxValue - minValue, 1);
  return (
    padding.top +
    innerHeight -
    ((value - minValue) / range) * innerHeight
  );
}

function buildSmoothPath(values: number[], maxValue: number, minValue = 0) {
  const points = values.map((value, index) => ({
    x: getX(index, values.length),
    y: getY(value, maxValue, minValue),
  }));

  return points
    .map((point, index) => {
      if (index === 0) {
        return `M ${point.x.toFixed(2)} ${point.y.toFixed(2)}`;
      }

      const previous = points[index - 1];
      const controlX = previous.x + (point.x - previous.x) / 2;

      return `C ${controlX.toFixed(2)} ${previous.y.toFixed(2)}, ${controlX.toFixed(2)} ${point.y.toFixed(2)}, ${point.x.toFixed(2)} ${point.y.toFixed(2)}`;
    })
    .join(" ");
}

function formatCurrencyAxis(value: number) {
  if (value === 0) {
    return "R$ 0";
  }

  return `R$ ${integerFormatter.format(value / 1000)} mil`;
}

export function CampaignPerformanceChart({
  points,
}: CampaignPerformanceChartProps) {
  const [selectedMetric, setSelectedMetric] =
    useState<CampaignChartMetric>("investment_leads");
  const [activePoint, setActivePoint] =
    useState<CampaignPerformancePoint | null>(null);

  const investmentMax = 6000;
  const leadMax = 60;
  const cplMax = 160;
  const ctrMax = 4.5;

  const investmentTicks = [0, 2000, 4000, 6000];
  const leadTicks = [0, 20, 40, 60];
  const cplTicks = [0, 50, 100, 150];
  const ctrTicks = [0, 1.5, 3, 4.5];

  const activeLabel = useMemo(() => {
    if (selectedMetric === "cpl") {
      return "CPL";
    }

    if (selectedMetric === "ctr") {
      return "CTR";
    }

    return "Investimento × Leads";
  }, [selectedMetric]);

  return (
    <section className="flex h-full min-h-[430px] flex-col rounded-[10px] border border-black/10 bg-white">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-black/10 px-4 py-3">
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-[#0A0A0A]">
            Investimento e geração de leads
          </h2>
          <p className="mt-1 text-[11px] text-[#717182]">
            Relação entre verba aplicada e leads captados no período
          </p>
        </div>
        <CampaignMetricSelector
          selectedMetric={selectedMetric}
          onMetricChange={(metric) => {
            setSelectedMetric(metric);
            setActivePoint(null);
          }}
        />
      </div>

      <div className="flex flex-1 flex-col p-4">
        <div className="mb-3 flex flex-wrap items-center gap-4 text-[10px] text-[#717182]">
          {selectedMetric === "investment_leads" ? (
            <>
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-sm bg-[#93C5FD]" />
                Investimento
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-[#0F172A]" />
                Leads gerados
              </span>
            </>
          ) : (
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-[#0F172A]" />
              {activeLabel}
            </span>
          )}
        </div>

        <div className="min-h-[320px] w-full overflow-hidden">
          <svg
            viewBox={`0 0 ${chartWidth} ${chartHeight}`}
            role="img"
            aria-label={`Gráfico de ${activeLabel}`}
            className="h-[320px] w-full"
          >
            {(selectedMetric === "investment_leads"
              ? investmentTicks
              : selectedMetric === "cpl"
                ? cplTicks
                : ctrTicks
            ).map((tick) => {
              const max =
                selectedMetric === "investment_leads"
                  ? investmentMax
                  : selectedMetric === "cpl"
                    ? cplMax
                    : ctrMax;
              const y = getY(tick, max);

              return (
                <g key={`left-${tick}`}>
                  <line
                    x1={padding.left}
                    x2={chartWidth - padding.right}
                    y1={y}
                    y2={y}
                    stroke="#E5E7EB"
                    strokeWidth="1"
                  />
                  <text
                    x={padding.left - 10}
                    y={y + 3}
                    textAnchor="end"
                    className="fill-[#717182] text-[10px]"
                  >
                    {selectedMetric === "investment_leads"
                      ? formatCurrencyAxis(tick)
                      : selectedMetric === "cpl"
                        ? currencyFormatter.format(tick)
                        : `${percentFormatter.format(tick)}%`}
                  </text>
                </g>
              );
            })}

            {selectedMetric === "investment_leads"
              ? leadTicks.map((tick) => {
                  const y = getY(tick, leadMax);

                  return (
                    <text
                      key={`right-${tick}`}
                      x={chartWidth - padding.right + 10}
                      y={y + 3}
                      className="fill-[#717182] text-[10px]"
                    >
                      {tick}
                    </text>
                  );
                })
              : null}

            {selectedMetric === "cpl" ? (
              <ReferenceLine
                value={50}
                maxValue={cplMax}
                label="Meta de CPL"
              />
            ) : null}

            {selectedMetric === "ctr" ? (
              <ReferenceLine
                value={3}
                maxValue={ctrMax}
                label="Referência"
                labelSuffix="%"
              />
            ) : null}

            {points.map((point, index) => {
              const x = getX(index, points.length);

              return (
                <g key={point.date}>
                  <text
                    x={x}
                    y={chartHeight - 12}
                    textAnchor="middle"
                    className="fill-[#717182] text-[10px]"
                  >
                    {point.date}
                  </text>
                  <rect
                    x={x - 32}
                    y={padding.top}
                    width="64"
                    height={chartHeight - padding.top - padding.bottom}
                    fill="transparent"
                    onMouseEnter={() => setActivePoint(point)}
                    onMouseLeave={() => setActivePoint(null)}
                    onFocus={() => setActivePoint(point)}
                    tabIndex={0}
                  />
                </g>
              );
            })}

            {selectedMetric === "investment_leads" ? (
              <>
                {points.map((point, index) => {
                  const x = getX(index, points.length);
                  const barWidth = 22;
                  const y = getY(point.investment, investmentMax);
                  const height = chartHeight - padding.bottom - y;

                  return (
                    <rect
                      key={`bar-${point.date}`}
                      x={x - barWidth / 2}
                      y={y}
                      width={barWidth}
                      height={height}
                      rx="4"
                      fill="#93C5FD"
                    />
                  );
                })}
                <path
                  d={buildSmoothPath(
                    points.map((point) => point.leads),
                    leadMax,
                  )}
                  fill="none"
                  stroke="#0F172A"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2.4"
                />
                {points.map((point, index) => {
                  const x = getX(index, points.length);
                  const y = getY(point.leads, leadMax);

                  return (
                    <circle
                      key={`lead-${point.date}`}
                      cx={x}
                      cy={y}
                      r="3"
                      fill="#0F172A"
                    />
                  );
                })}
              </>
            ) : (
              <LineSeries
                points={points}
                metric={selectedMetric}
                maxValue={selectedMetric === "cpl" ? cplMax : ctrMax}
              />
            )}
          </svg>
        </div>

        <div className="mt-2 min-h-12 rounded-md border border-black/10 bg-gray-50 px-3 py-2 text-[11px] text-[#717182]">
          {activePoint ? (
            <TooltipContent point={activePoint} metric={selectedMetric} />
          ) : (
            <span>Passe o cursor sobre o gráfico para ver os dados.</span>
          )}
        </div>
      </div>
    </section>
  );
}

function ReferenceLine({
  value,
  maxValue,
  label,
  labelSuffix,
}: {
  value: number;
  maxValue: number;
  label: string;
  labelSuffix?: string;
}) {
  const y = getY(value, maxValue);

  return (
    <g>
      <line
        x1={padding.left}
        x2={chartWidth - padding.right}
        y1={y}
        y2={y}
        stroke="#94A3B8"
        strokeDasharray="4 4"
        strokeWidth="1"
      />
      <text
        x={chartWidth - padding.right}
        y={y - 6}
        textAnchor="end"
        className="fill-[#717182] text-[10px]"
      >
        {label}{" "}
        {labelSuffix ? `${value}${labelSuffix}` : currencyFormatter.format(value)}
      </text>
    </g>
  );
}

function LineSeries({
  points,
  metric,
  maxValue,
}: {
  points: CampaignPerformancePoint[];
  metric: Exclude<CampaignChartMetric, "investment_leads">;
  maxValue: number;
}) {
  const values = points.map((point) => point[metric]);

  return (
    <>
      <path
        d={buildSmoothPath(values, maxValue)}
        fill="none"
        stroke="#0F172A"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2.4"
      />
      {points.map((point, index) => (
        <circle
          key={`${metric}-${point.date}`}
          cx={getX(index, points.length)}
          cy={getY(point[metric], maxValue)}
          r="3"
          fill="#0F172A"
        />
      ))}
    </>
  );
}

function TooltipContent({
  point,
  metric,
}: {
  point: CampaignPerformancePoint;
  metric: CampaignChartMetric;
}) {
  if (metric === "cpl") {
    const aboveGoal = point.cpl > 50;

    return (
      <span>
        <strong className="font-semibold text-[#0A0A0A]">{point.date}</strong>
        : CPL {currencyFormatter.format(point.cpl)}
        {aboveGoal ? (
          <span className="ml-1 text-amber-700">acima da meta de R$ 50,00</span>
        ) : null}
      </span>
    );
  }

  if (metric === "ctr") {
    return (
      <span>
        <strong className="font-semibold text-[#0A0A0A]">{point.date}</strong>
        : CTR {percentFormatter.format(point.ctr)}%
      </span>
    );
  }

  return (
    <span>
      <strong className="font-semibold text-[#0A0A0A]">{point.date}</strong>:{" "}
      {currencyFormatter.format(point.investment)} investidos, {point.leads}{" "}
      leads, CPL {currencyFormatter.format(point.cpl)} e CTR{" "}
      {percentFormatter.format(point.ctr)}%.
    </span>
  );
}
