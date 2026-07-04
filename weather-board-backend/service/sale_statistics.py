from typing import List, Optional, Dict, Tuple
from datetime import datetime, timedelta, timezone
from collections import defaultdict
from sqlmodel import Session, select, delete
from models.sale_statistics import (
    SaleStatistics,
    SaleStatisticsResponse,
    WeatherMonthlySales,
    WeatherMonthlySalesTrend,
    DailySalesByPaymentType,
)
from models.sale import Sale
from models.weather import Weather


def _get_monday_of_week(date_str: str) -> str:
    date = datetime.strptime(date_str, "%Y-%m-%d")
    weekday = date.weekday()

    if weekday == 6:  # 일요일
        monday = date + timedelta(days=1)
    else:
        monday = date - timedelta(days=weekday)

    return monday.strftime("%Y-%m-%d")


def _get_saturday_of_week(monday_str: str) -> str:
    monday = datetime.strptime(monday_str, "%Y-%m-%d")
    saturday = monday + timedelta(days=5)
    return saturday.strftime("%Y-%m-%d")


def _get_month_range(date_str: str) -> Tuple[str, str]:
    date = datetime.strptime(date_str, "%Y-%m-%d")
    year = date.year
    month = date.month

    first_day = datetime(year, month, 1).strftime("%Y-%m-%d")

    if month == 12:
        last_day = datetime(year, 12, 31).strftime("%Y-%m-%d")
    else:
        next_month = datetime(year, month + 1, 1)
        last_day = (next_month - timedelta(days=1)).strftime("%Y-%m-%d")

    return first_day, last_day


def _normalize_date(date_str: str) -> str:
    if "-" in date_str:
        return date_str
    return datetime.strptime(date_str, "%Y%m%d").strftime("%Y-%m-%d")


def _month_key(date_str: str) -> str:
    normalized = _normalize_date(date_str)
    return normalized[:7]


def recompute_statistics(session: Session) -> None:
    sales = session.exec(select(Sale).order_by(Sale.input_date)).all()

    session.exec(delete(SaleStatistics))

    if not sales:
        session.commit()
        return

    weekly_all: Dict[Tuple[str, str], Dict[str, int]] = defaultdict(lambda: {'total': 0, 'count': 0})
    weekly_by_type: Dict[Tuple[str, str], Dict[str, Dict[str, int]]] = defaultdict(
        lambda: defaultdict(lambda: {'total': 0, 'count': 0})
    )
    monthly_all: Dict[Tuple[str, str], Dict[str, int]] = defaultdict(lambda: {'total': 0, 'count': 0})
    monthly_by_type: Dict[Tuple[str, str], Dict[str, Dict[str, int]]] = defaultdict(
        lambda: defaultdict(lambda: {'total': 0, 'count': 0})
    )

    for sale in sales:
        monday = _get_monday_of_week(sale.input_date)
        saturday = _get_saturday_of_week(monday)
        week_key = (monday, saturday)

        weekly_all[week_key]['total'] += sale.amount
        weekly_all[week_key]['count'] += 1
        weekly_by_type[week_key][sale.payment_type]['total'] += sale.amount
        weekly_by_type[week_key][sale.payment_type]['count'] += 1

        month_start, month_end = _get_month_range(sale.input_date)
        month_key = (month_start, month_end)

        monthly_all[month_key]['total'] += sale.amount
        monthly_all[month_key]['count'] += 1
        monthly_by_type[month_key][sale.payment_type]['total'] += sale.amount
        monthly_by_type[month_key][sale.payment_type]['count'] += 1

    now = datetime.now(timezone.utc)
    statistics: List[SaleStatistics] = []

    for (start, end), data in weekly_all.items():
        avg = data['total'] / data['count'] if data['count'] > 0 else 0
        statistics.append(
            SaleStatistics(
                period_type="week",
                period_start=start,
                period_end=end,
                payment_type="all",
                total_amount=data['total'],
                transaction_count=data['count'],
                avg_amount=avg,
                created_at=now,
                updated_at=now,
            )
        )

    for (start, end), types in weekly_by_type.items():
        for payment_type, data in types.items():
            avg = data['total'] / data['count'] if data['count'] > 0 else 0
            statistics.append(
                SaleStatistics(
                    period_type="week",
                    period_start=start,
                    period_end=end,
                    payment_type=payment_type,
                    total_amount=data['total'],
                    transaction_count=data['count'],
                    avg_amount=avg,
                    created_at=now,
                    updated_at=now,
                )
            )

    for (start, end), data in monthly_all.items():
        avg = data['total'] / data['count'] if data['count'] > 0 else 0
        statistics.append(
            SaleStatistics(
                period_type="month",
                period_start=start,
                period_end=end,
                payment_type="all",
                total_amount=data['total'],
                transaction_count=data['count'],
                avg_amount=avg,
                created_at=now,
                updated_at=now,
            )
        )

    for (start, end), types in monthly_by_type.items():
        for payment_type, data in types.items():
            avg = data['total'] / data['count'] if data['count'] > 0 else 0
            statistics.append(
                SaleStatistics(
                    period_type="month",
                    period_start=start,
                    period_end=end,
                    payment_type=payment_type,
                    total_amount=data['total'],
                    transaction_count=data['count'],
                    avg_amount=avg,
                    created_at=now,
                    updated_at=now,
                )
            )

    session.add_all(statistics)
    session.commit()


