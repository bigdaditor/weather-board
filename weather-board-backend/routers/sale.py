from fastapi import APIRouter, Query

from core.db import SessionDep
from models.sale import Sale, SaleCreate, SaleUpdate, SaleDelete, SaleListResponse, MonthlySaleResponse
from service.sale import crate_sale, update_sale, get_sales, get_sale, delete_sale, get_sale_by_month

router = APIRouter()


@router.post("/sale", response_model=Sale)
def create_sale_point(
    session: SessionDep,
    sale: SaleCreate,
) -> Sale:
    return crate_sale(session, sale)


@router.get("/sale", response_model=SaleListResponse)
def get_sales_point(
    session: SessionDep,
    page: int = Query(1, ge=1, description="페이지 번호"),
    page_size: int = Query(10, ge=1, le=100, description="페이지당 항목 수")
) -> SaleListResponse:
    return get_sales(session, page, page_size)


@router.get("/sale/{sale_id}", response_model=Sale)
def get_sale_point(
    session: SessionDep,
    sale_id: int,
) -> Sale:
    return get_sale(session, sale_id)


@router.get("/sale/month/", response_model=MonthlySaleResponse)
def get_sale_by_month_point(
    session: SessionDep,
    key: str,
) -> MonthlySaleResponse:
    return get_sale_by_month(session, key)


@router.patch("/sale", response_model=Sale)
def update_sale_point(
    session: SessionDep,
    sale: SaleUpdate,
) -> Sale:
    return update_sale(session, sale)


@router.delete("/sale", response_model=Sale)
def delete_sale_point(
    session: SessionDep,
    sale: SaleDelete,
) -> Sale:
    return delete_sale(session, sale)
