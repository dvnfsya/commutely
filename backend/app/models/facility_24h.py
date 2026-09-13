"""Mapping of the existing public.facilities24h table; no schema creation."""

from geoalchemy2 import Geometry, WKBElement
from sqlalchemy import Float, String
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class Facility24h(Base):
    __tablename__ = "facilities24h"
    __table_args__ = {"schema": "public"}

    id: Mapped[str] = mapped_column(String, primary_key=True)
    # The database declares this as 4326, although its coordinate values are UTM 48S.
    geom: Mapped[WKBElement | None] = mapped_column(Geometry("POINT", srid=4326, spatial_index=False))
    name: Mapped[str | None] = mapped_column(String)
    category: Mapped[str | None] = mapped_column(String)
    address: Mapped[str | None] = mapped_column(String)
    phone: Mapped[str | None] = mapped_column(String)
    website: Mapped[str | None] = mapped_column(String)
    rating: Mapped[float | None] = mapped_column(Float)
