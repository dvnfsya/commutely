"""Import application models so Alembic sees their shared metadata."""

from app.models.station import Station
from app.models.halte_dropoff import HalteDropoff
from app.models.lighting import Lighting
from app.models.health_facility import HealthFacility
from app.models.facility_24h import Facility24h
from app.models.police_station import PoliceStation
from app.models.railway import Railway
from app.models.halte_transjakarta import HalteTransjakarta
from app.models.safety_score import safety_score

__all__ = ["Station", "HalteDropoff", "Lighting", "HealthFacility", "Facility24h",
           "PoliceStation", "Railway", "HalteTransjakarta", "safety_score"]
