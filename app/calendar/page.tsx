import Link from "next/link";
import { createSale } from "@/app/actions";
import { CalendarGrid } from "@/app/calendar/calendar-grid";
import { CalendarSaleButton } from "@/app/calendar/calendar-sale-button";
import { getSales } from "@/lib/db";
import {
  addMonths,
  currentMonth,
  formatMonthKicker,
  formatMonthLabel,
  monthFromDate,
  selectedMonth,
  type SearchParams,
} from "@/util/month";

export const dynamic = "force-dynamic";

export default async function CalendarPage({ searchParams }: { searchParams: SearchParams }) {
  const allSales = await getSales();
  const params = await searchParams;
  const fallbackMonth = allSales[0] ? monthFromDate(allSales[0].date) : currentMonth();
  const month = selectedMonth(params, fallbackMonth);
  const sales = allSales.filter((sale) => monthFromDate(sale.date) === month);
  const firstDay = new Date(`${month}-01T00:00:00Z`);
  // Convert Sunday-first getUTCDay() to a Monday-first calendar index.
  const startOffset = (firstDay.getUTCDay() + 6) % 7;
  const daysInMonth = new Date(Date.UTC(firstDay.getUTCFullYear(), firstDay.getUTCMonth() + 1, 0)).getUTCDate();
  const totalCells = Math.max(35, Math.ceil((startOffset + daysInMonth) / 7) * 7);
  const salesByDate = new Map<string, typeof sales>();

  for (const sale of sales) {
    const rows = salesByDate.get(sale.date) ?? [];
    rows.push(sale);
    salesByDate.set(sale.date, rows);
  }

  const calendar = Array.from({ length: totalCells }, (_, index) => {
    const day = index - startOffset + 1;
    if (day < 1 || day > daysInMonth) return { date: null, day: null, rows: [] };

    const date = `${month}-${String(day).padStart(2, "0")}`;
    return { date, day, rows: salesByDate.get(date) ?? [] };
  });
  const today = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Seoul" });
  const defaultDate = today.startsWith(month) ? today : `${month}-01`;

  return (
    <>
      <header className="calendar-header">
        <div>
          <p className="eyebrow">DAILY VIEW</p>
          <h1>매출 캘린더</h1>
          <p>날짜별 날씨와 매출을 월간 캘린더에서 확인하세요.</p>
        </div>
        <CalendarSaleButton createSaleAction={createSale} defaultDate={defaultDate} />
      </header>

      <article className="panel calendar-panel page-panel">
        <div className="panel-title">
          <div><span className="kicker">{formatMonthKicker(month)}</span><h2>{formatMonthLabel(month)}</h2></div>
          <div className="month-pager">
            <Link href={`/calendar?month=${addMonths(month, -1)}`}>이전월</Link>
            <strong>{sales.length}건</strong>
            <Link href={`/calendar?month=${addMonths(month, 1)}`}>다음월</Link>
          </div>
        </div>
        <CalendarGrid calendar={calendar} createSaleAction={createSale} />
      </article>
    </>
  );
}
