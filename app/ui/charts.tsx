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

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Tooltip, Legend);

const blue = "oklch(57.61% .2508 258.23)";
const black = "#080808";

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
    tooltip: { callbacks: { label: (context) => formatWon(context.parsed.y ?? 0) } },
  },
  scales: {
    x: { grid: { display: false }, ticks: { color: black, font: { weight: 700 } } },
    y: {
      beginAtZero: true,
      grid: { color: "rgba(8, 8, 8, .12)" },
      ticks: { color: black, callback: (value) => formatWon(Number(value)) },
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
            borderColor: blue,
            backgroundColor: blue,
            pointBackgroundColor: "white",
            pointBorderColor: blue,
            pointRadius: 3,
            pointHoverRadius: 6,
            borderWidth: 3,
            tension: 0.25,
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
      tooltip: { callbacks: { label: (context) => formatWon(context.parsed.y ?? 0) } },
    },
    scales: {
      x: { grid: { display: false }, ticks: { color: black, font: { size: 14, weight: 700 } } },
      y: {
        beginAtZero: true,
        grid: { color: "rgba(8, 8, 8, .12)" },
        ticks: { color: black, callback: (value) => formatWon(Number(value)) },
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
            backgroundColor: ["rgba(8, 8, 8, .65)", blue],
            borderColor: [black, blue],
            borderWidth: 1,
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
      tooltip: { callbacks: { label: (context) => formatWon(context.parsed.y ?? 0) } },
    },
    scales: {
      x: { grid: { display: false }, ticks: { color: black, font: { size: 14, weight: 700 } } },
      y: {
        beginAtZero: true,
        grid: { color: "rgba(8, 8, 8, .12)" },
        ticks: { color: black, callback: (value) => formatWon(Number(value)) },
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
            backgroundColor: blue,
            borderColor: blue,
            borderWidth: 1,
            maxBarThickness: 120,
          }],
        }}
        options={options}
      />
    </div>
  );
}
