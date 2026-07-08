import { getSales } from "@/lib/db";
import { formatCurrency } from "@/util/format";

export const dynamic = "force-dynamic";

const month = "2026-06";

const weatherIcon: Record<string, string> = {
  맑음: "맑",
  흐림: "흐",
  비: "비",
  강우: "비",
  눈: "눈",
};

export default async function CalendarPage() {
  const sales = (await getSales()).filter((sale) => sale.date.startsWith(month));
  const firstDay = new Date(`${month}-01T00:00:00Z`);
  const startOffset = firstDay.getUTCDay();
  const daysInMonth = new Date(Date.UTC(firstDay.getUTCFullYear(), firstDay.getUTCMonth() + 1, 0)).getUTCDate();
  const salesByDate = new Map<string, typeof sales>();

  for (const sale of sales) {
    const rows = salesByDate.get(sale.date) ?? [];
    rows.push(sale);
    salesByDate.set(sale.date, rows);
  }

  const calendar = Array.from({ length: 35 }, (_, index) => {
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
          <div><span className="kicker">JUNE 2026</span><h2>2026년 6월</h2></div>
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
