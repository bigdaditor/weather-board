"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { MonthlySalesChart, WeeklySalesChart, YearOverYearSalesChart } from "@/app/ui/charts";
import { Button } from "@/app/ui/button";
import { DataTable } from "@/app/ui/table";
import { Modal } from "@/app/ui/modal";
import type { CreateSaleState } from "@/app/actions";
import type { Sale } from "@/lib/db";
import { formatCurrency, formatDate } from "@/util/format";
import { addMonths, currentMonth as getCurrentMonth, formatMonthLabel, monthFromDate } from "@/util/month";
import { paymentTypes, summarizePayments } from "@/util/sales-summary";

type Props = {
  sales: Sale[];
  createSaleAction: (
    state: CreateSaleState,
    formData: FormData,
  ) => Promise<CreateSaleState>;
};

export default function DashboardScreen({ sales, createSaleAction }: Props) {
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);
  const [createDefaults, setCreateDefaults] = useState({ date: "", amount: "", paymentType: "카드" });
  const [createError, setCreateError] = useState("");
  const [createPending, setCreatePending] = useState(false);
  const createSubmitting = useRef(false);
  const [syncPending, setSyncPending] = useState(false);
  const [syncMessage, setSyncMessage] = useState("");
  const [currentMonth, setCurrentMonth] = useState(getCurrentMonth);
  const currentMonthSales = sales.filter((sale) => monthFromDate(sale.date) === currentMonth);
  const currentMonthTotal = currentMonthSales.reduce((sum, sale) => sum + sale.amount, 0);
  const dailySales = new Map<string, Sale[]>();

  for (const sale of currentMonthSales) {
    dailySales.set(sale.date, [...(dailySales.get(sale.date) ?? []), sale]);
  }

  const dailyTotals = [...dailySales].map(([date, rows]) => ({
    date,
    amount: rows.reduce((sum, sale) => sum + sale.amount, 0),
  }));
  const average = dailyTotals.length > 0 ? Math.round(currentMonthTotal / dailyTotals.length) : 0;
  const best = [...dailyTotals].sort((a, b) => b.amount - a.amount)[0];
  const weatherTotals = new Map<string, { total: number; dates: Set<string> }>();

  for (const sale of currentMonthSales) {
    if (sale.weather === "미동기화") continue;
    const weather = weatherTotals.get(sale.weather) ?? { total: 0, dates: new Set<string>() };
    weather.total += sale.amount;
    weather.dates.add(sale.date);
    weatherTotals.set(sale.weather, weather);
  }

  const bestWeather = [...weatherTotals]
    .map(([weather, value]) => ({ weather, average: value.total / value.dates.size }))
    .sort((a, b) => b.average - a.average)[0];

  const salesGroups = [...dailySales.entries()]
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([date, rows]) => {
      const payments = summarizePayments(rows);
      return {
        rows,
        cells: [
          formatDate(date),
          rows[0].weather,
          ...paymentTypes.map((paymentType) => payments[paymentType].amount > 0
            ? formatCurrency(payments[paymentType].amount)
            : "-"),
          formatCurrency(rows.reduce((sum, sale) => sum + sale.amount, 0)),
        ],
      };
    });
  const salesRows = salesGroups.map(({ cells }) => cells);

  async function synchronizeWeather() {
    setSyncPending(true);
    setSyncMessage("");
    try {
      const response = await fetch("/api/weather", { method: "POST" });
      const body = await response.json() as { detail?: string } | unknown[];
      if (!response.ok) {
        if (response.status === 404) setSyncMessage("동기화할 매출이 없습니다.");
        else setSyncMessage(!Array.isArray(body) && body.detail ? body.detail : "날씨 동기화에 실패했습니다.");
        return;
      }
      setSyncMessage("날씨 동기화가 완료되었습니다.");
      router.refresh();
    } finally {
      setSyncPending(false);
    }
  }

  function openCreateModal(defaults?: Partial<typeof createDefaults>) {
    const today = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Seoul" });
    const defaultDate = today.startsWith(currentMonth) ? today : `${currentMonth}-01`;
    setCreateDefaults({
      date: defaults?.date ?? defaultDate,
      amount: defaults?.amount ?? "",
      paymentType: defaults?.paymentType ?? "카드",
    });
    setModalOpen(true);
  }

  return (
    <>
        <header>
          <div>
            <p className="eyebrow">WEATHER SALES ANALYTICS</p>
            <h1>매출 현황</h1>
            <div className="dashboard-month" aria-label="대시보드 조회 월">
              <button
                aria-label="이전 월 보기"
                onClick={() => setCurrentMonth((month) => addMonths(month, -1))}
                type="button"
              >
                ‹
              </button>
              <strong>{formatMonthLabel(currentMonth)}</strong>
              <button
                aria-label="다음 월 보기"
                onClick={() => setCurrentMonth((month) => addMonths(month, 1))}
                type="button"
              >
                ›
              </button>
            </div>
            <p>날씨와 매출의 관계를 한눈에 확인하세요.</p>
          </div>
          <div className="header-actions">
            <div className="sync-action">
              <Button className="secondary-button" disabled={syncPending} onClick={synchronizeWeather}>
                {syncPending ? "동기화 중..." : "날씨 동기화"}
              </Button>
              {syncMessage && <span role="status">{syncMessage}</span>}
            </div>
            <Button onClick={() => openCreateModal()}>+ 매출 입력</Button>
          </div>
        </header>

        <section className="metrics" id="overview">
          <article className="metric primary">
            <span>총 매출</span>
            <strong>{formatCurrency(currentMonthTotal)}</strong>
            <small>{formatMonthLabel(currentMonth)} · {currentMonthSales.length}건 합계</small>
          </article>
          <article className="metric">
            <span>하루 평균</span>
            <strong>{formatCurrency(average)}</strong>
            <small>최근 {sales.length}일 기준</small>
          </article>
          <article className="metric">
            <span>가장 높은 날</span>
            <strong>{formatCurrency(best?.amount ?? 0)}</strong>
            <small>{best ? formatDate(best.date) : `${formatMonthLabel(currentMonth)} 내역 없음`}</small>
          </article>
          <article className="metric">
            <span>좋은 날씨</span>
            <strong>{bestWeather?.weather ?? "-"}</strong>
            <small>{bestWeather ? `평균 매출 ${formatCurrency(bestWeather.average)}` : "날씨 내역 없음"}</small>
          </article>
        </section>

        <section className="dashboard-monthly-chart">
          <article className="panel chart-panel">
            <div className="panel-title">
              <div><span className="kicker">MONTHLY SALES</span><h2>{formatMonthLabel(currentMonth)} 일별 매출</h2></div>
            </div>
            <MonthlySalesChart sales={sales} month={currentMonth} />
          </article>
        </section>

        <section className="chart-grid dashboard-secondary-chart-grid">
          <article className="panel chart-panel">
            <div className="panel-title">
              <div><span className="kicker">WEEKLY SALES</span><h2>{formatMonthLabel(currentMonth)} 주간 매출</h2></div>
            </div>
            <WeeklySalesChart sales={sales} month={currentMonth} />
          </article>
          <article className="panel chart-panel">
            <div className="panel-title">
              <div><span className="kicker">YEAR OVER YEAR</span><h2>전년 동월 대비</h2></div>
            </div>
            <YearOverYearSalesChart sales={sales} month={currentMonth} />
          </article>
        </section>

        <article className="panel sales-panel page-panel">
          <div className="panel-title">
            <div><span className="kicker">SALES HISTORY</span><h2>{formatMonthLabel(currentMonth)} 매출 내역</h2></div>
            <span className="record-count">{salesRows.length}줄</span>
          </div>
          <DataTable
            columns={["날짜", "날씨", ...paymentTypes, "합계"]}
            rows={salesRows}
            onRowClick={(index) => {
              const sale = salesGroups[index].rows[0];
              openCreateModal({
                date: sale.date,
                amount: String(sale.amount),
                paymentType: sale.paymentType,
              });
            }}
          />
        </article>

      <Modal open={modalOpen} title="매출 입력" onClose={() => setModalOpen(false)}>
        <form key={`${createDefaults.date}-${createDefaults.paymentType}-${createDefaults.amount}`} action={async (formData) => {
          if (createSubmitting.current) return;

          createSubmitting.current = true;
          setCreatePending(true);
          setCreateError("");
          try {
            const result = await createSaleAction({ success: false }, formData);

            if (result.success) {
              setModalOpen(false);
            } else {
              setCreateError(result.error ?? "매출을 저장하지 못했습니다.");
            }
          } finally {
            createSubmitting.current = false;
            setCreatePending(false);
          }
        }} className="sale-form">
          <label>날짜
            <input
              name="date"
              type="date"
              defaultValue={createDefaults.date}
              onChange={(event) => {
                const date = event.target.value;
                const existingSale = sales.find((sale) =>
                  sale.date === date && sale.paymentType === createDefaults.paymentType,
                );
                setCreateDefaults((defaults) => ({
                  ...defaults,
                  date,
                  amount: existingSale ? String(existingSale.amount) : "",
                }));
              }}
              required
            />
          </label>
          <label>매출 금액<input name="amount" type="number" min="0" placeholder="0" defaultValue={createDefaults.amount} required /></label>
          <label>결제 수단
            <select
              name="paymentType"
              defaultValue={createDefaults.paymentType}
              onChange={(event) => {
                const paymentType = event.target.value;
                const existingSale = sales.find((sale) =>
                  sale.date === createDefaults.date && sale.paymentType === paymentType,
                );
                setCreateDefaults((defaults) => ({
                  ...defaults,
                  amount: existingSale ? String(existingSale.amount) : "",
                  paymentType,
                }));
              }}
            >
              <option>카드</option><option>현금</option><option>지역상품권</option><option>기타</option>
            </select>
          </label>
          <p>동일한 날짜와 결제 수단은 입력한 금액으로 갱신되며, 0원을 입력하면 해당 데이터가 초기화됩니다.</p>
          {createError && <p className="form-error" role="alert">{createError}</p>}
          <Button type="submit" disabled={createPending}>{createPending ? "저장 중..." : "매출 저장"}</Button>
        </form>
      </Modal>
    </>
  );
}
