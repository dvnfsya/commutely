"""Mapping of the existing public.halte_transjakarta table; no schema creation."""

from geoalchemy2 import Geometry, WKBElement
from sqlalchemy import BigInteger, String, Integer
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class HalteTransjakarta(Base):
    __tablename__ = "halte_transjakarta"
    __table_args__ = {"schema": "public"}

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=False)
    geom: Mapped[WKBElement | None] = mapped_column(Geometry("GEOMETRY", srid=-1, spatial_index=False))
    fid: Mapped[int | None] = mapped_column(BigInteger)
    category: Mapped[str | None] = mapped_column(String)
    kelurahan: Mapped[str | None] = mapped_column(String)
    kecamatan: Mapped[str | None] = mapped_column(String)
    kota: Mapped[str | None] = mapped_column(String)
    address: Mapped[str | None] = mapped_column(String)
    corridor: Mapped[str | None] = mapped_column("corridor ", String)
