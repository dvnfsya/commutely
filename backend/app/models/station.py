from geoalchemy2 import Geometry, WKBElement
from sqlalchemy import BigInteger, Identity, Index, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class Station(Base):
    __tablename__ = "stations"
    __table_args__ = (
        UniqueConstraint("code", name="uq_stations_code"),
        Index("ix_stations_location", "location", postgresql_using="gist"),
        {"schema": "public"},
    )

    id: Mapped[int] = mapped_column(BigInteger, Identity(), primary_key=True)
    code: Mapped[str] = mapped_column(String(32))
    name: Mapped[str] = mapped_column(String(255))
    location: Mapped[WKBElement] = mapped_column(
        Geometry("POINT", srid=4326, spatial_index=False)
    )
    area: Mapped[str | None] = mapped_column(String(120))
    source: Mapped[str | None] = mapped_column(String(255))
    source_id: Mapped[str | None] = mapped_column(String(255))
