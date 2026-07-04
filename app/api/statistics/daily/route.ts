import { errorResponse } from "@/lib/errors";
import { getDailySalesStatistics } from "@/lib/statistics";

export async function GET(request: Request) {
  try {
    const params = new URL(request.url).searchParams;
    return Response.json(getDailySalesStatistics(params.get("start_date"), params.get("end_date")));
  } catch (error) {
    return errorResponse(error);
  }
}
