"""Mapping of the existing public.halte_dropoff table; no schema creation."""

from geoalchemy2 import Geometry, WKBElement
from sqlalchemy import BigInteger, String
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class HalteDropoff(Base):
    __tablename__ = "halte_dropoff"
    __table_args__ = {"schema": "public"}

    id: Mapped[str] = mapped_column(String, primary_key=True)
    geom: Mapped[WKBElement | None] = mapped_column(Geometry("POINT", srid=4326, spatial_index=False))
    fid: Mapped[int | None] = mapped_column(BigInteger)
    name: Mapped[str | None] = mapped_column(String)
    condition: Mapped[str | None] = mapped_column(String)
    station_id: Mapped[str | None] = mapped_column(String)
    source: Mapped[str | None] = mapped_column(String)
