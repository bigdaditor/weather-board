import { errorResponse } from "@/lib/errors";
import { getStatistics } from "@/lib/statistics";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ periodType: string }> },
) {
  try {
    return Response.json(getStatistics({
      periodType: (await params).periodType,
      paymentType: new URL(request.url).searchParams.get("payment_type") ?? "all",
    }));
  } catch (error) {
    return errorResponse(error);
  }
}
