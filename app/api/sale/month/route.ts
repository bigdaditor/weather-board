import { ApiError, errorResponse } from "@/lib/errors";
import { getMonthlySales } from "@/lib/sales";

export async function GET(request: Request) {
  try {
    const month = new URL(request.url).searchParams.get("key");
    if (!month) throw new ApiError(400, "key query parameter is required");
    return Response.json(await getMonthlySales(month));
  } catch (error) {
    return errorResponse(error);
  }
}
