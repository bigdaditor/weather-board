import { errorResponse } from "@/lib/errors";
import { getWeatherMonthlySalesTrend } from "@/lib/statistics";

export async function GET(request: Request) {
  try {
    const params = new URL(request.url).searchParams;
    return Response.json(await getWeatherMonthlySalesTrend({
      summary: params.get("summary"),
      summarySky: params.get("summary_sky"),
      summaryRain: params.get("summary_rain"),
      groupBy: params.get("group_by"),
    }));
  } catch (error) {
    return errorResponse(error);
  }
}
