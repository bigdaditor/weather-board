import Link from "next/link";
import { getSales } from "@/lib/db";
import { formatCurrency } from "@/util/format";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

const weatherIcon: Record<string, string> = {
  맑음: "맑",
  흐림: "흐",
  비: "비",
  강우: "비",
  눈: "눈",
};

function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function getMonth(date: string) {
  return date.slice(0, 7);
}

function getCurrentMonth() {
  const parts = new Intl.DateTimeFormat("en-US", {
    month: "2-digit",
    timeZone: "Asia/Seoul",
    year: "numeric",
  }).formatToParts(new Date());
  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  return `${year}-${month}`;
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

function formatMonthKicker(month: string) {
  const date = new Date(`${month}-01T00:00:00Z`);
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    timeZone: "UTC",
    year: "numeric",
  }).format(date).toUpperCase();
}

function addMonths(month: string, amount: number) {
  const [year, monthNumber] = month.split("-").map(Number);
  const date = new Date(Date.UTC(year, monthNumber - 1 + amount, 1));
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

function monthHref(month: string) {
  return `/calendar?month=${month}`;
}

export default async function CalendarPage({ searchParams }: { searchParams: SearchParams }) {
  const allSales = await getSales();
  const params = await searchParams;
  const requestedMonth = firstValue(params.month);
  const fallbackMonth = allSales[0] ? getMonth(allSales[0].date) : getCurrentMonth();
  const month = isMonth(requestedMonth) ? requestedMonth! : fallbackMonth;
  const sales = allSales.filter((sale) => sale.date.startsWith(month));
  const firstDay = new Date(`${month}-01T00:00:00Z`);
  const startOffset = firstDay.getUTCDay();
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
    if (day < 1 || day > daysInMonth) return { day: null, rows: [] };

    const date = `${month}-${String(day).padStart(2, "0")}`;
    return { day, rows: salesByDate.get(date) ?? [] };
  });

  return (
    <>
      <header className="calendar-header">
        <div>
          <p className="eyebrow">DAILY VIEW</p>
          <h1>매출 캘린더</h1>
          <p>날짜별 날씨와 매출을 월간 캘린더에서 확인하세요.</p>
        </div>
      </header>

      <article className="panel calendar-panel page-panel">
        <div className="panel-title">
          <div><span className="kicker">{formatMonthKicker(month)}</span><h2>{formatMonthLabel(month)}</h2></div>
          <div className="month-pager">
            <Link href={monthHref(addMonths(month, -1))}>이전월</Link>
            <strong>{sales.length}건</strong>
            <Link href={monthHref(addMonths(month, 1))}>다음월</Link>
          </div>
        </div>
        <div className="calendar week">
          {["일", "월", "화", "수", "목", "금", "토"].map((day) => <span key={day}>{day}</span>)}
        </div>
        <div className="calendar calendar-large">
          {calendar.map(({ day, rows }, index) => (
            <div className={rows.length ? "calendar-day has-sale" : "calendar-day"} key={index}>
              {day && <b>{day}</b>}
              {rows.map((sale) => (
                <div className="calendar-entry" key={sale.id}>
                  <span>{weatherIcon[sale.weather] ?? sale.weather} {sale.temperature}°</span>
                  <strong>{formatCurrency(sale.amount)}</strong>
                </div>
              ))}
            </div>
          ))}
        </div>
      </article>
    </>
  );
}
