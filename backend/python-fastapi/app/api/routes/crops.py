from fastapi import APIRouter, HTTPException, Query

from app.api.deps import DbSession, OptionalUser
from app.data.crops import CROPS
from app.repositories import predictions as predictions_repo
from app.schemas import (
    CropOut,
    CropRecommendation,
    FertilizerRecommendation,
    FertilizerRequest,
    SoilConditions,
)
from app.services.fertilizer import recommend_fertilizer
from app.services.recommender import recommend_crops

router = APIRouter(tags=["crops"])


@router.get("/crops", response_model=list[CropOut])
def list_crops(season: str | None = Query(default=None)):
    crops = CROPS.values()
    if season:
        crops = [c for c in crops if c.season == season.lower()]
    return [c.to_dict() for c in crops]


@router.get("/crops/{name}", response_model=CropOut)
def get_crop(name: str):
    crop = CROPS.get(name.lower())
    if crop is None:
        raise HTTPException(status_code=404, detail=f"Unknown crop '{name}'")
    return crop.to_dict()


@router.post("/recommend/crop", response_model=CropRecommendation)
def recommend_crop(soil: SoilConditions, db: DbSession, user: OptionalUser, top: int = Query(default=3, ge=1, le=10)):
    """Public endpoint; signed-in users also get the result saved to their history."""
    rec = recommend_crops(soil, k=top)
    if user is not None:
        predictions_repo.add(db, predictions_repo.build(soil, rec, user_id=user.id))
    return rec


@router.post("/recommend/fertilizer", response_model=FertilizerRecommendation)
def recommend_fert(req: FertilizerRequest):
    try:
        return recommend_fertilizer(req)
    except KeyError:
        raise HTTPException(status_code=404, detail=f"Unknown crop '{req.crop}'") from None
