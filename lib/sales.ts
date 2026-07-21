import {
  deleteSaleByDateAndPaymentType,
  getSaleById,
  getSales,
  upsertSale,
  updateSaleByDateAndPaymentType,
  type Sale,
} from "@/lib/db";
import { ApiError } from "@/lib/errors";
import { isMonth, monthFromDate } from "@/util/month";
import { normalizePaymentType } from "@/util/payment";

export type SaleApiRecord = {
  id: number;
  input_date: string;
  amount: number;
  payment_type: string;
  created_at: string;
  sync_status: number;
};

const datePattern = /^\d{4}-\d{2}-\d{2}$/;

function requireDate(value: unknown) {
  const date = String(value ?? "");
  if (!datePattern.test(date)) throw new ApiError(422, "input_date must use YYYY-MM-DD");
  return date;
}

function requireAmount(value: unknown) {
  const amount = Number(value);
  if (!Number.isInteger(amount) || amount <= 0) throw new ApiError(422, "amount must be a positive integer");
  return amount;
}

function requirePaymentType(value: unknown) {
  const paymentType = normalizePaymentType(String(value ?? ""));
  if (!paymentType) throw new ApiError(422, "payment_type is required");
  return paymentType;
}

export function toSaleApiRecord(sale: Sale): SaleApiRecord {
  return {
    id: sale.id,
    input_date: sale.date,
    amount: sale.amount,
    payment_type: sale.paymentType,
    created_at: sale.createdAt,
    sync_status: sale.syncStatus,
  };
}

export async function createSaleRecord(data: Record<string, unknown>) {
  const date = requireDate(data.input_date);
  const amount = requireAmount(data.amount);
  const paymentType = requirePaymentType(data.payment_type);
  const createdAt = typeof data.created_at === "string" ? data.created_at : new Date().toISOString();
  const syncStatus = Number.isInteger(data.sync_status) ? Number(data.sync_status) : 0;

  return upsertSale({
    date,
    amount,
    paymentType,
    createdAt,
    syncStatus,
  });
}

export async function clearSaleRecord(data: Record<string, unknown>) {
  const date = requireDate(data.input_date);
  const paymentType = requirePaymentType(data.payment_type);
  return deleteSaleByDateAndPaymentType(date, paymentType);
}

export async function getSaleRecord(id: number) {
  if (!Number.isInteger(id) || id < 1) throw new ApiError(422, "sale_id must be a positive integer");
  const sale = await getSaleById(id);
  if (!sale) throw new ApiError(404, "Sale not found");
  return toSaleApiRecord(sale);
}

export async function getGroupedSales(page: number, pageSize: number) {
  const grouped = new Map<string, { date: string; payment_types: Record<string, number>; total_amount: number }>();
  for (const sale of [...await getSales()].reverse()) {
    const row = grouped.get(sale.date) ?? { date: sale.date, payment_types: {}, total_amount: 0 };
    row.payment_types[sale.paymentType] = (row.payment_types[sale.paymentType] ?? 0) + sale.amount;
    row.total_amount += sale.amount;
    grouped.set(sale.date, row);
  }
  if (grouped.size === 0) throw new ApiError(404, "Sales not found");

  const data = [...grouped.values()];
  const totalPages = Math.ceil(data.length / pageSize);
  const currentPage = Math.min(Math.max(page, 1), totalPages);
  return {
    total: data.length,
    page: currentPage,
    page_size: pageSize,
    total_pages: totalPages,
    data: data.slice((currentPage - 1) * pageSize, currentPage * pageSize),
  };
}

export async function getMonthlySales(month: string) {
  if (!isMonth(month)) throw new ApiError(422, "key must use YYYY-MM");
  const daily = new Map<string, number>();
  for (const sale of (await getSales()).filter(({ date }) => monthFromDate(date) === month)) {
    daily.set(sale.date, (daily.get(sale.date) ?? 0) + sale.amount);
  }
  if (daily.size === 0) throw new ApiError(404, "Sales not found");
  return { data: [...daily].sort().map(([date, total_amount]) => ({ date, total_amount })) };
}

export async function updateSaleRecord(data: Record<string, unknown>) {
  const date = requireDate(data.input_date);
  const paymentType = requirePaymentType(data.payment_type);
  const amount = requireAmount(data.amount);
  const syncStatus = Number.isInteger(data.sync_status) ? Number(data.sync_status) : 0;
  const sale = await updateSaleByDateAndPaymentType(date, paymentType, { amount, syncStatus });
  if (!sale) throw new ApiError(404, "Sale not found");
  return toSaleApiRecord(sale);
}

export async function deleteSaleRecord(data: Record<string, unknown>) {
  const sale = await deleteSaleByDateAndPaymentType(requireDate(data.input_date), requirePaymentType(data.payment_type));
  if (!sale) throw new ApiError(404, "Sale not found");
  return toSaleApiRecord(sale);
}
