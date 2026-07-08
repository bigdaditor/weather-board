import { DataTable } from "@/app/ui/table";
import { SalesPeriodSelect } from "@/app/ui/sales-period-select";
import { getSales, type Sale } from "@/lib/db";
import { formatCurrency, formatDate } from "@/util/format";

export const dynamic = "force-dynamic";

const weatherIcon: Record<string, string> = {
  맑음: "맑",
  흐림: "흐",
  비: "비",
  강우: "비",
  눈: "눈",
};

const paymentTypes = ["카드", "현금", "지역상품권"];

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function getMonth(date: string) {
  return date.slice(0, 7);
}

function getYear(date: string) {
  return date.slice(0, 4);
}

function formatMonthLabel(month: string) {
  const [year, monthNumber] = month.split("-");
  return `${year}년 ${Number(monthNumber)}월`;
}

function filterSales(sales: Sale[], mode: string, period: string) {
  return sales.filter((sale) => mode === "year" ? sale.date.startsWith(period) : getMonth(sale.date) === period);
}

function sumPayment(rows: Sale[], paymentType: string) {
  return rows
    .filter((sale) => sale.paymentType === paymentType)
    .reduce((sum, sale) => sum + sale.amount, 0);
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
      return [
        formatDate(date),
        `${weatherIcon[first.weather] ?? first.weather} ${first.weather}`,
        ...paymentTypes.map((paymentType) => {
          const amount = sumPayment(rows, paymentType);
          return amount > 0 ? formatCurrency(amount) : "-";
        }),
        formatCurrency(total),
      ];
    });
}

function groupMonthlySales(sales: Sale[]) {
  const grouped = new Map<string, Sale[]>();

  for (const sale of sales) {
    const month = getMonth(sale.date);
    grouped.set(month, [...(grouped.get(month) ?? []), sale]);
  }

  return [...grouped.entries()]
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([month, rows]) => {
      const total = rows.reduce((sum, sale) => sum + sale.amount, 0);
      return [
        formatMonthLabel(month),
        ...paymentTypes.map((paymentType) => {
          const amount = sumPayment(rows, paymentType);
          return amount > 0 ? formatCurrency(amount) : "-";
        }),
        formatCurrency(total),
      ];
    });
}

export default async function SalesPage({ searchParams }: { searchParams: SearchParams }) {
  const sales = await getSales();
  const params = await searchParams;
  const months = [...new Set(sales.map((sale) => getMonth(sale.date)))].sort((a, b) => b.localeCompare(a));
  const years = [...new Set(sales.map((sale) => getYear(sale.date)))].sort((a, b) => b.localeCompare(a));
  const mode = firstValue(params.view) === "year" ? "year" : "month";
  const requestedMonth = firstValue(params.month);
  const requestedYear = firstValue(params.year);
  const fallbackMonth = months[0] ?? "2026-06";
  const hasRequestedYear = years.includes(requestedYear ?? "");
  const baseYear = hasRequestedYear ? requestedYear! : getYear(fallbackMonth);
  const baseYearMonths = months.filter((month) => getYear(month) === baseYear);
  const hasRequestedMonth = months.includes(requestedMonth ?? "")
    && (!hasRequestedYear || getYear(requestedMonth!) === baseYear);
  const selectedMonth = hasRequestedMonth ? requestedMonth! : (baseYearMonths[0] ?? fallbackMonth);
  const selectedYear = mode === "year" && hasRequestedYear ? requestedYear! : getYear(selectedMonth);
  const selectedPeriod = mode === "year" ? selectedYear : selectedMonth;
  const filteredSales = filterSales(sales, mode, selectedPeriod);
  const total = filteredSales.reduce((sum, sale) => sum + sale.amount, 0);
  const paymentTotals = Object.fromEntries(
    paymentTypes.map((paymentType) => [
      paymentType,
      sumPayment(filteredSales, paymentType),
    ]),
  );
  const rows = mode === "year" ? groupMonthlySales(filteredSales) : groupDailySales(filteredSales);
  const columns = mode === "year"
    ? ["월", ...paymentTypes, "합계"]
    : ["날짜", "날씨", ...paymentTypes, "합계"];
  const monthsInSelectedYear = months.filter((month) => getYear(month) === selectedYear);

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
            <strong>{formatCurrency(paymentTotals[paymentType])}</strong>
            <small>{filteredSales.filter((sale) => sale.paymentType === paymentType).length}건</small>
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
