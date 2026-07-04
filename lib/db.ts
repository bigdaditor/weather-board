import { getSupabase } from "@/lib/supabase";

export type Sale = {
  id: number;
  date: string;
  amount: number;
  paymentType: string;
  weather: string;
  temperature: number;
  createdAt: string;
  syncStatus: number;
};

export type Weather = {
  date: string;
  avgTemp: number;
  minTemp: number;
  maxTemp: number;
  sumRain: number;
  avgHumidity: number;
  oneHourRain: number;
  summary: string;
};

type SaleRow = {
  id: number;
  input_date: string;
  amount: number;
  payment_type: string;
  created_at: string;
  sync_status: number;
};

type WeatherRow = {
  date: string;
  avg_temp: number;
  min_temp: number;
  max_temp: number;
  sum_rain: number;
  avg_humidity: number;
  one_hour_rain: number;
  summary: string;
};

function toWeather(row: WeatherRow): Weather {
  return {
    date: row.date,
    avgTemp: Number(row.avg_temp),
    minTemp: Number(row.min_temp),
    maxTemp: Number(row.max_temp),
    sumRain: Number(row.sum_rain),
    avgHumidity: Number(row.avg_humidity),
    oneHourRain: Number(row.one_hour_rain),
    summary: row.summary,
  };
}

function toSale(row: SaleRow, weather?: Weather): Sale {
  return {
    id: Number(row.id),
    date: row.input_date,
    amount: Number(row.amount),
    paymentType: row.payment_type,
    weather: weather?.summary ?? "미동기화",
    temperature: Math.round(weather?.maxTemp ?? 0),
    createdAt: row.created_at,
    syncStatus: Number(row.sync_status),
  };
}

function assertSingle<T>(data: T | null | undefined): NonNullable<T> {
  if (!data) throw new Error("Supabase returned no row");
  return data as NonNullable<T>;
}

export async function getSales(): Promise<Sale[]> {
  const supabase = getSupabase();
  const [{ data: saleRows, error: saleError }, { data: weatherRows, error: weatherError }] = await Promise.all([
    supabase
      .from("sale")
      .select("id,input_date,amount,payment_type,created_at,sync_status")
      .order("input_date", { ascending: false })
      .order("id", { ascending: false }),
    supabase
      .from("weather")
      .select("date,avg_temp,min_temp,max_temp,sum_rain,avg_humidity,one_hour_rain,summary"),
  ]);

  if (saleError) throw saleError;
  if (weatherError) throw weatherError;

  const weatherByDate = new Map((weatherRows ?? []).map((row) => [row.date, toWeather(row as WeatherRow)]));
  return (saleRows ?? []).map((row) => toSale(row as SaleRow, weatherByDate.get(row.input_date)));
}

export async function getSaleById(id: number): Promise<Sale | undefined> {
  const supabase = getSupabase();
  const { data: saleRow, error } = await supabase
    .from("sale")
    .select("id,input_date,amount,payment_type,created_at,sync_status")
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  if (!saleRow) return undefined;

  const { data: weatherRow, error: weatherError } = await supabase
    .from("weather")
    .select("date,avg_temp,min_temp,max_temp,sum_rain,avg_humidity,one_hour_rain,summary")
    .eq("date", saleRow.input_date)
    .maybeSingle();

  if (weatherError) throw weatherError;
  return toSale(saleRow as SaleRow, weatherRow ? toWeather(weatherRow as WeatherRow) : undefined);
}

export async function insertSale(sale: Omit<Sale, "id" | "weather" | "temperature">): Promise<Sale> {
  const { data, error } = await getSupabase()
    .from("sale")
    .insert({
      input_date: sale.date,
      amount: sale.amount,
      payment_type: sale.paymentType,
      created_at: sale.createdAt,
      sync_status: sale.syncStatus,
    })
    .select("id")
    .single();

  if (error) throw error;
  return assertSingle(await getSaleById(Number(data.id)));
}

export async function updateSaleByDateAndPaymentType(
  date: string,
  paymentType: string,
  values: Pick<Sale, "amount" | "syncStatus">,
): Promise<Sale | undefined> {
  const supabase = getSupabase();
  const { data: existing, error: findError } = await supabase
    .from("sale")
    .select("id")
    .eq("input_date", date)
    .eq("payment_type", paymentType)
    .limit(1)
    .maybeSingle();

  if (findError) throw findError;
  if (!existing) return undefined;

  const { error } = await supabase
    .from("sale")
    .update({ amount: values.amount, sync_status: values.syncStatus })
    .eq("id", existing.id);

  if (error) throw error;
  return getSaleById(Number(existing.id));
}

export async function deleteSaleByDateAndPaymentType(date: string, paymentType: string): Promise<Sale | undefined> {
  const supabase = getSupabase();
  const sale = (await getSales()).find((row) => row.date === date && row.paymentType === paymentType);
  if (!sale) return undefined;

  const { error } = await supabase.from("sale").delete().eq("id", sale.id);
  if (error) throw error;
  return sale;
}

export async function getUnsyncedSales(limit = 10): Promise<Sale[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("sale")
    .select("id,input_date,amount,payment_type,created_at,sync_status")
    .eq("sync_status", 0)
    .order("input_date", { ascending: true })
    .limit(limit);

  if (error) throw error;
  return (data ?? []).map((row) => toSale(row as SaleRow));
}

export async function upsertWeather(weather: Weather): Promise<void> {
  const { error } = await getSupabase()
    .from("weather")
    .upsert({
      date: weather.date,
      avg_temp: weather.avgTemp,
      min_temp: weather.minTemp,
      max_temp: weather.maxTemp,
      sum_rain: weather.sumRain,
      avg_humidity: weather.avgHumidity,
      one_hour_rain: weather.oneHourRain,
      summary: weather.summary,
    });

  if (error) throw error;
}

export async function markSalesSynced(weather: Weather): Promise<void> {
  const { error } = await getSupabase()
    .from("sale")
    .update({ sync_status: 1 })
    .eq("input_date", weather.date);

  if (error) throw error;
}

export async function getWeatherByMonth(month: string): Promise<Weather[]> {
  const { data, error } = await getSupabase()
    .from("weather")
    .select("date,avg_temp,min_temp,max_temp,sum_rain,avg_humidity,one_hour_rain,summary")
    .gte("date", `${month}-01`)
    .lt("date", nextMonth(month))
    .order("date", { ascending: true });

  if (error) throw error;
  return (data ?? []).map((row) => toWeather(row as WeatherRow));
}

export async function getAllWeather(): Promise<Weather[]> {
  const { data, error } = await getSupabase()
    .from("weather")
    .select("date,avg_temp,min_temp,max_temp,sum_rain,avg_humidity,one_hour_rain,summary")
    .order("date", { ascending: true });

  if (error) throw error;
  return (data ?? []).map((row) => toWeather(row as WeatherRow));
}

function nextMonth(month: string) {
  const [year, monthIndex] = month.split("-").map(Number);
  const date = new Date(Date.UTC(year, monthIndex, 1));
  return date.toISOString().slice(0, 10);
}
