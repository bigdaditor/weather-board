from datetime import datetime, timezone
from typing import Optional, List, Dict
from sqlmodel import SQLModel, Field


class SaleStatistics(SQLModel, table=True):
    """
    판매 통계 테이블
    주별, 월별, 결제 타입별 등 다양한 기준으로 집계된 통계 저장
    """
    __tablename__ = "sale_statistics"

    id: Optional[int] = Field(default=None, primary_key=True)

    # 집계 기간 정보
    period_type: str  # 'week', 'month'
    period_start: str  # 시작 날짜 (YYYY-MM-DD)
    period_end: str    # 종료 날짜 (YYYY-MM-DD)

    # 결제 타입 (전체 집계는 'all', 특정 타입은 해당 값)
    payment_type: str

    # 통계 데이터
    total_amount: int  # 총 판매액
    transaction_count: int  # 거래 건수
    avg_amount: float  # 평균 판매액

    # 메타데이터
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class SaleStatisticsCreate(SQLModel):
    period_type: str
    period_start: str
    period_end: str
    payment_type: str
    total_amount: int
    transaction_count: int
    avg_amount: float


class SaleStatisticsResponse(SQLModel):
    """통계 조회 응답"""
    period_type: str
    period_start: str
    period_end: str
    payment_type: str
    total_amount: int
    transaction_count: int
    avg_amount: float
    created_at: datetime
    updated_at: datetime


class WeatherMonthlySales(SQLModel):
    month: str
    total_amount: int


class WeatherMonthlySalesTrend(SQLModel):
    category_type: str
    summary: str
    data: List[WeatherMonthlySales]


class DailySalesByPaymentType(SQLModel):
    date: str
    payment_types: Dict[str, int]
    total_amount: int
