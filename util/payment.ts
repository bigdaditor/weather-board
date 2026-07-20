export function normalizePaymentType(value: string) {
  const paymentType = value.trim();
  return paymentType.toLowerCase() === "etc" ? "기타" : paymentType;
}
