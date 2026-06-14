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
};

const directory = join(process.cwd(), ".data");
mkdirSync(directory, { recursive: true });
const db = new DatabaseSync(join(directory, "weather-board.db"));

db.exec(`
  CREATE TABLE IF NOT EXISTS sales (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL,
    amount INTEGER NOT NULL,
    payment_type TEXT NOT NULL,
    weather TEXT NOT NULL,
    temperature INTEGER NOT NULL
  )
`);

if ((db.prepare("SELECT COUNT(*) AS count FROM sales").get() as { count: number }).count === 0) {
  const insert = db.prepare("INSERT INTO sales (date, amount, payment_type, weather, temperature) VALUES (?, ?, ?, ?, ?)");
  [
    ["2026-06-13", 1480000, "카드", "맑음", 25], ["2026-06-12", 920000, "현금", "비", 20],
    ["2026-06-11", 1160000, "카드", "흐림", 22], ["2026-06-10", 1380000, "지역상품권", "맑음", 26],
    ["2026-06-09", 860000, "카드", "비", 19], ["2026-06-08", 1210000, "현금", "맑음", 24],
    ["2026-06-07", 1080000, "카드", "흐림", 23], ["2026-06-06", 1540000, "카드", "맑음", 27],
    ["2026-06-05", 780000, "현금", "비", 18], ["2026-06-04", 1130000, "지역상품권", "흐림", 21],
    ["2026-06-03", 1320000, "카드", "맑음", 25], ["2026-06-02", 970000, "현금", "비", 20],
  ].forEach((row) => insert.run(...row));
}

export function getSales() {
  const rows = db.prepare(`
    SELECT id, date, amount, payment_type AS paymentType, weather, temperature
    FROM sales ORDER BY date DESC, id DESC
  `).all() as unknown as Sale[];

  // node:sqlite returns null-prototype row objects, which React cannot
  // serialize across the Server Component to Client Component boundary.
  return rows.map((row) => ({
    id: row.id,
    date: row.date,
    amount: row.amount,
    paymentType: row.paymentType,
    weather: row.weather,
    temperature: row.temperature,
  }));
}

export function insertSale(sale: Omit<Sale, "id">) {
  db.prepare("INSERT INTO sales (date, amount, payment_type, weather, temperature) VALUES (?, ?, ?, ?, ?)")
    .run(sale.date, sale.amount, sale.paymentType, sale.weather, sale.temperature);
}
