import { WeatherChart } from "@/app/ui/charts";
import { DataTable } from "@/app/ui/table";
import { getSales } from "@/lib/db";
import { formatCompactCurrency, formatCurrency, formatDate } from "@/util/format";

export const dynamic = "force-dynamic";

export default function WeatherPage() {
  const sales = getSales();
  const summaries = ["맑음", "흐림", "비", "눈"].map((weather) => {
    const rows = sales.filter((sale) => sale.weather === weather);
    const total = rows.reduce((sum, sale) => sum + sale.amount, 0);
    return { weather, rows, total, average: total / (rows.length || 1) };
  });

  return (
    <>
      <header>
        <div>
          <p className="eyebrow">WEATHER IMPACT</p>
          <h1>날씨별 매출</h1>
          <p>날씨 조건별 매출 차이와 상세 내역을 비교하세요.</p>
        </div>
      </header>

      <section className="weather-summary-grid">
        {summaries.map((summary) => (
          <article className="weather-summary" key={summary.weather}>
            <span>{summary.weather}</span>
            <strong>{formatCompactCurrency(summary.average)}</strong>
            <small>평균 매출 · {summary.rows.length}일</small>
          </article>
        ))}
      </section>

      <article className="panel chart-panel page-panel">
        <div className="panel-title">
          <div><span className="kicker">AVERAGE SALES</span><h2>날씨별 평균 매출 비교</h2></div>
          <span className="sync">● API 연동</span>
        </div>
        <WeatherChart sales={sales} />
      </article>

      <article className="panel sales-panel page-panel">
        <div className="panel-title"><div><span className="kicker">WEATHER SALES</span><h2>날씨별 상세 내역</h2></div></div>
        <DataTable
          columns={["날짜", "날씨", "기온", "결제 수단", "매출"]}
          rows={sales.map((sale) => [
            formatDate(sale.date),
            sale.weather,
            `${sale.temperature}°`,
            sale.paymentType,
            formatCurrency(sale.amount),
          ])}
        />
      </article>
    </>
  );
}
