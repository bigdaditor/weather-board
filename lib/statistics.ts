import { getAllWeather, getSales } from "@/lib/db";
import { ApiError } from "@/lib/errors";
import { monthFromDate } from "@/util/month";

export type PeriodType = "week" | "month";

type Statistic = {
  period_type: PeriodType;
  period_start: string;
  period_end: string;
  payment_type: string;
  total_amount: number;
  transaction_count: number;
  avg_amount: number;
  created_at: string;
  updated_at: string;
};

function parseDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

function formatDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function addDays(date: Date, days: number) {
  const result = new Date(date);
  result.setUTCDate(result.getUTCDate() + days);
  return result;
}

function weekRange(value: string): [string, string] {
  const date = parseDate(value);
  const weekday = date.getUTCDay();
  const monday = addDays(date, weekday === 0 ? 1 : 1 - weekday);
  return [formatDate(monday), formatDate(addDays(monday, 5))];
}

function monthRange(value: string): [string, string] {
  const date = parseDate(value);
  const first = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
  const last = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0));
  return [formatDate(first), formatDate(last)];
}

async function computeStatistics() {
  const buckets = new Map<string, {
    periodType: PeriodType;
    start: string;
    end: string;
    paymentType: string;
    total: number;
    count: number;
  }>();

  function add(periodType: PeriodType, start: string, end: string, paymentType: string, amount: number) {
    const key = [periodType, start, end, paymentType].join("|");
    const bucket = buckets.get(key) ?? { periodType, start, end, paymentType, total: 0, count: 0 };
    bucket.total += amount;
    bucket.count += 1;
    buckets.set(key, bucket);
  }

  for (const sale of await getSales()) {
    for (const [periodType, range] of [["week", weekRange(sale.date)], ["month", monthRange(sale.date)]] as const) {
      add(periodType, range[0], range[1], "all", sale.amount);
      add(periodType, range[0], range[1], sale.paymentType, sale.amount);
    }
  }

  const now = new Date().toISOString();
  return [...buckets.values()].map((bucket): Statistic => ({
    period_type: bucket.periodType,
    period_start: bucket.start,
    period_end: bucket.end,
    payment_type: bucket.paymentType,
    total_amount: bucket.total,
    transaction_count: bucket.count,
    avg_amount: bucket.total / bucket.count,
    created_at: now,
    updated_at: now,
  })).sort((a, b) => a.period_start.localeCompare(b.period_start));
}

export async function getStatistics(filters: {
  periodType?: string | null;
  paymentType?: string | null;
  startDate?: string | null;
  endDate?: string | null;
}) {
  if (filters.periodType && !["week", "month"].includes(filters.periodType)) {
    throw new ApiError(422, "period_type must be week or month");
  }
  return (await computeStatistics()).filter((item) =>
    (!filters.periodType || item.period_type === filters.periodType)
    && (!filters.paymentType || item.payment_type === filters.paymentType)
    && (!filters.startDate || item.period_start >= filters.startDate)
    && (!filters.endDate || item.period_end <= filters.endDate),
  );
}

export async function getDailySalesStatistics(startDate?: string | null, endDate?: string | null) {
  const daily = new Map<string, Record<string, number>>();
  for (const sale of [...await getSales()].reverse()) {
    if ((startDate && sale.date < startDate) || (endDate && sale.date > endDate)) continue;
    const paymentTypes = daily.get(sale.date) ?? {};
    paymentTypes[sale.paymentType] = (paymentTypes[sale.paymentType] ?? 0) + sale.amount;
    daily.set(sale.date, paymentTypes);
  }
  return [...daily].map(([date, payment_types]) => ({
    date,
    payment_types,
    total_amount: Object.values(payment_types).reduce((sum, amount) => sum + amount, 0),
  })).sort((a, b) => a.date.localeCompare(b.date));
}

function groupedSummary(summary: string, groupBy: "sky" | "rain") {
  const parts = summary.split("/").map((part) => part.trim());
  return groupBy === "sky" ? parts[0] : (parts[1] ?? parts[0]);
}

export async function getWeatherMonthlySalesTrend(filters: {
  summary?: string | null;
  summarySky?: string | null;
  summaryRain?: string | null;
  groupBy?: string | null;
}) {
  if (filters.groupBy && !["sky", "rain", "both"].includes(filters.groupBy)) {
    throw new ApiError(422, "group_by must be sky, rain, or both");
  }
  const sales = await getSales();
  const weatherByDate = new Map((await getAllWeather()).map((weather) => [weather.date, weather.summary]));
  for (const sale of sales) {
    if (!weatherByDate.has(sale.date)) weatherByDate.set(sale.date, sale.weather);
  }

  const targets: ("sky" | "rain")[] = filters.groupBy === "sky" || filters.groupBy === "rain"
    ? [filters.groupBy]
    : ["sky", "rain"];
  const buckets = new Map<string, Map<string, number>>();
  for (const sale of sales) {
    const summary = weatherByDate.get(sale.date);
    if (!summary) continue;
    for (const target of targets) {
      const group = groupedSummary(summary, target);
      if (filters.summary && group !== filters.summary) continue;
      if (target === "sky" && filters.summarySky && group !== filters.summarySky) continue;
      if (target === "rain" && filters.summaryRain && group !== filters.summaryRain) continue;
      const key = `${target}|${group}`;
      const months = buckets.get(key) ?? new Map<string, number>();
      const month = monthFromDate(sale.date);
      months.set(month, (months.get(month) ?? 0) + sale.amount);
      buckets.set(key, months);
    }
  }

  return [...buckets].sort(([a], [b]) => a.localeCompare(b)).map(([key, months]) => {
    const [category_type, summary] = key.split("|");
    return {
      category_type,
      summary,
      data: [...months].sort().map(([month, total_amount]) => ({ month, total_amount })),
    };
  });
}
