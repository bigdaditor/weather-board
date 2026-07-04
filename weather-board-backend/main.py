from fastapi import FastAPI
from sqlmodel import SQLModel
from starlette.middleware.cors import CORSMiddleware

from core.db import engine
from dotenv import load_dotenv
from routers.sale import router as sale_router
from routers.weather import router as weather_router
from routers.statistics import router as statistics_router

load_dotenv()

# 테이블 생성
SQLModel.metadata.create_all(bind=engine)

app = FastAPI()

origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:8000",
    "http://127.0.0.1:8000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],      # OPTIONS, POST, GET 전부 허용
    allow_headers=["*"],      # Content-Type, Authorization 등
)

app.include_router(sale_router, tags=["sale"])
app.include_router(weather_router, tags=["weather"])
app.include_router(statistics_router, tags=["statistics"])
