"""Mapping of the existing public.lighting table; no schema creation."""

from geoalchemy2 import Geometry, WKBElement
from sqlalchemy import BigInteger, String, Integer
from sqlalchemy.dialects.postgresql import DOUBLE_PRECISION
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class Lighting(Base):
    __tablename__ = "lighting"
    __table_args__ = {"schema": "public"}

    id: Mapped[str] = mapped_column(String, primary_key=True)
    geom: Mapped[WKBElement | None] = mapped_column(Geometry("POINT", srid=4326, spatial_index=False))
    fid: Mapped[int | None] = mapped_column(BigInteger)
    kelurahan: Mapped[str | None] = mapped_column(String)
    kecamatan: Mapped[str | None] = mapped_column(String)
    category: Mapped[str | None] = mapped_column(String)
    lamp_power_w: Mapped[int | None] = mapped_column(Integer)
    latitude: Mapped[float | None] = mapped_column(DOUBLE_PRECISION)
    longitude: Mapped[float | None] = mapped_column(DOUBLE_PRECISION)
    year: Mapped[str | None] = mapped_column(String)
    address: Mapped[str | None] = mapped_column(String)
