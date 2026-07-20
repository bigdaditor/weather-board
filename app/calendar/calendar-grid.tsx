import type { Sale } from "@/lib/db";
import { formatCurrency } from "@/util/format";

const weatherIcon: Record<string, string> = {
  맑음: "맑",
  흐림: "흐",
  비: "비",
  강우: "비",
  눈: "눈",
};

type CalendarCell = { date: string | null; day: number | null; rows: Sale[] };

export function CalendarGrid({
  calendar,
}: {
  calendar: CalendarCell[];
}) {
  return (
    <>
      <div className="calendar week">
        {["일", "월", "화", "수", "목", "금", "토"].map((day) => <span key={day}>{day}</span>)}
      </div>
      <div className="calendar calendar-large">
        {calendar.map(({ date, day, rows }, index) => (
          <div className={rows.length ? "calendar-day has-sale" : "calendar-day"} key={date ?? index}>
            {date && <b>{day}</b>}
            {rows.map((sale) => (
              <div className="calendar-entry" key={sale.id}>
                <span>{weatherIcon[sale.weather] ?? sale.weather} {sale.temperature}°</span>
                <strong>{formatCurrency(sale.amount)}</strong>
              </div>
            ))}
          </div>
        ))}
      </div>
    </>
  );
}
