"""Mapping of the existing public.health_facility table; no schema creation."""

from geoalchemy2 import Geometry, WKBElement
from sqlalchemy import BigInteger, String
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class HealthFacility(Base):
    __tablename__ = "health_facility"
    __table_args__ = {"schema": "public"}

    id: Mapped[str] = mapped_column(String, primary_key=True)
    geom: Mapped[WKBElement | None] = mapped_column(Geometry("POINT", srid=4326, spatial_index=False))
    fid: Mapped[int | None] = mapped_column(BigInteger)
    name: Mapped[str | None] = mapped_column(String)
    category: Mapped[str | None] = mapped_column(String)
    kelurahan: Mapped[str | None] = mapped_column(String)
    kecamatan: Mapped[str | None] = mapped_column(String)
    kota: Mapped[str | None] = mapped_column(String)
    address: Mapped[str | None] = mapped_column(String)
