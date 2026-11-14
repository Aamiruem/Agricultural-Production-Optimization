"""Fertilizer recommendation from soil N-P-K versus a crop's target profile.

Soil values are treated as kg/ha of available nutrient. Deficits are met
with the three most common fertilizers in India:

* DAP  (18-46-0): supplies phosphorus first, plus some nitrogen
* Urea (46-0-0):  supplies the remaining nitrogen
* MOP  (0-0-60):  supplies potassium

This is a planning estimate, not a substitute for a soil-test-based
recommendation from a local Krishi Vigyan Kendra.
"""

from app.data.crops import CROPS
from app.schemas import (
    FertilizerDose,
    FertilizerRecommendation,
    FertilizerRequest,
    NutrientGap,
)

TOLERANCE = 0.10  # within ±10% of target counts as "ok"

DAP_N, DAP_P = 0.18, 0.46
UREA_N = 0.46
MOP_K = 0.60


def _gap(nutrient: str, current: float, target: float) -> NutrientGap:
    deficit = max(target - current, 0.0)
    if current < target * (1 - TOLERANCE):
        status = "low"
    elif current > target * (1 + TOLERANCE):
        status = "high"
    else:
        status = "ok"
    return NutrientGap(
        nutrient=nutrient,
        current=current,
        target=target,
        deficit=round(deficit, 2),
        status=status,
    )


def recommend_fertilizer(req: FertilizerRequest) -> FertilizerRecommendation:
    crop = CROPS.get(req.crop.lower())
    if crop is None:
        raise KeyError(req.crop)

    gaps = [
        _gap("N", req.N, crop.N),
        _gap("P", req.P, crop.P),
        _gap("K", req.K, crop.K),
    ]
    n_def, p_def, k_def = (g.deficit if g.status == "low" else 0.0 for g in gaps)

    dap = p_def / DAP_P
    urea = max(n_def - dap * DAP_N, 0.0) / UREA_N
    mop = k_def / MOP_K

    doses = [
        FertilizerDose(product=name, kg_per_ha=round(kg, 1), total_kg=round(kg * req.area_ha, 1))
        for name, kg in (("DAP (18-46-0)", dap), ("Urea (46-0-0)", urea), ("MOP (0-0-60)", mop))
        if kg > 0
    ]

    advice: list[str] = []
    if not doses:
        advice.append("Soil N-P-K already meets the crop's needs; no fertilizer required.")
    if urea > 0:
        advice.append("Split urea into 2-3 doses (basal, tillering/vegetative, flowering) to reduce losses.")
    if dap > 0:
        advice.append("Apply DAP as a basal dose at sowing, placed near the root zone.")
    if mop > 0:
        advice.append("Apply MOP as basal; on sandy soils split it into two doses.")
    for g in gaps:
        if g.status == "high":
            advice.append(f"{g.nutrient} is above target; skip extra {g.nutrient} to avoid wastage and runoff.")

    return FertilizerRecommendation(crop=crop.name, area_ha=req.area_ha, gaps=gaps, doses=doses, advice=advice)
