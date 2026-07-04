from typing import Annotated
from pathlib import Path
import os

from fastapi import Depends
from sqlmodel import create_engine, Session

default_db_path = Path(__file__).resolve().parent.parent / "sales.db"
DATABASE_URL = os.getenv("DATABASE_URL", f"sqlite:///{default_db_path}")

engine = create_engine(DATABASE_URL, echo=True)


def get_session():
    with Session(engine) as session:
        yield session


SessionDep = Annotated[Session, Depends(get_session)]
