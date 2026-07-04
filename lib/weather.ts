import { getUnsyncedSales, getWeatherByMonth, markSalesSynced, upsertWeather, type Weather } from "@/lib/db";
import { ApiError } from "@/lib/errors";

const weatherLabels: Record<number, string> = {
  0: "맑음", 1: "맑음", 2: "흐림", 3: "흐림", 45: "흐림", 48: "흐림",
  51: "비", 53: "비", 55: "비", 61: "비", 63: "비", 65: "비", 80: "비", 81: "비", 82: "비",
  71: "눈", 73: "눈", 75: "눈", 77: "눈", 85: "눈", 86: "눈",
};

export async function getWeatherForDate(date: string) {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 5);
  const host = new Date(`${date}T00:00:00+09:00`) < cutoff
    ? "archive-api.open-meteo.com/v1/archive"
    : "api.open-meteo.com/v1/forecast";
  const params = new URLSearchParams({
    latitude: "37.5665",
    longitude: "126.9780",
    start_date: date,
    end_date: date,
    daily: "weather_code,temperature_2m_max",
    timezone: "Asia/Seoul",
  });
  const response = await fetch(`https://${host}?${params}`, { cache: "no-store" });
  if (!response.ok) throw new Error(`Weather API returned ${response.status}`);

  const data = await response.json() as {
    daily?: { weather_code?: number[]; temperature_2m_max?: number[] };
  };
  const weatherCode = data.daily?.weather_code?.[0];
  const temperature = data.daily?.temperature_2m_max?.[0];
  if (weatherCode === undefined || temperature === undefined || !weatherLabels[weatherCode]) {
    throw new Error("Weather API returned no daily weather data");
  }
  return { label: weatherLabels[weatherCode], temperature: Math.round(temperature) };
}

function compactDate(date: string) {
  return date.replaceAll("-", "");
}

function normalizeDate(date: string) {
  return date.includes("-") ? date : `${date.slice(0, 4)}-${date.slice(4, 6)}-${date.slice(6, 8)}`;
}

function numberValue(value: unknown) {
  const number = Number(value || 0);
  return Number.isFinite(number) ? number : 0;
}

function classifyWeather(oneHourRain: number, avgCloud: number) {
  if (oneHourRain > 0) return "강우";
  return avgCloud <= 0.54 ? "맑음" : "흐림";
}

type KmaItem = {
  tm?: string;
  avgTa?: string;
  minTa?: string;
  maxTa?: string;
  sumRn?: string;
  avgRhm?: string;
  hr1MaxRn?: string;
  avgTca?: string;
};

export function toWeatherApiRecord(weather: Weather) {
  return {
    date: weather.date,
    avg_temp: weather.avgTemp,
    min_temp: weather.minTemp,
    max_temp: weather.maxTemp,
    sum_rain: weather.sumRain,
    avg_humidity: weather.avgHumidity,
    one_hour_rain: weather.oneHourRain,
    summary: weather.summary,
  };
}

async function fetchKmaWeather(startDate: string, endDate: string): Promise<KmaItem[]> {
  const serviceKey = process.env.KMA_SERVICE_KEY;
  if (!serviceKey) throw new ApiError(503, "KMA_SERVICE_KEY is not configured");

  const params = new URLSearchParams({
    serviceKey,
    numOfRows: "100",
    pageNo: "1",
    dataType: "JSON",
    dataCd: "ASOS",
    dateCd: "DAY",
    startDt: compactDate(startDate),
    endDt: compactDate(endDate),
    stnIds: "108",
  });
  const response = await fetch(
    `https://apis.data.go.kr/1360000/AsosDalyInfoService/getWthrDataList?${params}`,
    { cache: "no-store" },
  );
  if (!response.ok) throw new ApiError(502, `KMA weather API returned ${response.status}`);

  const data = await response.json() as {
    response?: {
      header?: { resultCode?: string; resultMsg?: string };
      body?: { items?: { item?: KmaItem[] } };
    };
  };
  if (data.response?.header?.resultCode !== "00") {
    throw new ApiError(502, data.response?.header?.resultMsg ?? "No weather data found");
  }
  return data.response.body?.items?.item ?? [];
}

export async function syncWeather(): Promise<Weather[]> {
  const sales = getUnsyncedSales();
  if (sales.length === 0) throw new ApiError(404, "Sale not found");

  const items = await fetchKmaWeather(sales[0].date, sales.at(-1)!.date);
  const weatherRows = items.flatMap((item): Weather[] => {
    if (!item.tm) return [];
    const oneHourRain = numberValue(item.hr1MaxRn);
    const weather = {
      date: normalizeDate(item.tm),
      avgTemp: numberValue(item.avgTa),
      minTemp: numberValue(item.minTa),
      maxTemp: numberValue(item.maxTa),
      sumRain: numberValue(item.sumRn),
      avgHumidity: numberValue(item.avgRhm),
      oneHourRain,
      summary: classifyWeather(oneHourRain, numberValue(item.avgTca)),
    };
    upsertWeather(weather);
    markSalesSynced(weather);
    return [weather];
  });
  return weatherRows;
}

export function readWeatherByMonth(month: string) {
  if (!/^\d{4}-\d{2}$/.test(month)) throw new ApiError(400, "month query parameter must use YYYY-MM");
  return getWeatherByMonth(month);
}
