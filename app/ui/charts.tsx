"use client";

import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
  type ChartOptions,
} from "chart.js";
import { Bar, Line } from "react-chartjs-2";
import type { Sale } from "@/lib/db";
import { addMonths } from "@/util/month";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Tooltip, Legend);

const accent = "#0e766e";
const ink = "#52636a";
const grid = "rgba(113, 128, 134, .14)";

function previousYearMonth(month: string) {
  return `${Number(month.slice(0, 4)) - 1}${month.slice(4)}`;
}

function dailyAmounts(sales: Sale[], month: string) {
  const [year, monthNumber] = month.split("-").map(Number);
  const daysInMonth = new Date(Date.UTC(year, monthNumber, 0)).getUTCDate();
  const amounts = Array.from({ length: daysInMonth }, () => 0);

  for (const sale of sales) {
    if (sale.date.startsWith(month)) amounts[Number(sale.date.slice(8, 10)) - 1] += sale.amount;
  }

  return amounts;
}

function formatWon(value: number) {
  return `${Math.round(value).toLocaleString("ko-KR")}원`;
}

const commonOptions: ChartOptions<"line"> = {
  responsive: true,
  maintainAspectRatio: false,
  interaction: { intersect: false, mode: "index" },
  plugins: {
    legend: { display: false },
    tooltip: {
      backgroundColor: "#19343c",
      titleColor: "#ffffff",
      bodyColor: "#ffffff",
      padding: 14,
      titleFont: { size: 15, weight: 700 },
      bodyFont: { size: 15, weight: 700 },
      cornerRadius: 10,
      displayColors: false,
      callbacks: { label: (context) => formatWon(context.parsed.y ?? 0) },
    },
  },
  scales: {
    x: { border: { display: false }, grid: { display: false }, ticks: { color: ink, font: { size: 14, weight: 600 }, maxRotation: 0, autoSkipPadding: 16 } },
    y: {
      beginAtZero: true,
      border: { display: false },
      grid: { color: grid },
      ticks: { color: ink, font: { size: 14, weight: 600 }, padding: 8, callback: (value) => formatWon(Number(value)) },
    },
  },
};

export function MonthlySalesChart({ sales, month }: { sales: Sale[]; month: string }) {
  const amounts = dailyAmounts(sales, month);

  return (
    <div className="chartjs-wrap">
      <Line
        data={{
          labels: amounts.map((_, index) => `${index + 1}일`),
          datasets: [{
            label: month,
            data: amounts,
            borderColor: accent,
            backgroundColor: accent,
            pointBackgroundColor: "white",
            pointBorderColor: accent,
            pointRadius: 2,
            pointHoverRadius: 6,
            borderWidth: 2.5,
            tension: 0.35,
          }],
        }}
        options={commonOptions}
      />
    </div>
  );
}

export function AnnualSalesChart({ sales, month }: { sales: Sale[]; month: string }) {
  const months = Array.from({ length: 13 }, (_, index) => addMonths(month, index - 12));
  const totals = months.map((targetMonth) => sales
    .filter((sale) => sale.date.startsWith(targetMonth))
    .reduce((sum, sale) => sum + sale.amount, 0));

  return (
    <div className="chartjs-wrap annual-chart">
      <Line
        data={{
          labels: months.map((targetMonth) => {
            const [year, monthNumber] = targetMonth.split("-");
            return `${year.slice(2)}.${monthNumber}`;
          }),
          datasets: [{
            label: "월 매출",
            data: totals,
            borderColor: accent,
            backgroundColor: accent,
            pointBackgroundColor: "white",
            pointBorderColor: accent,
            pointRadius: 4,
            pointHoverRadius: 7,
            borderWidth: 3,
            tension: 0.32,
          }],
        }}
        options={commonOptions}
      />
    </div>
  );
}

export function YearOverYearSalesChart({ sales, month }: { sales: Sale[]; month: string }) {
  const comparisonMonth = previousYearMonth(month);
  const currentTotal = dailyAmounts(sales, month).reduce((sum, amount) => sum + amount, 0);
  const previousTotal = dailyAmounts(sales, comparisonMonth).reduce((sum, amount) => sum + amount, 0);
  const options: ChartOptions<"bar"> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { backgroundColor: "#19343c", padding: 14, titleFont: { size: 15, weight: 700 }, bodyFont: { size: 15, weight: 700 }, cornerRadius: 10, displayColors: false, callbacks: { label: (context) => formatWon(context.parsed.y ?? 0) } },
    },
    scales: {
      x: { border: { display: false }, grid: { display: false }, ticks: { color: ink, font: { size: 15, weight: 700 }, padding: 8 } },
      y: {
        beginAtZero: true,
        border: { display: false },
        grid: { color: grid },
        ticks: { color: ink, font: { size: 14, weight: 600 }, padding: 8, callback: (value) => formatWon(Number(value)) },
      },
    },
  };

  return (
    <div className="chartjs-wrap">
      <Bar
        data={{
          labels: [comparisonMonth, month],
          datasets: [{
            label: "월 매출",
            data: [previousTotal, currentTotal],
            backgroundColor: ["#cbd7d5", accent],
            borderColor: ["#cbd7d5", accent],
            borderRadius: 8,
            borderWidth: 0,
            maxBarThickness: 100,
          }],
        }}
        options={options}
      />
    </div>
  );
}

export function WeeklySalesChart({ sales, month }: { sales: Sale[]; month: string }) {
  const daily = dailyAmounts(sales, month);
  const weekly = Array.from({ length: Math.ceil(daily.length / 7) }, (_, weekIndex) => {
    const startDay = weekIndex * 7 + 1;
    const endDay = Math.min(startDay + 6, daily.length);
    return {
      label: `${startDay}~${endDay}일`,
      amount: daily.slice(startDay - 1, endDay).reduce((sum, amount) => sum + amount, 0),
    };
  });
  const options: ChartOptions<"bar"> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { backgroundColor: "#19343c", padding: 14, titleFont: { size: 15, weight: 700 }, bodyFont: { size: 15, weight: 700 }, cornerRadius: 10, displayColors: false, callbacks: { label: (context) => formatWon(context.parsed.y ?? 0) } },
    },
    scales: {
      x: { border: { display: false }, grid: { display: false }, ticks: { color: ink, font: { size: 15, weight: 700 }, padding: 8 } },
      y: {
        beginAtZero: true,
        border: { display: false },
        grid: { color: grid },
        ticks: { color: ink, font: { size: 14, weight: 600 }, padding: 8, callback: (value) => formatWon(Number(value)) },
      },
    },
  };

  return (
    <div className="chartjs-wrap">
      <Bar
        data={{
          labels: weekly.map(({ label }) => label),
          datasets: [{
            label: "주간 매출",
            data: weekly.map(({ amount }) => amount),
            backgroundColor: accent,
            borderColor: accent,
            borderRadius: 8,
            borderWidth: 0,
            maxBarThickness: 120,
          }],
        }}
        options={options}
      />
    </div>
  );
}
