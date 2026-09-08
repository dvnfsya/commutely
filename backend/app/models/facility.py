from geoalchemy2 import Geometry, WKBElement
from sqlalchemy import BigInteger, Boolean, Identity, Index, String
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class Facility(Base):
    __tablename__ = "facilities"
    __table_args__ = (
        Index("ix_facilities_location", "location", postgresql_using="gist"),
        Index("ix_facilities_category", "category"),
        {"schema": "public"},
    )

    id: Mapped[int] = mapped_column(BigInteger, Identity(), primary_key=True)
    name: Mapped[str] = mapped_column(String(255))
    category: Mapped[str] = mapped_column(String(64))
    location: Mapped[WKBElement] = mapped_column(
        Geometry("POINT", srid=4326, spatial_index=False)
    )
    source: Mapped[str] = mapped_column(String(255))
    source_id: Mapped[str | None] = mapped_column(String(255))
    is_24_hours: Mapped[bool | None] = mapped_column(Boolean)
