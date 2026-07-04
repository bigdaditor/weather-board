import { getSales } from "@/lib/db";
import { formatCurrency } from "@/util/format";

export const dynamic = "force-dynamic";

const weatherIcon: Record<string, string> = {
  맑음: "맑",
  흐림: "흐",
  비: "비",
  눈: "눈",
};

export default async function CalendarPage() {
  const sales = await getSales();
  const calendar = Array.from({ length: 35 }, (_, index) => {
    const day = index - 4;
    return day > 0 && day <= 30 ? sales.filter((sale) => Number(sale.date.slice(8)) === day) : [];
  });

  return (
    <>
      <header>
        <div>
          <p className="eyebrow">DAILY VIEW</p>
          <h1>매출 캘린더</h1>
          <p>날짜별 날씨와 매출을 월간 캘린더에서 확인하세요.</p>
        </div>
      </header>

      <article className="panel calendar-panel page-panel">
        <div className="panel-title">
          <div><span className="kicker">JUNE 2026</span><h2>2026년 6월</h2></div>
          <div className="calendar-nav"><button aria-label="이전 달">‹</button><button aria-label="다음 달">›</button></div>
        </div>
        <div className="calendar week">
          {["일", "월", "화", "수", "목", "금", "토"].map((day) => <span key={day}>{day}</span>)}
        </div>
        <div className="calendar calendar-large">
          {calendar.map((rows, index) => (
            <div className={rows.length ? "calendar-day has-sale" : "calendar-day"} key={index}>
              {index > 4 && index < 35 && <b>{index - 4}</b>}
              {rows.map((sale) => (
                <div className="calendar-entry" key={sale.id}>
                  <span>{weatherIcon[sale.weather]} {sale.temperature}°</span>
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
