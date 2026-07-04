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

db.exec("PRAGMA busy_timeout = 5000");

db.exec(`
  CREATE TABLE IF NOT EXISTS sale (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    input_date TEXT NOT NULL,
    amount INTEGER NOT NULL,
    payment_type TEXT NOT NULL,
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

const legacySalesExists = (db.prepare(`
  SELECT COUNT(*) AS count FROM sqlite_master WHERE type = 'table' AND name = 'sales'
`).get() as { count: number }).count > 0;

if (legacySalesExists && (db.prepare("SELECT COUNT(*) AS count FROM sale").get() as { count: number }).count === 0) {
  db.exec(`
    INSERT OR IGNORE INTO sale (id, input_date, amount, payment_type, created_at, sync_status)
    SELECT id, date, amount, payment_type, created_at, sync_status FROM sales
  `);

  db.exec(`
    INSERT OR IGNORE INTO weather (date, avg_temp, min_temp, max_temp, sum_rain, avg_humidity, one_hour_rain, summary)
    SELECT date, temperature, temperature, temperature, 0, 0, 0, weather FROM sales
  `);
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
  SELECT sale.id,
         sale.input_date AS date,
         sale.amount,
         sale.payment_type AS paymentType,
         COALESCE(weather.summary, '미동기화') AS weather,
         COALESCE(ROUND(weather.max_temp), 0) AS temperature,
         sale.created_at AS createdAt,
         sale.sync_status AS syncStatus
  FROM sale
  LEFT JOIN weather ON weather.date = sale.input_date
`;

export function getSales(): Sale[] {
  return (db.prepare(`${saleSelect} ORDER BY date DESC, id DESC`).all() as Record<string, unknown>[]).map(toSale);
}

export function getSaleById(id: number): Sale | undefined {
  const row = db.prepare(`${saleSelect} WHERE sale.id = ?`).get(id) as Record<string, unknown> | undefined;
  return row ? toSale(row) : undefined;
}

export function insertSale(sale: Omit<Sale, "id" | "weather" | "temperature">): Sale {
  const result = db.prepare(`
    INSERT INTO sale (input_date, amount, payment_type, created_at, sync_status)
    VALUES (?, ?, ?, ?, ?)
  `).run(
    sale.date,
    sale.amount,
    sale.paymentType,
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
  const existing = db.prepare(`${saleSelect} WHERE sale.input_date = ? AND sale.payment_type = ? LIMIT 1`)
    .get(date, paymentType) as Record<string, unknown> | undefined;
  if (!existing) return undefined;

  db.prepare("UPDATE sale SET amount = ?, sync_status = ? WHERE id = ?")
    .run(values.amount, values.syncStatus, existing.id as number);
  return getSaleById(Number(existing.id));
}

export function deleteSaleByDateAndPaymentType(date: string, paymentType: string): Sale | undefined {
  const existing = db.prepare(`${saleSelect} WHERE sale.input_date = ? AND sale.payment_type = ? LIMIT 1`)
    .get(date, paymentType) as Record<string, unknown> | undefined;
  if (!existing) return undefined;

  db.prepare("DELETE FROM sale WHERE id = ?").run(existing.id as number);
  return toSale(existing);
}

export function getUnsyncedSales(limit = 10): Sale[] {
  return (db.prepare(`${saleSelect} WHERE sale.sync_status = 0 ORDER BY sale.input_date LIMIT ?`)
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
    UPDATE sale SET sync_status = 1
    WHERE input_date = ?
  `).run(weather.date);
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
