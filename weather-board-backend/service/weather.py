from typing import List

from dotenv import load_dotenv
from fastapi import HTTPException
from httpx import Client
from core.db import SessionDep
from models.weather import Weather
from sqlmodel import select, update
from models.sale import Sale
from utils.convert import date_format_change
from utils.weather_classifier import *
import os

load_dotenv()

def create_weather(
    session: SessionDep,
):
    result = session.exec(
        select(Sale)
        .where(Sale.sync_status == 0)
        .order_by(Sale.input_date)
        .limit(10)).all()
    
    if not result:
        raise HTTPException(status_code=404, detail="Sale not found")

    start_dt = date_format_change(
        date=result[0].input_date,
        current_form="%Y-%m-%d",
        new_form="%Y%m%d",
    )
    
    end_dt = date_format_change(
        date=result[len(result)-2].input_date,
        current_form="%Y-%m-%d",
        new_form="%Y%m%d",
    )
    
    response = fetch_weather_data(start_dt, end_dt)

    for item in response["items"]["item"]:
        one_hour_rain = float(item["hr1MaxRn"] if item["hr1MaxRn"] !="" else 0)
        avg_total_cloud = float(item["avgTca"] if item["avgTca"] != "" else 0)

        rain_status = classify_rain(one_hour_rain)
        summary = rain_status or classify_sky(avg_total_cloud)

        new_weather = Weather(
            date = item["tm"],
            avg_temp= float(item["avgTa"]),
            min_temp= float(item["minTa"]),
            max_temp= float(item["maxTa"]),
            one_hour_rain=one_hour_rain,
            sum_rain= float(item["sumRn"] if item["sumRn"] !="" else 0),
            avg_humidity= float(item["avgRhm"]),
            summary= summary
        )
        session.add(new_weather)
        session.exec(
            update(Sale).
            where(Sale.input_date == item["tm"]).
            values(sync_status=1)
        )
        session.commit()
    return read_weathers_by_input_date(session, start_dt, end_dt)

def fetch_weather_data(
    start_date: str,
    end_date: str,
):
    URL = "http://apis.data.go.kr/1360000/AsosDalyInfoService/getWthrDataList"
    http = Client()
    service_key = os.getenv("KMA_SERVICE_KEY")
    params = {
        "serviceKey": service_key,
        "numOfRows": 10,
        "pageNo": 1,
        "dataType": "JSON",
        "dataCd": "ASOS",
        "dateCd": "DAY",
        "startDt": start_date,
        "endDt": end_date,
        "stnIds": 108
    }

    response = http.get(URL, params=params)
    data = response.json().get("response")
    header = data.get("header", {})
    if header.get("resultCode") != "00":
        raise Exception("No weather data found")

    body = data.get("body", {})
    return body

def read_weathers_by_input_date(
    session: SessionDep,
    start_date: str,
    end_date: str
) -> List[Weather]:
    weathers = session.exec(
        select(Weather)
        .where(Weather.date >= start_date, Weather.date <= end_date)
        .order_by(Weather.date)
    ).all()
    return weathers


def read_weathers_by_month(
    session: SessionDep,
    month: str,
) -> List[Weather]:
    weathers = session.exec(
        select(Weather)
        .where(Weather.date.startswith(month))
        .order_by(Weather.date)
    ).all()
    return weathers
