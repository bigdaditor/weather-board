import type { Sale } from "@/lib/db";
import { formatCompactCurrency, formatShortDate } from "@/util/format";

export function LineChart({ sales }: { sales: Sale[] }) {
  const ordered = [...sales].reverse();
  const max = Math.max(...ordered.map((sale) => sale.amount));
  const points = ordered.map((sale, index) => `${24 + index * (552 / (ordered.length - 1))},${185 - sale.amount / max * 145}`).join(" ");

  return (
    <div className="line-chart">
      <div className="y-labels"><span>1.5M</span><span>1.0M</span><span>500K</span><span>0</span></div>
      <svg viewBox="0 0 600 210" preserveAspectRatio="none">
        <defs><linearGradient id="area" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="oklch(57.61% .2508 258.23)" stopOpacity=".24" /><stop offset="100%" stopColor="white" stopOpacity="0" /></linearGradient></defs>
        {[40, 85, 130, 175].map((y) => <line key={y} x1="20" y1={y} x2="590" y2={y} />)}
        <polygon points={`${points} 576,190 24,190`} fill="url(#area)" />
        <polyline points={points} />
        {ordered.map((sale, index) => <circle key={sale.id} cx={24 + index * (552 / (ordered.length - 1))} cy={185 - sale.amount / max * 145} r="4" />)}
      </svg>
      <div className="x-labels">{ordered.filter((_, index) => index % 2 === 0).map((sale) => <span key={sale.id}>{formatShortDate(sale.date)}</span>)}</div>
    </div>
  );
}

export function WeatherChart({ sales }: { sales: Sale[] }) {
  const weather = ["맑음", "흐림", "비", "눈"].map((label) => {
    const rows = sales.filter((sale) => sale.weather === label);
    return { label, amount: rows.reduce((sum, sale) => sum + sale.amount, 0) / (rows.length || 1) };
  });
  const max = Math.max(...weather.map((item) => item.amount));

  return <div className="weather-chart">{weather.map((item) => <div className="weather-bar" key={item.label}><span>{item.label}</span><div><i style={{ width: `${item.amount / max * 100}%` }} /></div><strong>{formatCompactCurrency(item.amount)}</strong></div>)}</div>;
}
