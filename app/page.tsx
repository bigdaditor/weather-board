import { createSale } from "@/app/actions";
import DashboardScreen from "@/app/screens/dashboard-screen";
import { getSales } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function Home() {
  return <DashboardScreen sales={await getSales()} createSaleAction={createSale} />;
}
