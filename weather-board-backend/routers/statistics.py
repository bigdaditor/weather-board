from fastapi import APIRouter, Query

from core.db import SessionDep
from models.sale_statistics import (
    SaleStatisticsResponse,
    WeatherMonthlySalesTrend,
    DailySalesByPaymentType,
)
from service.sale_statistics import (
    get_statistics,
    get_statistics_summary,
    get_weather_monthly_sales_trend,
    recompute_statistics,
    get_daily_sales_statistics,
)
from typing import List, Optional

router = APIRouter()


@router.get("/statistics", response_model=List[SaleStatisticsResponse])
def get_statistics_point(
    session: SessionDep,
    period_type: Optional[str] = Query(None, description="기간 타입 (week/month)"),
    payment_type: Optional[str] = Query(None, description="결제 타입 (all/etc/...)"),
    start_date: Optional[str] = Query(None, description="조회 시작 날짜 (YYYY-MM-DD)"),
    end_date: Optional[str] = Query(None, description="조회 종료 날짜 (YYYY-MM-DD)"),
) -> List[SaleStatisticsResponse]:
    """
    판매 통계 조회

    - period_type: 'week' (주별) 또는 'month' (월별)
    - payment_type: 'all' (전체) 또는 특정 결제 타입
    - start_date, end_date: 날짜 범위 필터

    여러 조건을 조합하여 조회 가능
    """
    return get_statistics(
        session=session,
        period_type=period_type,
        payment_type=payment_type,
        start_date=start_date,
        end_date=end_date
    )


@router.get("/statistics/summary/{period_type}", response_model=List[SaleStatisticsResponse])
def get_statistics_summary_point(
    session: SessionDep,
    period_type: str,
    payment_type: str = Query("all", description="결제 타입"),
) -> List[SaleStatisticsResponse]:
    """
    통계 요약 조회

    - period_type: 'week' (주별) 또는 'month' (월별)
    - payment_type: 기본값 'all' (전체)
    """
    return get_statistics_summary(
        session=session,
        period_type=period_type,
        payment_type=payment_type
    )


@router.get("/statistics/weather/monthly", response_model=List[WeatherMonthlySalesTrend])
def get_weather_monthly_sales_trend_point(
    session: SessionDep,
    summary: Optional[str] = Query(None, description="날씨 요약 필터"),
    summary_sky: Optional[str] = Query(None, description="하늘 상태 필터"),
    summary_rain: Optional[str] = Query(None, description="강우 상태 필터"),
    group_by: Optional[str] = Query(None, description="그룹 기준 (sky/rain/both)"),
) -> List[WeatherMonthlySalesTrend]:
    """
    날씨 요약별 월간 매출 추이

    - summary: 날씨 요약 필터 (예: '맑음 / 강우 없음')
    - summary_sky: 하늘 상태 필터 (예: '맑음')
    - summary_rain: 강우 상태 필터 (예: '강우 없음')
    - group_by: 요약 분리 기준 ('sky', 'rain', 'both')
    """
    return get_weather_monthly_sales_trend(
        session=session,
        summary=summary,
        summary_sky=summary_sky,
        summary_rain=summary_rain,
        group_by=group_by,
    )


@router.get("/statistics/daily", response_model=List[DailySalesByPaymentType])
def get_daily_sales_statistics_point(
    session: SessionDep,
    start_date: Optional[str] = Query(None, description="조회 시작 날짜 (YYYY-MM-DD)"),
    end_date: Optional[str] = Query(None, description="조회 종료 날짜 (YYYY-MM-DD)"),
) -> List[DailySalesByPaymentType]:
    """
    결제 수단별 일별 매출 통계
    """
    return get_daily_sales_statistics(
        session=session,
        start_date=start_date,
        end_date=end_date,
    )


@router.post("/statistics/recompute", response_model=dict)
def recompute_statistics_point(
    session: SessionDep,
) -> dict:
    """
    통계 데이터 재계산 요청
    """
    recompute_statistics(session=session)
    return {"status": "ok"}
