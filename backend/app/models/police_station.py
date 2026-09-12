"""Mapping of the existing public.police_station table; no schema creation."""

from geoalchemy2 import Geometry, WKBElement
from sqlalchemy import BigInteger, String
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class PoliceStation(Base):
    __tablename__ = "police_station"
    __table_args__ = {"schema": "public"}

    id: Mapped[str] = mapped_column(String, primary_key=True)
    geom: Mapped[WKBElement | None] = mapped_column(Geometry("POINT", srid=4326, spatial_index=False))
    fid: Mapped[int | None] = mapped_column(BigInteger)
    name: Mapped[str | None] = mapped_column(String)
    fcode: Mapped[str | None] = mapped_column(String)
    remark: Mapped[str | None] = mapped_column(String)
    source_metadata: Mapped[str | None] = mapped_column("metadata", String)
    srs_id: Mapped[str | None] = mapped_column(String)
