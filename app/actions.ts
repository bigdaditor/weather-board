"use server";

import { revalidatePath } from "next/cache";
import { insertSale } from "@/lib/db";
import { getWeatherForDate } from "@/lib/weather";

export type CreateSaleState = {
  success: boolean;
  error?: string;
};

export async function createSale(_: CreateSaleState, formData: FormData): Promise<CreateSaleState> {
  const date = String(formData.get("date"));
  const amount = Number(formData.get("amount"));
  const paymentType = String(formData.get("paymentType"));

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(amount) || amount <= 0 || !paymentType) {
    return { success: false, error: "입력값을 확인해 주세요." };
  }

  try {
    const weather = await getWeatherForDate(date);

    insertSale({
      date,
      amount,
      paymentType,
      weather: weather.label,
      temperature: weather.temperature,
    });
  } catch (error) {
    console.error("Failed to create sale", error);
    return {
      success: false,
      error: "날씨 정보를 가져오지 못했습니다. 잠시 후 다시 시도해 주세요.",
    };
  }

  revalidatePath("/");
  return { success: true };
}
