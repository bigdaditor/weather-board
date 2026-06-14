import { createSale } from "@/app/actions";
import DashboardScreen from "@/app/screens/dashboard-screen";
import { getSales } from "@/lib/db";

export const dynamic = "force-dynamic";

export default function Home() {
  return <DashboardScreen sales={getSales()} createSaleAction={createSale} />;
}
