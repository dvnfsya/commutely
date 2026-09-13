from datetime import time

from pydantic import BaseModel, field_serializer


class ScheduleEntry(BaseModel):
    departure_time: time
    destination: str

    @field_serializer("departure_time")
    def format_departure_time(self, value: time) -> str:
        return value.strftime("%H:%M")


class StationScheduleResponse(BaseModel):
    station_id: str
    station_name: str
    schedules: list[ScheduleEntry]
