import type { Sale } from "@/lib/db";

export const paymentTypes = ["카드", "현금", "지역상품권"];
export const weatherTypes = ["맑음", "흐림", "비", "눈"];

export function summarizePayments(sales: Sale[]) {
  const summary = Object.fromEntries(paymentTypes.map((paymentType) => [
    paymentType,
    { amount: 0, count: 0 },
  ])) as Record<string, { amount: number; count: number }>;

  for (const sale of sales) {
    const payment = summary[sale.paymentType];
    if (!payment) continue;
    payment.amount += sale.amount;
    payment.count += 1;
  }

  return summary;
}

export function summarizeWeatherSales(sales: Sale[]) {
  const summary = Object.fromEntries(weatherTypes.map((weather) => [
    weather,
    { total: 0, count: 0 },
  ])) as Record<string, { total: number; count: number }>;

  for (const sale of sales) {
    const weather = summary[sale.weather];
    if (!weather) continue;
    weather.total += sale.amount;
    weather.count += 1;
  }

  return weatherTypes.map((weather) => {
    const { total, count } = summary[weather];
    return { weather, total, count, average: total / (count || 1) };
  });
}
