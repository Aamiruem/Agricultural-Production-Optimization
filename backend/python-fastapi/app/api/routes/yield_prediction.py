"""Yield predictions served by the trained AIML regression bundle."""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.core.cache import get_cache, rounded_key

router = APIRouter(tags=["yield prediction"])


class YieldPredictionInput(BaseModel):
    crop: str = Field(min_length=2, max_length=80)
    season: str = Field(min_length=3, max_length=20)
    state: str = Field(min_length=2, max_length=80)
    year: int = Field(ge=1997, le=2100)
    area_ha: float = Field(gt=0, le=100_000)
    annual_rainfall: float | None = Field(default=None, ge=0, le=20_000)


@router.post("/yield/predict")
def predict_yield(payload: YieldPredictionInput):
    """Return model yield (t/ha), field production (t), and historical context."""
    try:
        from AIML.agentic_ai.tools import predict_yield as run_yield_model

        result = get_cache("yield_prediction").get_or_compute(
            rounded_key("yield", payload.model_dump()),
            lambda: run_yield_model(
                crop=payload.crop,
                season=payload.season,
                state=payload.state,
                year=payload.year,
                area_ha=payload.area_ha,
                annual_rainfall=payload.annual_rainfall,
            ),
        )
    except FileNotFoundError as exc:
        raise HTTPException(status_code=503, detail="Yield model is not installed on this API instance.") from exc
    except (KeyError, ValueError) as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    return {"model": "XGBoost yield regression", **result}
