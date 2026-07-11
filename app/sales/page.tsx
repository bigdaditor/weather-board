import { DataTable } from "@/app/ui/table";
import { SalesPeriodSelect } from "@/app/ui/sales-period-select";
import { getSales, type Sale } from "@/lib/db";
import { formatCurrency, formatDate } from "@/util/format";
import {
  currentMonth,
  formatMonthLabel,
  monthFromDate,
  searchParam,
  type SearchParams,
  yearFromDate,
} from "@/util/month";
import { paymentTypes, summarizePayments } from "@/util/sales-summary";

export const dynamic = "force-dynamic";

const weatherIcon: Record<string, string> = {
  맑음: "맑",
  흐림: "흐",
  비: "비",
  강우: "비",
  눈: "눈",
};

function filterSales(sales: Sale[], mode: string, period: string) {
  return sales.filter((sale) => mode === "year" ? sale.date.startsWith(period) : monthFromDate(sale.date) === period);
}

function groupDailySales(sales: Sale[]) {
  const grouped = new Map<string, Sale[]>();

  for (const sale of sales) {
    grouped.set(sale.date, [...(grouped.get(sale.date) ?? []), sale]);
  }

  return [...grouped.entries()]
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([date, rows]) => {
      const first = rows[0];
      const total = rows.reduce((sum, sale) => sum + sale.amount, 0);
      const payments = summarizePayments(rows);
      return [
        formatDate(date),
        `${weatherIcon[first.weather] ?? first.weather} ${first.weather}`,
        ...paymentTypes.map((paymentType) => {
          const amount = payments[paymentType].amount;
          return amount > 0 ? formatCurrency(amount) : "-";
        }),
        formatCurrency(total),
      ];
    });
}

function groupMonthlySales(sales: Sale[]) {
  const grouped = new Map<string, Sale[]>();

  for (const sale of sales) {
    const month = monthFromDate(sale.date);
    grouped.set(month, [...(grouped.get(month) ?? []), sale]);
  }

  return [...grouped.entries()]
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([month, rows]) => {
      const total = rows.reduce((sum, sale) => sum + sale.amount, 0);
      const payments = summarizePayments(rows);
      return [
        formatMonthLabel(month),
        ...paymentTypes.map((paymentType) => {
          const amount = payments[paymentType].amount;
          return amount > 0 ? formatCurrency(amount) : "-";
        }),
        formatCurrency(total),
      ];
    });
}

export default async function SalesPage({ searchParams }: { searchParams: SearchParams }) {
  const sales = await getSales();
  const params = await searchParams;
  const months = [...new Set(sales.map((sale) => monthFromDate(sale.date)))].sort((a, b) => b.localeCompare(a));
  const years = [...new Set(sales.map((sale) => yearFromDate(sale.date)))].sort((a, b) => b.localeCompare(a));
  const mode = searchParam(params, "view") === "year" ? "year" : "month";
  const requestedMonth = searchParam(params, "month");
  const requestedYear = searchParam(params, "year");
  const fallbackMonth = months[0] ?? currentMonth();
  const hasRequestedYear = years.includes(requestedYear ?? "");
  const baseYear = hasRequestedYear ? requestedYear! : yearFromDate(fallbackMonth);
  const baseYearMonths = months.filter((month) => yearFromDate(month) === baseYear);
  const hasRequestedMonth = months.includes(requestedMonth ?? "")
    && (!hasRequestedYear || yearFromDate(requestedMonth!) === baseYear);
  const selectedMonth = hasRequestedMonth ? requestedMonth! : (baseYearMonths[0] ?? fallbackMonth);
  const selectedYear = mode === "year" && hasRequestedYear ? requestedYear! : yearFromDate(selectedMonth);
  const selectedPeriod = mode === "year" ? selectedYear : selectedMonth;
  const filteredSales = filterSales(sales, mode, selectedPeriod);
  const total = filteredSales.reduce((sum, sale) => sum + sale.amount, 0);
  const paymentSummary = summarizePayments(filteredSales);
  const rows = mode === "year" ? groupMonthlySales(filteredSales) : groupDailySales(filteredSales);
  const columns = mode === "year"
    ? ["월", ...paymentTypes, "합계"]
    : ["날짜", "날씨", ...paymentTypes, "합계"];
  const monthsInSelectedYear = months.filter((month) => yearFromDate(month) === selectedYear);

  return (
    <>
      <header>
        <div>
          <p className="eyebrow">SALES HISTORY</p>
          <h1>매출 내역</h1>
          <p>등록된 전체 매출과 결제 정보를 확인하세요.</p>
        </div>
      </header>

      <section className="metrics payment-metrics">
        <article className="metric primary"><span>{mode === "year" ? "년도 매출" : "월 매출"}</span><strong>{formatCurrency(total)}</strong><small>{filteredSales.length}건 합계</small></article>
        {paymentTypes.map((paymentType) => (
          <article className="metric" key={paymentType}>
            <span>{paymentType}</span>
            <strong>{formatCurrency(paymentSummary[paymentType].amount)}</strong>
            <small>{paymentSummary[paymentType].count}건</small>
          </article>
        ))}
      </section>

      <SalesPeriodSelect
        mode={mode}
        selectedMonth={selectedMonth}
        selectedYear={selectedYear}
        years={years}
        months={monthsInSelectedYear}
      />

      <article className="panel sales-panel page-panel">
        <div className="panel-title">
          <div><span className="kicker">ALL SALES</span><h2>{mode === "year" ? `${selectedYear}년 매출` : formatMonthLabel(selectedMonth)}</h2></div>
          <span className="record-count">{rows.length}줄</span>
        </div>
        <DataTable columns={columns} rows={rows} />
      </article>
    </>
  );
}
