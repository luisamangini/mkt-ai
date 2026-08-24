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

function buildPath(values: number[], maxValue: number, minValue = 0) {
  const points = values.map((value, index) => ({
    x: getX(index, values.length),
    y: getY(value, maxValue, minValue),
  }));

  return points
    .map((point, index) => {
      if (index === 0) {
        return `M ${point.x.toFixed(2)} ${point.y.toFixed(2)}`;
      }

      return `L ${point.x.toFixed(2)} ${point.y.toFixed(2)}`;
    })
    .join(" ");
}

function formatCurrencyAxis(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0, notation: value >= 10000 ? "compact" : "standard" }).format(value);
}

function ticks(maxValue: number) {
  return Array.from({ length: 4 }, (_, index) => (maxValue / 3) * index);
}

export function CampaignPerformanceChart({
  points,
}: CampaignPerformanceChartProps) {
  const [selectedMetric, setSelectedMetric] =
    useState<CampaignChartMetric>("investment_leads");
  const [activePoint, setActivePoint] =
    useState<CampaignPerformancePoint | null>(null);

  const investmentMax = Math.max(...points.map((point) => point.investment), 1);
  const leadMax = Math.max(...points.map((point) => point.leads), 1);
  const cplMax = Math.max(...points.map((point) => point.cpl), 1);
  const ctrMax = Math.max(...points.map((point) => point.ctr), 1);
  const investmentTicks = ticks(investmentMax);
  const leadTicks = ticks(leadMax);
  const cplTicks = ticks(cplMax);
  const ctrTicks = ticks(ctrMax);

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
    <section className="flex h-full min-h-[430px] flex-col rounded-[10px] border border-border bg-card">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border px-4 py-3">
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-foreground">
            Investimento e geração de leads
          </h2>
          <p className="mt-1 text-[11px] text-muted-foreground">
            Histórico real por snapshot persistido
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
        <div className="mb-3 flex flex-wrap items-center gap-4 text-[10px] text-muted-foreground">
          {selectedMetric === "investment_leads" ? (
            <>
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-sm bg-[#93C5FD]" />
                Investimento
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-foreground" />
                Leads gerados
              </span>
            </>
          ) : (
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-foreground" />
              {activeLabel}
            </span>
          )}
        </div>

        {points.length ? <div className="min-h-[320px] w-full overflow-hidden">
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
                    stroke="var(--border)"
                    strokeWidth="1"
                  />
                  <text
                    x={padding.left - 10}
                    y={y + 3}
                    textAnchor="end"
                    className="fill-muted-foreground text-[10px]"
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
                      className="fill-muted-foreground text-[10px]"
                    >
                      {integerFormatter.format(tick)}
                    </text>
                  );
                })
              : null}

            {points.map((point, index) => {
              const x = getX(index, points.length);

              return (
                <g key={point.date}>
                  <text
                    x={x}
                    y={chartHeight - 12}
                    textAnchor="middle"
                    className="fill-muted-foreground text-[10px]"
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
                  d={buildPath(
                    points.map((point) => point.leads),
                    leadMax,
                  )}
                  fill="none"
                  stroke="var(--foreground)"
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
                      fill="var(--foreground)"
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
        </div> : <div className="flex min-h-[320px] items-center justify-center text-[11px] text-muted-foreground">Nenhum histórico de snapshots disponível.</div>}

        <div className="mt-2 min-h-12 rounded-md border border-border bg-muted px-3 py-2 text-[11px] text-muted-foreground">
          {!points.length ? (
            <span>O gráfico será exibido quando houver snapshots persistidos.</span>
          ) : activePoint ? (
            <TooltipContent point={activePoint} metric={selectedMetric} />
          ) : (
            <span>Passe o cursor sobre o gráfico para ver os dados.</span>
          )}
        </div>
      </div>
    </section>
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
        d={buildPath(values, maxValue)}
        fill="none"
        stroke="var(--foreground)"
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
          fill="var(--foreground)"
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
    return (
      <span>
        <strong className="font-semibold text-foreground">{point.date}</strong>
        : CPL {currencyFormatter.format(point.cpl)}
      </span>
    );
  }

  if (metric === "ctr") {
    return (
      <span>
        <strong className="font-semibold text-foreground">{point.date}</strong>
        : CTR {percentFormatter.format(point.ctr)}%
      </span>
    );
  }

  return (
    <span>
      <strong className="font-semibold text-foreground">{point.date}</strong>:{" "}
      {currencyFormatter.format(point.investment)} investidos, {point.leads}{" "}
      leads, CPL {currencyFormatter.format(point.cpl)} e CTR{" "}
      {percentFormatter.format(point.ctr)}%.
    </span>
  );
}
