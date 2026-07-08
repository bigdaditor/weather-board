"use client";

import { useState } from "react";
import Link from "next/link";
import { LineChart, WeatherChart } from "@/app/ui/charts";
import { Button } from "@/app/ui/button";
import { Modal } from "@/app/ui/modal";
import type { CreateSaleState } from "@/app/actions";
import type { Sale } from "@/lib/db";
import { formatCurrency, formatDate } from "@/util/format";

type Props = {
  sales: Sale[];
  createSaleAction: (
    state: CreateSaleState,
    formData: FormData,
  ) => Promise<CreateSaleState>;
};

export default function DashboardScreen({ sales, createSaleAction }: Props) {
  const [modalOpen, setModalOpen] = useState(false);
  const [period, setPeriod] = useState("30일");
  const [createError, setCreateError] = useState("");
  const [createPending, setCreatePending] = useState(false);
  const total = sales.reduce((sum, sale) => sum + sale.amount, 0);
  const average = Math.round(total / sales.length);
  const best = [...sales].sort((a, b) => b.amount - a.amount)[0];
  const periodDays = Number(period.replace("일", ""));

  return (
    <>
        <header>
          <div>
            <p className="eyebrow">WEATHER SALES ANALYTICS</p>
            <h1>매출 현황</h1>
            <p>날씨와 매출의 관계를 한눈에 확인하세요.</p>
          </div>
          <Button onClick={() => setModalOpen(true)}>+ 매출 입력</Button>
        </header>

        <section className="metrics" id="overview">
          <article className="metric primary">
            <span>총 매출</span>
            <strong>{formatCurrency(total)}</strong>
            <small>지난달 대비 ▲ 12.8%</small>
          </article>
          <article className="metric">
            <span>하루 평균</span>
            <strong>{formatCurrency(average)}</strong>
            <small>최근 {sales.length}일 기준</small>
          </article>
          <article className="metric">
            <span>가장 높은 날</span>
            <strong>{formatCurrency(best.amount)}</strong>
            <small>{formatDate(best.date)} · {best.weather}</small>
          </article>
          <article className="metric">
            <span>좋은 날씨</span>
            <strong>맑음</strong>
            <small>평균 매출 {formatCurrency(1284000)}</small>
          </article>
        </section>

        <section className="chart-grid dashboard-chart-grid">
          <article className="panel chart-panel">
            <div className="panel-title">
              <div><span className="kicker">WEATHER IMPACT</span><h2>날씨별 매출</h2></div>
              <Link className="text-button" href="/weather">상세보기 →</Link>
            </div>
            <WeatherChart sales={sales} />
          </article>
          <article className="panel chart-panel">
            <div className="panel-title">
              <div><span className="kicker">SALES TREND</span><h2>매출 추이</h2></div>
              <div className="tabs">
                {["7일", "30일", "90일"].map((item) => (
                  <button className={period === item ? "selected" : ""} key={item} onClick={() => setPeriod(item)}>{item}</button>
                ))}
              </div>
            </div>
            <LineChart sales={sales} days={periodDays} />
          </article>
        </section>

      <Modal open={modalOpen} title="매출 입력" onClose={() => setModalOpen(false)}>
        <form action={async (formData) => {
          setCreatePending(true);
          setCreateError("");
          const result = await createSaleAction({ success: false }, formData);
          setCreatePending(false);

          if (result.success) {
            setModalOpen(false);
          } else {
            setCreateError(result.error ?? "매출을 저장하지 못했습니다.");
          }
        }} className="sale-form">
          <label>날짜<input name="date" type="date" defaultValue="2026-06-13" required /></label>
          <label>매출 금액<input name="amount" type="number" min="1" placeholder="0" required /></label>
          <label>결제 수단<select name="paymentType"><option>카드</option><option>현금</option><option>지역상품권</option></select></label>
          <p>저장 시 해당 날짜의 서울 날씨를 API에서 자동으로 가져옵니다.</p>
          {createError && <p className="form-error" role="alert">{createError}</p>}
          <Button type="submit" disabled={createPending}>{createPending ? "저장 중..." : "매출 저장"}</Button>
        </form>
      </Modal>
    </>
  );
}
