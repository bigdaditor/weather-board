"use client";

import { useState } from "react";
import type { CreateSaleState } from "@/app/actions";
import { SaleEntryModal } from "@/app/ui/sale-entry-modal";
import type { Sale } from "@/lib/db";
import { formatCurrency } from "@/util/format";

const weatherIcon: Record<string, string> = {
  맑음: "☀️",
  흐림: "☁️",
  비: "🌧️",
  강우: "🌧️",
  눈: "❄️",
};

type CalendarCell = { date: string | null; day: number | null; rows: Sale[] };

export function CalendarGrid({
  calendar,
  createSaleAction,
}: {
  calendar: CalendarCell[];
  createSaleAction: (state: CreateSaleState, formData: FormData) => Promise<CreateSaleState>;
}) {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  return (
    <>
      <div className="calendar week">
        {["월", "화", "수", "목", "금", "토", "일"].map((day) => <span key={day}>{day}</span>)}
      </div>
      <div className="calendar calendar-large">
        {calendar.map(({ date, day, rows }, index) => {
          const className = `${rows.length ? "calendar-day has-sale" : "calendar-day"}${!date ? " is-empty" : ""}${index % 7 === 6 ? " is-sunday" : ""}${index % 7 === 5 ? " is-saturday" : ""}`;
          const dailyTotal = rows.reduce((sum, sale) => sum + sale.amount, 0);
          const weather = rows[0];
          const content = (
            <>
              {date && <b>{day}</b>}
              {weather && (
                <span className="calendar-entry">
                  <span>{weatherIcon[weather.weather] ?? weather.weather} {weather.temperature}°</span>
                  <strong>{formatCurrency(dailyTotal)}</strong>
                </span>
              )}
            </>
          );

          return date ? (
            <button
              aria-label={`${date} 매출 입력`}
              className={className}
              key={date}
              onClick={() => setSelectedDate(date)}
              type="button"
            >
              {content}
            </button>
          ) : (
            <div className={className} key={index}>{content}</div>
          );
        })}
      </div>
      <SaleEntryModal
        createSaleAction={createSaleAction}
        date={selectedDate ?? ""}
        open={selectedDate !== null}
        onClose={() => setSelectedDate(null)}
      />
    </>
  );
}