def _group_summary(summary: str, group_by: Optional[str]) -> Optional[str]:
    if not summary:
        return None
    if not group_by:
        return summary
    parts = [part.strip() for part in summary.split("/")]
    if group_by == "sky":
        return parts[0] if parts else summary
    if group_by == "rain":
        return parts[1] if len(parts) > 1 else summary
    return summary


def get_weather_monthly_sales_trend(
    session: Session,
    summary: Optional[str] = None,
    summary_sky: Optional[str] = None,
    summary_rain: Optional[str] = None,
    group_by: Optional[str] = None,
) -> List[WeatherMonthlySalesTrend]:
    weather_map = {
        _normalize_date(weather.date): weather.summary
        for weather in session.exec(select(Weather)).all()
        if weather.summary
    }

    sales = session.exec(select(Sale).order_by(Sale.input_date)).all()
    monthly_sales: Dict[str, Dict[str, Dict[str, int]]] = defaultdict(
        lambda: defaultdict(lambda: defaultdict(int))
    )
    group_targets = ["sky", "rain"] if group_by in (None, "both") else [group_by]

    for sale in sales:
        sale_date = _normalize_date(sale.input_date)
        weather_summary = weather_map.get(sale_date)
        if not weather_summary:
            continue
        month = _month_key(sale_date)
        for target in group_targets:
            grouped_summary = _group_summary(weather_summary, target)
            if not grouped_summary:
                continue
            if summary and grouped_summary != summary:
                continue
            if target == "sky" and summary_sky and grouped_summary != summary_sky:
                continue
            if target == "rain" and summary_rain and grouped_summary != summary_rain:
                continue
            monthly_sales[target][grouped_summary][month] += sale.amount

    results: List[WeatherMonthlySalesTrend] = []
    for category_type in sorted(monthly_sales.keys()):
        summaries = monthly_sales[category_type]
        for weather_summary in sorted(summaries.keys()):
            month_map = summaries[weather_summary]
            months = [
                WeatherMonthlySales(month=month, total_amount=total)
                for month, total in sorted(month_map.items())
            ]
            results.append(
                WeatherMonthlySalesTrend(
                    category_type=category_type,
                    summary=weather_summary,
                    data=months,
                )
            )

    return results


def get_daily_sales_statistics(
    session: Session,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
) -> List[DailySalesByPaymentType]:
    query = select(Sale)

    if start_date:
        query = query.where(Sale.input_date >= start_date)
    if end_date:
        query = query.where(Sale.input_date <= end_date)

    sales = session.exec(query.order_by(Sale.input_date)).all()
    daily_sales: Dict[str, Dict[str, int]] = defaultdict(lambda: defaultdict(int))

    for sale in sales:
        daily_sales[sale.input_date][sale.payment_type] += sale.amount

    results: List[DailySalesByPaymentType] = []
    for date, payment_types in sorted(daily_sales.items()):
        total_amount = sum(payment_types.values())
        results.append(
            DailySalesByPaymentType(
                date=date,
                payment_types=dict(payment_types),
                total_amount=total_amount,
            )
        )

    return results


def get_statistics(
    session: Session,
    period_type: Optional[str] = None,
    payment_type: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
) -> List[SaleStatisticsResponse]:
    """
    통계 데이터 조회

    Args:
        session: DB 세션
        period_type: 기간 타입 ('week' 또는 'month')
        payment_type: 결제 타입 ('all', 'etc', 등)
        start_date: 조회 시작 날짜 (YYYY-MM-DD)
        end_date: 조회 종료 날짜 (YYYY-MM-DD)

    Returns:
        통계 데이터 리스트
    """
    query = select(SaleStatistics)

    # 기간 타입 필터
    if period_type:
        query = query.where(SaleStatistics.period_type == period_type)

    # 결제 타입 필터
    if payment_type:
        query = query.where(SaleStatistics.payment_type == payment_type)

    # 날짜 범위 필터
    if start_date:
        query = query.where(SaleStatistics.period_start >= start_date)

    if end_date:
        query = query.where(SaleStatistics.period_end <= end_date)

    # 정렬: 기간 시작일 기준 오름차순
    query = query.order_by(SaleStatistics.period_start)

    results = session.exec(query).all()

    return [
        SaleStatisticsResponse(
            period_type=stat.period_type,
            period_start=stat.period_start,
            period_end=stat.period_end,
            payment_type=stat.payment_type,
            total_amount=stat.total_amount,
            transaction_count=stat.transaction_count,
            avg_amount=stat.avg_amount,
            created_at=stat.created_at,
            updated_at=stat.updated_at,
        )
        for stat in results
    ]


def get_statistics_summary(
    session: Session,
    period_type: str,
    payment_type: str = "all"
) -> List[SaleStatisticsResponse]:
    """
    특정 기간 타입과 결제 타입의 전체 통계 조회

    Args:
        session: DB 세션
        period_type: 기간 타입 ('week' 또는 'month')
        payment_type: 결제 타입 (기본값: 'all')

    Returns:
        통계 데이터 리스트
    """
    return get_statistics(
        session=session,
        period_type=period_type,
        payment_type=payment_type
    )
