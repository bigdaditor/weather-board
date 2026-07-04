import { mkdirSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import { join } from "node:path";

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

const directory = join(process.cwd(), ".data");
mkdirSync(directory, { recursive: true });
export const db = new DatabaseSync(join(directory, "weather-board.db"));

db.exec(`
  CREATE TABLE IF NOT EXISTS sales (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL,
    amount INTEGER NOT NULL,
    payment_type TEXT NOT NULL,
    weather TEXT NOT NULL,
    temperature INTEGER NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    sync_status INTEGER NOT NULL DEFAULT 0
  );
  CREATE TABLE IF NOT EXISTS weather (
    date TEXT PRIMARY KEY,
    avg_temp REAL NOT NULL,
    min_temp REAL NOT NULL,
    max_temp REAL NOT NULL,
    sum_rain REAL NOT NULL,
    avg_humidity REAL NOT NULL,
    one_hour_rain REAL NOT NULL,
    summary TEXT NOT NULL
  );
`);

const saleColumns = new Set(
  (db.prepare("PRAGMA table_info(sales)").all() as unknown as { name: string }[]).map(({ name }) => name),
);
if (!saleColumns.has("created_at")) {
  db.exec("ALTER TABLE sales ADD COLUMN created_at TEXT NOT NULL DEFAULT '1970-01-01T00:00:00.000Z'");
}
if (!saleColumns.has("sync_status")) {
  db.exec("ALTER TABLE sales ADD COLUMN sync_status INTEGER NOT NULL DEFAULT 0");
}

if ((db.prepare("SELECT COUNT(*) AS count FROM sales").get() as { count: number }).count === 0) {
  const insert = db.prepare(`
    INSERT INTO sales (date, amount, payment_type, weather, temperature, created_at, sync_status)
    VALUES (?, ?, ?, ?, ?, ?, 1)
  `);
  const createdAt = new Date().toISOString();
  [
    ["2026-06-13", 1480000, "카드", "맑음", 25], ["2026-06-12", 920000, "현금", "비", 20],
    ["2026-06-11", 1160000, "카드", "흐림", 22], ["2026-06-10", 1380000, "지역상품권", "맑음", 26],
    ["2026-06-09", 860000, "카드", "비", 19], ["2026-06-08", 1210000, "현금", "맑음", 24],
    ["2026-06-07", 1080000, "카드", "흐림", 23], ["2026-06-06", 1540000, "카드", "맑음", 27],
    ["2026-06-05", 780000, "현금", "비", 18], ["2026-06-04", 1130000, "지역상품권", "흐림", 21],
    ["2026-06-03", 1320000, "카드", "맑음", 25], ["2026-06-02", 970000, "현금", "비", 20],
  ].forEach((row) => insert.run(...row, createdAt));
}

function toSale(row: Record<string, unknown>): Sale {
  return {
    id: Number(row.id),
    date: String(row.date),
    amount: Number(row.amount),
    paymentType: String(row.paymentType),
    weather: String(row.weather),
    temperature: Number(row.temperature),
    createdAt: String(row.createdAt),
    syncStatus: Number(row.syncStatus),
  };
}

function toWeather(row: Record<string, unknown>): Weather {
  return {
    date: String(row.date),
    avgTemp: Number(row.avgTemp),
    minTemp: Number(row.minTemp),
    maxTemp: Number(row.maxTemp),
    sumRain: Number(row.sumRain),
    avgHumidity: Number(row.avgHumidity),
    oneHourRain: Number(row.oneHourRain),
    summary: String(row.summary),
  };
}

const saleSelect = `
  SELECT id, date, amount, payment_type AS paymentType, weather, temperature,
         created_at AS createdAt, sync_status AS syncStatus
  FROM sales
`;

export function getSales(): Sale[] {
  return (db.prepare(`${saleSelect} ORDER BY date DESC, id DESC`).all() as Record<string, unknown>[]).map(toSale);
}

export function getSaleById(id: number): Sale | undefined {
  const row = db.prepare(`${saleSelect} WHERE id = ?`).get(id) as Record<string, unknown> | undefined;
  return row ? toSale(row) : undefined;
}

export function insertSale(sale: Omit<Sale, "id">): Sale {
  const result = db.prepare(`
    INSERT INTO sales (date, amount, payment_type, weather, temperature, created_at, sync_status)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    sale.date,
    sale.amount,
    sale.paymentType,
    sale.weather,
    sale.temperature,
    sale.createdAt,
    sale.syncStatus,
  );
  return getSaleById(Number(result.lastInsertRowid))!;
}

export function updateSaleByDateAndPaymentType(
  date: string,
  paymentType: string,
  values: Pick<Sale, "amount" | "syncStatus">,
): Sale | undefined {
  const existing = db.prepare(`${saleSelect} WHERE date = ? AND payment_type = ? LIMIT 1`)
    .get(date, paymentType) as Record<string, unknown> | undefined;
  if (!existing) return undefined;

  db.prepare("UPDATE sales SET amount = ?, sync_status = ? WHERE id = ?")
    .run(values.amount, values.syncStatus, existing.id as number);
  return getSaleById(Number(existing.id));
}

export function deleteSaleByDateAndPaymentType(date: string, paymentType: string): Sale | undefined {
  const existing = db.prepare(`${saleSelect} WHERE date = ? AND payment_type = ? LIMIT 1`)
    .get(date, paymentType) as Record<string, unknown> | undefined;
  if (!existing) return undefined;

  db.prepare("DELETE FROM sales WHERE id = ?").run(existing.id as number);
  return toSale(existing);
}

export function getUnsyncedSales(limit = 10): Sale[] {
  return (db.prepare(`${saleSelect} WHERE sync_status = 0 ORDER BY date LIMIT ?`)
    .all(limit) as Record<string, unknown>[]).map(toSale);
}

export function upsertWeather(weather: Weather) {
  db.prepare(`
    INSERT INTO weather (date, avg_temp, min_temp, max_temp, sum_rain, avg_humidity, one_hour_rain, summary)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(date) DO UPDATE SET
      avg_temp = excluded.avg_temp, min_temp = excluded.min_temp, max_temp = excluded.max_temp,
      sum_rain = excluded.sum_rain, avg_humidity = excluded.avg_humidity,
      one_hour_rain = excluded.one_hour_rain, summary = excluded.summary
  `).run(
    weather.date,
    weather.avgTemp,
    weather.minTemp,
    weather.maxTemp,
    weather.sumRain,
    weather.avgHumidity,
    weather.oneHourRain,
    weather.summary,
  );
}

export function markSalesSynced(weather: Weather) {
  db.prepare(`
    UPDATE sales SET sync_status = 1, weather = ?, temperature = ?
    WHERE date = ?
  `).run(weather.summary, Math.round(weather.maxTemp), weather.date);
}

export function getWeatherByMonth(month: string): Weather[] {
  return (db.prepare(`
    SELECT date, avg_temp AS avgTemp, min_temp AS minTemp, max_temp AS maxTemp,
           sum_rain AS sumRain, avg_humidity AS avgHumidity, one_hour_rain AS oneHourRain, summary
    FROM weather WHERE date LIKE ? ORDER BY date
  `).all(`${month}%`) as Record<string, unknown>[]).map(toWeather);
}

export function getAllWeather(): Weather[] {
  return (db.prepare(`
    SELECT date, avg_temp AS avgTemp, min_temp AS minTemp, max_temp AS maxTemp,
           sum_rain AS sumRain, avg_humidity AS avgHumidity, one_hour_rain AS oneHourRain, summary
    FROM weather ORDER BY date
  `).all() as Record<string, unknown>[]).map(toWeather);
}
