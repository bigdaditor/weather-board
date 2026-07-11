import Link from "next/link";
import { WeatherChart } from "@/app/ui/charts";
import { DataTable } from "@/app/ui/table";
import { getSales } from "@/lib/db";
import { formatCompactCurrency, formatCurrency, formatDate } from "@/util/format";
import {
  addMonths,
  formatMonthLabel,
  monthFromDate,
  selectedMonth,
  type SearchParams,
} from "@/util/month";
import { summarizeWeatherSales } from "@/util/sales-summary";

export const dynamic = "force-dynamic";

export default async function WeatherPage({ searchParams }: { searchParams: SearchParams }) {
  const sales = await getSales();
  const params = await searchParams;
  const month = selectedMonth(params, sales[0] ? monthFromDate(sales[0].date) : "");
  const nextMonth = month ? addMonths(month, 1) : "";
  const previousMonth = month ? addMonths(month, -1) : "";
  const filteredSales = month
    ? sales.filter((sale) => monthFromDate(sale.date) === month)
    : [];
  const summaries = summarizeWeatherSales(filteredSales);

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
            <small>평균 매출 · {summary.count}일</small>
          </article>
        ))}
      </section>

      <article className="panel chart-panel page-panel">
        <div className="panel-title">
          <div><span className="kicker">AVERAGE SALES</span><h2>{month ? `${formatMonthLabel(month)} 날씨별 평균 매출` : "날씨별 평균 매출 비교"}</h2></div>
          <span className="sync">● API 연동</span>
        </div>
        <WeatherChart sales={filteredSales} />
      </article>

      <article className="panel sales-panel page-panel">
        <div className="panel-title">
          <div><span className="kicker">WEATHER SALES</span><h2>{month ? formatMonthLabel(month) : "월별 상세 내역"}</h2></div>
          <div className="month-pager">
            {previousMonth ? <Link href={`/weather?month=${previousMonth}`}>이전월</Link> : <span>이전월</span>}
            <strong>{filteredSales.length}건</strong>
            {nextMonth ? <Link href={`/weather?month=${nextMonth}`}>다음월</Link> : <span>다음월</span>}
          </div>
        </div>
        <DataTable
          columns={["날짜", "날씨", "기온", "결제 수단", "매출"]}
          rows={filteredSales.map((sale) => [
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
