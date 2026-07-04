import { errorResponse } from "@/lib/errors";
import { getStatistics } from "@/lib/statistics";

export async function GET(request: Request) {
  try {
    const params = new URL(request.url).searchParams;
    return Response.json(getStatistics({
      periodType: params.get("period_type"),
      paymentType: params.get("payment_type"),
      startDate: params.get("start_date"),
      endDate: params.get("end_date"),
    }));
  } catch (error) {
    return errorResponse(error);
  }
}
