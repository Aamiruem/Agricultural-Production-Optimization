from pydantic import BaseModel, Field


class SoilConditions(BaseModel):
    """Soil and climate readings for one field."""

    N: float = Field(ge=0, le=200, description="Nitrogen ratio in soil")
    P: float = Field(ge=0, le=200, description="Phosphorus ratio in soil")
    K: float = Field(ge=0, le=250, description="Potassium ratio in soil")
    temperature: float = Field(ge=-10, le=55, description="Average temperature (°C)")
    humidity: float = Field(ge=0, le=100, description="Relative humidity (%)")
    ph: float = Field(ge=0, le=14, description="Soil pH")
    rainfall: float = Field(ge=0, le=500, description="Rainfall (mm)")


class CropOut(BaseModel):
    name: str
    season: str
    category: str
    N: float
    P: float
    K: float
    temperature: float
    humidity: float
    ph: float
    rainfall: float


class CropScore(BaseModel):
    crop: str
    confidence: float = Field(ge=0, le=1)
    season: str
    category: str


class CropRecommendation(BaseModel):
    method: str  # "ml-model" or "profile-similarity"
    top: list[CropScore]


class FertilizerRequest(BaseModel):
    crop: str
    N: float = Field(ge=0, le=200)
    P: float = Field(ge=0, le=200)
    K: float = Field(ge=0, le=250)
    area_ha: float = Field(default=1, gt=0, le=10_000, description="Field area in hectares")


class NutrientGap(BaseModel):
    nutrient: str
    current: float
    target: float
    deficit: float
    status: str  # "low" | "ok" | "high"


class FertilizerDose(BaseModel):
    product: str
    kg_per_ha: float
    total_kg: float


class FertilizerRecommendation(BaseModel):
    crop: str
    area_ha: float
    gaps: list[NutrientGap]
    doses: list[FertilizerDose]
    advice: list[str]
