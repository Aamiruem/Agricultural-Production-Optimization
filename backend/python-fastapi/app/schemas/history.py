from pydantic import BaseModel, ConfigDict, Field

from app.schemas import SoilConditions
from app.schemas.common import UtcDatetime


class PredictionOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    N: float
    P: float
    K: float
    temperature: float
    humidity: float
    ph: float
    rainfall: float
    top_crop: str
    confidence: float
    method: str
    source: str
    created_at: UtcDatetime


class PredictionPage(BaseModel):
    items: list[PredictionOut]
    total: int
    limit: int
    offset: int


class CropCount(BaseModel):
    crop: str
    count: int
    avg_confidence: float


class BatchRequest(BaseModel):
    rows: list[SoilConditions] = Field(min_length=1, max_length=1000)


class BatchJobOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    status: str
    total_rows: int
    result: list | None = None
    error: str | None = None
    created_at: UtcDatetime
    finished_at: UtcDatetime | None = None
