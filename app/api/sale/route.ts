import { revalidatePath } from "next/cache";
import { ApiError, errorResponse, readJsonObject } from "@/lib/errors";
import {
  createSaleRecord,
  deleteSaleRecord,
  getGroupedSales,
  toSaleApiRecord,
  updateSaleRecord,
} from "@/lib/sales";

export async function GET(request: Request) {
  try {
    const params = new URL(request.url).searchParams;
    const page = Number(params.get("page") ?? 1);
    const pageSize = Number(params.get("page_size") ?? 10);
    if (!Number.isInteger(page) || page < 1) throw new ApiError(422, "page must be a positive integer");
    if (!Number.isInteger(pageSize) || pageSize < 1 || pageSize > 100) {
      throw new ApiError(422, "page_size must be an integer from 1 to 100");
    }
    return Response.json(await getGroupedSales(page, pageSize));
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const sale = await createSaleRecord(await readJsonObject(request));
    revalidatePath("/", "layout");
    return Response.json(toSaleApiRecord(sale));
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const sale = await updateSaleRecord(await readJsonObject(request));
    revalidatePath("/", "layout");
    return Response.json(sale);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(request: Request) {
  try {
    const sale = await deleteSaleRecord(await readJsonObject(request));
    revalidatePath("/", "layout");
    return Response.json(sale);
  } catch (error) {
    return errorResponse(error);
  }
}
