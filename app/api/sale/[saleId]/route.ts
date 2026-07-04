import { errorResponse } from "@/lib/errors";
import { getSaleRecord } from "@/lib/sales";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ saleId: string }> },
) {
  try {
    return Response.json(await getSaleRecord(Number((await params).saleId)));
  } catch (error) {
    return errorResponse(error);
  }
}
