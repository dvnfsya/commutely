import json
from typing import Annotated

from pydantic import BaseModel, ConfigDict, Field, JsonValue, StringConstraints, field_validator


class AssistantRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    question: Annotated[str, StringConstraints(strict=True, strip_whitespace=True, min_length=1, max_length=2000)]
    context: dict[str, JsonValue]
    station_id: str | None = None
    @field_validator("context")
    @classmethod
    def bounded_context(cls, value):
        try:
            encoded = json.dumps(value, ensure_ascii=True, allow_nan=False)
        except (ValueError, RecursionError):
            raise ValueError("Context must contain finite JSON values.") from None
        if len(encoded.encode("utf-8")) > 16000:
            raise ValueError("Context exceeds the 16000-byte serialized JSON limit.")
        return value


class AssistantResponse(BaseModel):
    answer: Annotated[str, Field(strict=True, min_length=1, max_length=8000)]
