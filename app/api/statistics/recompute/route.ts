import { getStatistics } from "@/lib/statistics";

export async function POST() {
  // Statistics are computed from current sales on every read, so this also
  // validates that all source rows can be aggregated.
  getStatistics({});
  return Response.json({ status: "ok" });
}
