import { revalidatePath } from "next/cache";
import { ApiError, errorResponse } from "@/lib/errors";
import { readWeatherByMonth, syncWeather, toWeatherApiRecord } from "@/lib/weather";

export async function GET(request: Request) {
  try {
    const month = new URL(request.url).searchParams.get("month");
    if (!month) throw new ApiError(400, "month query parameter is required");
    return Response.json(readWeatherByMonth(month).map(toWeatherApiRecord));
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST() {
  try {
    const weather = await syncWeather();
    revalidatePath("/", "layout");
    return Response.json(weather.map(toWeatherApiRecord));
  } catch (error) {
    return errorResponse(error);
  }
}
