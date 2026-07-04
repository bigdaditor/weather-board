from datetime import datetime
from typing import Optional, List, Dict
from sqlmodel import SQLModel, Field

class Sale(SQLModel, table=True):
    __tablename__ = "sale"  # 기존 sale 테이블 사용

    id: Optional[int] = Field(default=None, primary_key=True, index=True)
    input_date: str
    amount: int
    payment_type: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    sync_status: int = 0

class SaleCreate(SQLModel):
    input_date: str
    amount: int
    payment_type: str
    created_at: datetime = datetime.now()
    sync_status: int = 0

class SaleUpdate(SQLModel):
    input_date: str
    amount: int
    payment_type: str
    sync_status: int = 0

class SaleDelete(SQLModel):
    input_date: str
    payment_type: str

class DailySaleByPaymentType(SQLModel):
    date: str
    payment_types: Dict[str, int]  # {payment_type: amount}
    total_amount: int

class SaleListResponse(SQLModel):
    total: int
    page: int
    page_size: int
    total_pages: int
    data: List[DailySaleByPaymentType]

class DailySaleTotal(SQLModel):
    date: str
    total_amount: int

class MonthlySaleResponse(SQLModel):
    data: List[DailySaleTotal]
