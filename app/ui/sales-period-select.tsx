"use client";

import { useRouter } from "next/navigation";

type Props = {
  mode: "month" | "year";
  selectedMonth: string;
  selectedYear: string;
  years: string[];
  months: string[];
};

export function SalesPeriodSelect({ mode, selectedMonth, selectedYear, years, months }: Props) {
  const router = useRouter();

  function move(nextMode: "month" | "year", year: string, month = selectedMonth) {
    if (nextMode === "year") {
      router.push(`/sales?view=year&year=${year}`);
      return;
    }

    router.push(`/sales?view=month&year=${year}&month=${month}`);
  }

  return (
    <section className="period-filter">
      <label>
        보기
        <select value={mode} onChange={(event) => move(event.target.value as "month" | "year", selectedYear)}>
          <option value="month">월별</option>
          <option value="year">년도별</option>
        </select>
      </label>

      <label>
        년도
        <select value={selectedYear} onChange={(event) => move(mode, event.target.value)}>
          {years.map((year) => <option key={year} value={year}>{year}년</option>)}
        </select>
      </label>

      {mode === "month" && (
        <label>
          월
          <select value={selectedMonth} onChange={(event) => move("month", selectedYear, event.target.value)}>
            {months.map((month) => <option key={month} value={month}>{Number(month.slice(5))}월</option>)}
          </select>
        </label>
      )}
    </section>
  );
}
