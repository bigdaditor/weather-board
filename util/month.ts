export type SearchParamRecord = { [key: string]: string | string[] | undefined };
export type SearchParams = Promise<SearchParamRecord>;

const monthPattern = /^\d{4}-(0[1-9]|1[0-2])$/;

export function searchParam(params: SearchParamRecord, key: string) {
  const value = params[key];
  return Array.isArray(value) ? value[0] : value;
}

export function monthFromDate(date: string) {
  return date.slice(0, 7);
}

export function yearFromDate(date: string) {
  return date.slice(0, 4);
}

export function isMonth(value: string | undefined): value is string {
  return monthPattern.test(value ?? "");
}

export function currentMonth(timeZone = "Asia/Seoul") {
  const parts = new Intl.DateTimeFormat("en-US", {
    month: "2-digit",
    timeZone,
    year: "numeric",
  }).formatToParts(new Date());

  return `${parts.find((part) => part.type === "year")?.value}-${parts.find((part) => part.type === "month")?.value}`;
}

export function addMonths(month: string, amount: number) {
  const [year, monthNumber] = month.split("-").map(Number);
  const date = new Date(Date.UTC(year, monthNumber - 1 + amount, 1));
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

export function formatMonthLabel(month: string) {
  const [year, monthNumber] = month.split("-");
  return `${year}년 ${monthNumber.padStart(2, "0")}월`;
}

export function formatMonthKicker(month: string) {
  const date = new Date(`${month}-01T00:00:00Z`);
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    timeZone: "UTC",
    year: "numeric",
  }).format(date).toUpperCase();
}

export function selectedMonth(params: SearchParamRecord, fallbackMonth: string) {
  const month = searchParam(params, "month");
  return isMonth(month) ? month : fallbackMonth;
}
