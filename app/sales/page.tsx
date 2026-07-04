import { DataTable } from "@/app/ui/table";
import { getSales } from "@/lib/db";
import { formatCurrency, formatDate } from "@/util/format";

export const dynamic = "force-dynamic";

const weatherIcon: Record<string, string> = {
  맑음: "맑",
  흐림: "흐",
  비: "비",
  눈: "눈",
};

export default async function SalesPage() {
  const sales = await getSales();
  const total = sales.reduce((sum, sale) => sum + sale.amount, 0);
  const paymentTypes = ["카드", "현금", "지역상품권"];
  const paymentTotals = Object.fromEntries(
    paymentTypes.map((paymentType) => [
      paymentType,
      sales
        .filter((sale) => sale.paymentType === paymentType)
        .reduce((sum, sale) => sum + sale.amount, 0),
    ]),
  );

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
        <article className="metric primary"><span>전체 매출</span><strong>{formatCurrency(total)}</strong><small>{sales.length}건 합계</small></article>
        {paymentTypes.map((paymentType) => (
          <article className="metric" key={paymentType}>
            <span>{paymentType} 매출</span>
            <strong>{formatCurrency(paymentTotals[paymentType])}</strong>
            <small>{sales.filter((sale) => sale.paymentType === paymentType).length}건</small>
          </article>
        ))}
      </section>

      <article className="panel sales-panel page-panel">
        <div className="panel-title">
          <div><span className="kicker">ALL SALES</span><h2>전체 매출 내역</h2></div>
          <span className="record-count">{sales.length}건</span>
        </div>
        <DataTable
          columns={["날짜", "날씨", "기온", ...paymentTypes, "합계"]}
          rows={sales.map((sale) => [
            formatDate(sale.date),
            `${weatherIcon[sale.weather]} ${sale.weather}`,
            `${sale.temperature}°`,
            ...paymentTypes.map((paymentType) => sale.paymentType === paymentType ? formatCurrency(sale.amount) : "-"),
            formatCurrency(sale.amount),
          ])}
        />
      </article>
    </>
  );
}
