import type { CSSProperties } from "react";
import type { Sale } from "@/lib/db";
import { formatCompactCurrency, formatCurrency, formatShortDate } from "@/util/format";
import { summarizeWeatherSales } from "@/util/sales-summary";

const lineChartWidth = 600;
const lineChartHeight = 210;
const chartLeft = 36;
const chartRight = 582;
const chartTop = 28;
const chartBottom = 170;

function formatAxisCurrency(value: number) {
  if (value >= 10000) return `${Math.round(value / 10000)}만원`;
  return `${Math.round(value).toLocaleString("ko-KR")}원`;
}

export function LineChart({ sales, days = 30 }: { sales: Sale[]; days?: number }) {
  const daily = new Map<string, number>();

  for (const sale of sales) {
    daily.set(sale.date, (daily.get(sale.date) ?? 0) + sale.amount);
  }

  const ordered = [...daily.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-days)
    .map(([date, amount]) => ({ date, amount }));
  const maxAmount = Math.max(...ordered.map((sale) => sale.amount), 1);
  const max = Math.ceil(maxAmount / 500000) * 500000 || 500000;
  const stepX = ordered.length > 1 ? (chartRight - chartLeft) / (ordered.length - 1) : 0;
  const pointFor = (amount: number, index: number) => ({
    x: ordered.length > 1 ? chartLeft + index * stepX : (chartLeft + chartRight) / 2,
    y: chartBottom - (amount / max) * (chartBottom - chartTop),
  });
  const points = ordered.map((sale, index) => {
    const { x, y } = pointFor(sale.amount, index);
    return `${x},${y}`;
  }).join(" ");
  const chartPoints = ordered.map((sale, index) => {
    const { x, y } = pointFor(sale.amount, index);
    return {
      ...sale,
      x,
      y,
      xPercent: x / lineChartWidth * 100,
      yPercent: y / lineChartHeight * 100,
    };
  });
  const baseline = chartBottom + 12;
  const yTicks = [max, Math.round(max / 2), 0];
  const labelStep = Math.max(1, Math.ceil(ordered.length / 5));
  const visibleLabels = ordered.filter((_, index) => index === 0 || index === ordered.length - 1 || index % labelStep === 0);

  return (
    <div className="line-chart">
      <div className="y-labels">{yTicks.map((tick) => <span key={tick}>{formatAxisCurrency(tick)}</span>)}</div>
      <svg viewBox={`0 0 ${lineChartWidth} ${lineChartHeight}`} preserveAspectRatio="none">
        <defs><linearGradient id="area" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="oklch(57.61% .2508 258.23)" stopOpacity=".24" /><stop offset="100%" stopColor="white" stopOpacity="0" /></linearGradient></defs>
        {yTicks.map((tick) => {
          const y = chartBottom - (tick / max) * (chartBottom - chartTop);
          return <line key={tick} x1={chartLeft} y1={y} x2={chartRight} y2={y} />;
        })}
        {points && <polygon points={`${points} ${chartRight},${baseline} ${chartLeft},${baseline}`} fill="url(#area)" />}
        <polyline points={points} />
        {chartPoints.map((sale) => <circle key={sale.date} cx={sale.x} cy={sale.y} r={ordered.length > 45 ? "3" : "5"} />)}
      </svg>
      <div className="chart-hover-layer" aria-hidden={ordered.length === 0}>
        {chartPoints.map((sale) => (
          <button
            aria-label={`${formatShortDate(sale.date)} 매출 ${formatCurrency(sale.amount)}`}
            className="chart-hover-point"
            key={sale.date}
            style={{
              "--point-x": `${sale.xPercent}%`,
              "--point-y": `${sale.yPercent}%`,
            } as CSSProperties}
            type="button"
          >
            <span className="chart-tooltip">
              <b>{formatShortDate(sale.date)}</b>
              <strong>{formatCurrency(sale.amount)}</strong>
            </span>
          </button>
        ))}
      </div>
      <div className="x-labels">{visibleLabels.map((sale) => <span key={sale.date}>{formatShortDate(sale.date)}</span>)}</div>
    </div>
  );
}

export function WeatherChart({ sales }: { sales: Sale[] }) {
  const weather = summarizeWeatherSales(sales).map(({ weather, average }) => ({ label: weather, amount: average }));
  const max = Math.max(...weather.map((item) => item.amount), 1);

  return <div className="weather-chart">{weather.map((item) => <div className="weather-bar" key={item.label}><span>{item.label}</span><div><i style={{ width: `${item.amount / max * 100}%` }} /></div><strong>{formatCompactCurrency(item.amount)}</strong></div>)}</div>;
}
