"use server";

import { revalidatePath } from "next/cache";
import { clearSaleRecord, createSaleRecord } from "@/lib/sales";

export type CreateSaleState = {
  success: boolean;
  error?: string;
};

export async function createSale(_: CreateSaleState, formData: FormData): Promise<CreateSaleState> {
  const date = String(formData.get("date"));
  const amount = Number(formData.get("amount"));
  const paymentType = String(formData.get("paymentType"));

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(amount) || amount < 0 || !paymentType) {
    return { success: false, error: "입력값을 확인해 주세요." };
  }

  try {
    if (amount === 0) {
      await clearSaleRecord({ input_date: date, payment_type: paymentType });
    } else {
      await createSaleRecord({
        input_date: date,
        amount,
        payment_type: paymentType,
      });
    }
  } catch (error) {
    console.error("Failed to create sale", error);
    return {
      success: false,
      error: "매출 정보를 처리하지 못했습니다. 잠시 후 다시 시도해 주세요.",
    };
  }

  revalidatePath("/calendar");
  revalidatePath("/dashboard");
  return { success: true };
}
