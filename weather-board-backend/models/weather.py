from sqlmodel import SQLModel, Field

class Weather(SQLModel, table=True):
    __tablename__ = "weather"

    date: str = Field(nullable=False, primary_key=True)
    avg_temp: float = Field(nullable=False)
    min_temp: float = Field(nullable=False)
    max_temp: float = Field(nullable=False)
    sum_rain: float = Field(nullable=False)
    avg_humidity: float = Field(nullable=False)
    one_hour_rain: float = Field(nullable=False)
    summary: str = Field(nullable=False)

class WeatherCreate(SQLModel):
    date: str
    avg_temp: float
    min_temp: float
    max_temp: float
    sum_rain: float
    avg_humidity: float
    one_hour_rain: float

