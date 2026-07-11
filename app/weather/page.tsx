import Link from "next/link";
import { WeatherChart } from "@/app/ui/charts";
import { DataTable } from "@/app/ui/table";
import { getSales } from "@/lib/db";
import { formatCompactCurrency, formatCurrency, formatDate } from "@/util/format";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function getMonth(date: string) {
  return date.slice(0, 7);
}

function isMonth(value: string | undefined) {
  if (!/^\d{4}-\d{2}$/.test(value ?? "")) return false;
  const monthNumber = Number(value?.slice(5, 7));
  return monthNumber >= 1 && monthNumber <= 12;
}

function formatMonthLabel(month: string) {
  const [year, monthNumber] = month.split("-");
  return `${year}년 ${monthNumber.padStart(2, "0")}월`;
}

function addMonths(month: string, amount: number) {
  const [year, monthNumber] = month.split("-").map(Number);
  const date = new Date(Date.UTC(year, monthNumber - 1 + amount, 1));
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

function monthHref(month: string) {
  return `/weather?month=${month}`;
}

export default async function WeatherPage({ searchParams }: { searchParams: SearchParams }) {
  const sales = await getSales();
  const params = await searchParams;
  const requestedMonth = firstValue(params.month);
  const fallbackMonth = sales[0] ? getMonth(sales[0].date) : "";
  const selectedMonth = isMonth(requestedMonth) ? requestedMonth! : fallbackMonth;
  const nextMonth = selectedMonth ? addMonths(selectedMonth, 1) : "";
  const previousMonth = selectedMonth ? addMonths(selectedMonth, -1) : "";
  const filteredSales = selectedMonth
    ? sales.filter((sale) => getMonth(sale.date) === selectedMonth)
    : [];
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
        <div className="panel-title">
          <div><span className="kicker">WEATHER SALES</span><h2>{selectedMonth ? formatMonthLabel(selectedMonth) : "월별 상세 내역"}</h2></div>
          <div className="month-pager">
            {previousMonth ? <Link href={monthHref(previousMonth)}>이전월</Link> : <span>이전월</span>}
            <strong>{filteredSales.length}건</strong>
            {nextMonth ? <Link href={monthHref(nextMonth)}>다음월</Link> : <span>다음월</span>}
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
