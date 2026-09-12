"""Mapping of the existing public.railway table; no schema creation."""

from geoalchemy2 import Geometry, WKBElement
from sqlalchemy import BigInteger, String
from sqlalchemy.dialects.postgresql import DOUBLE_PRECISION
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class Railway(Base):
    __tablename__ = "railway"
    __table_args__ = {"schema": "public"}

    id: Mapped[str] = mapped_column(String, primary_key=True)
    geom: Mapped[WKBElement | None] = mapped_column(Geometry("MULTILINESTRING", srid=4326, spatial_index=False))
    fid: Mapped[int | None] = mapped_column(BigInteger)
    name: Mapped[str | None] = mapped_column(String)
    fcode: Mapped[str | None] = mapped_column(String)
    remark: Mapped[str | None] = mapped_column(String)
    source_metadata: Mapped[str | None] = mapped_column("metadata", String)
    srs_id: Mapped[str | None] = mapped_column(String)
    shape_length: Mapped[float | None] = mapped_column("shape_Length", DOUBLE_PRECISION)
