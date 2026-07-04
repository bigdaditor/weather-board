from fastapi import APIRouter, Query, HTTPException

from core.db import SessionDep
from models.weather import Weather
from service.weather import create_weather, read_weathers_by_month
from typing import List, Optional

router = APIRouter()


@router.post("/weather", response_model=List[Weather])
def create_weather_point(
    session: SessionDep,
) -> List[Weather]:
    return create_weather(session)


@router.get("/weather", response_model=List[Weather])
def get_weathers_point(
    session: SessionDep,
    month: Optional[str] = Query(None, description="월(YYYY-MM)"),
) -> List[Weather]:
    if month:
        return read_weathers_by_month(session, month)
    raise HTTPException(status_code=400, detail="month query parameter is required")
