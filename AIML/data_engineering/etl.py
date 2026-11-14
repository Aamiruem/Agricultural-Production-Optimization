"""ETL pipeline: Extract → Transform → Load into a SQL warehouse, then analyse.

Extract   raw CSVs (crop yield, daily weather)
Transform pandas cleaning + Polars lazy aggregations (fast, columnar)
Load      SQLite star schema (dim_crop, dim_state, fact_yield, fact_weather) with
          indexes and a view; the same SQL runs on PostgreSQL via SQLAlchemy URL.

    python -m AIML.data_engineering.etl                     # SQLite in AIML/datasets/
    python -m AIML.data_engineering.etl --db postgresql+psycopg://user:pw@host/db
"""

from __future__ import annotations

import argparse
from dataclasses import dataclass

import pandas as pd
import polars as pl
from sqlalchemy import create_engine, text

from AIML.config import WEATHER_DATA_PATH, YIELD_DATA_PATH, YIELD_DB_PATH
from AIML.preprocessing.yield_features import clean


@dataclass
class QualityReport:
    rows_in: int
    rows_out: int
    dropped: int
    issues: list[str]


# ------------------------------------------------------------------ extract
def extract() -> tuple[pd.DataFrame, pd.DataFrame]:
    return pd.read_csv(YIELD_DATA_PATH), pd.read_csv(WEATHER_DATA_PATH, parse_dates=["date"])


# ---------------------------------------------------------------- transform
def quality_checks(raw: pd.DataFrame, cleaned: pd.DataFrame) -> QualityReport:
    issues = []
    if (raw["Area"] <= 0).any():
        issues.append(f"{int((raw['Area'] <= 0).sum())} rows with non-positive area")
    if (raw["Yield"] <= 0).any():
        issues.append(f"{int((raw['Yield'] <= 0).sum())} rows with zero yield")
    ratio = raw["Production"] / raw["Area"]
    mismatch = ((ratio - raw["Yield"]).abs() > 0.05 * raw["Yield"].clip(lower=1e-9)) & (raw["Area"] > 0)
    if mismatch.any():
        issues.append(f"{int(mismatch.sum())} rows where Yield != Production/Area (±5%)")
    return QualityReport(len(raw), len(cleaned), len(raw) - len(cleaned), issues)


def transform_yield(raw: pd.DataFrame) -> pd.DataFrame:
    return clean(raw)[
        [
            "Crop",
            "Crop_Year",
            "Season",
            "State",
            "Area",
            "Production",
            "Annual_Rainfall",
            "fertilizer_kg_ha",
            "pesticide_kg_ha",
            "Yield",
        ]
    ]


def transform_weather(raw: pd.DataFrame) -> pl.DataFrame:
    """Polars lazy query: monthly weather aggregates (columnar + query optimisation)."""
    return (
        pl.from_pandas(raw)
        .lazy()
        .with_columns(pl.col("date").dt.year().alias("year"), pl.col("date").dt.month().alias("month"))
        .group_by("year", "month")
        .agg(
            pl.col("precipitation_sum").sum().round(1).alias("rain_mm"),
            pl.col("et0_fao_evapotranspiration").sum().round(1).alias("et0_mm"),
            pl.col("temperature_2m_max").mean().round(2).alias("t_max_mean"),
            (pl.col("temperature_2m_max") >= 40).sum().alias("heat_days"),
        )
        .with_columns((pl.col("rain_mm") - pl.col("et0_mm")).round(1).alias("water_balance_mm"))
        .sort("year", "month")
        .collect()
    )


# --------------------------------------------------------------------- load
SCHEMA = """
CREATE TABLE dim_crop  (crop_id INTEGER PRIMARY KEY, crop TEXT UNIQUE NOT NULL);
CREATE TABLE dim_state (state_id INTEGER PRIMARY KEY, state TEXT UNIQUE NOT NULL);
CREATE TABLE fact_yield (
  id INTEGER PRIMARY KEY, crop_id INTEGER NOT NULL REFERENCES dim_crop(crop_id),
  state_id INTEGER NOT NULL REFERENCES dim_state(state_id), season TEXT NOT NULL, year INTEGER NOT NULL,
  area_ha REAL, production_t REAL, rainfall_mm REAL, fertilizer_kg_ha REAL, pesticide_kg_ha REAL, yield_t_ha REAL
);
CREATE INDEX ix_yield_crop_state_year ON fact_yield (crop_id, state_id, year);
CREATE TABLE fact_weather_month (year INTEGER, month INTEGER, rain_mm REAL, et0_mm REAL, t_max_mean REAL,
  heat_days INTEGER, water_balance_mm REAL, PRIMARY KEY (year, month));
CREATE VIEW v_state_crop_summary AS
  SELECT s.state, c.crop, COUNT(*) AS seasons, ROUND(AVG(f.yield_t_ha), 3) AS avg_yield,
         ROUND(SUM(f.production_t), 0) AS total_production
  FROM fact_yield f JOIN dim_crop c USING (crop_id) JOIN dim_state s USING (state_id)
  GROUP BY s.state, c.crop;
"""


def load(yield_df: pd.DataFrame, weather_month: pl.DataFrame, db_url: str) -> None:
    engine = create_engine(db_url)
    with engine.begin() as conn:  # one transaction: all tables or nothing
        for stmt in ("v_state_crop_summary",):
            conn.execute(text(f"DROP VIEW IF EXISTS {stmt}"))
        for table in ("fact_yield", "fact_weather_month", "dim_crop", "dim_state"):
            conn.execute(text(f"DROP TABLE IF EXISTS {table}"))
        for stmt in filter(str.strip, SCHEMA.split(";")):
            conn.execute(text(stmt))

        crops = pd.DataFrame({"crop": sorted(yield_df["Crop"].unique())})
        crops["crop_id"] = range(1, len(crops) + 1)
        states = pd.DataFrame({"state": sorted(yield_df["State"].unique())})
        states["state_id"] = range(1, len(states) + 1)
        crops.to_sql("dim_crop", conn, if_exists="append", index=False)
        states.to_sql("dim_state", conn, if_exists="append", index=False)

        fact = (
            yield_df.merge(crops, left_on="Crop", right_on="crop")
            .merge(states, left_on="State", right_on="state")
            .rename(
                columns={
                    "Season": "season",
                    "Crop_Year": "year",
                    "Area": "area_ha",
                    "Production": "production_t",
                    "Annual_Rainfall": "rainfall_mm",
                    "Yield": "yield_t_ha",
                }
            )
        )
        fact[
            [
                "crop_id",
                "state_id",
                "season",
                "year",
                "area_ha",
                "production_t",
                "rainfall_mm",
                "fertilizer_kg_ha",
                "pesticide_kg_ha",
                "yield_t_ha",
            ]
        ].to_sql("fact_yield", conn, if_exists="append", index=False)
        # rows(named=True) avoids a pyarrow dependency for Polars → pandas.
        pd.DataFrame(weather_month.rows(named=True)).to_sql("fact_weather_month", conn, if_exists="append", index=False)


# ------------------------------------------------------------------ analyse
QUERIES = {
    "top_rice_states": """
        SELECT state, avg_yield, seasons FROM v_state_crop_summary
        WHERE crop = 'Rice' AND seasons >= 10 ORDER BY avg_yield DESC LIMIT 5""",
    "yield_trend_wheat": """
        SELECT f.year, ROUND(SUM(f.production_t) / SUM(f.area_ha), 3) AS national_yield
        FROM fact_yield f JOIN dim_crop c USING (crop_id)
        WHERE c.crop = 'Wheat' GROUP BY f.year ORDER BY f.year""",
    "wettest_months": """
        SELECT year, month, rain_mm FROM fact_weather_month ORDER BY rain_mm DESC LIMIT 5""",
}


def run(db_url: str | None = None) -> dict:
    db_url = db_url or f"sqlite:///{YIELD_DB_PATH.as_posix()}"
    raw_yield, raw_weather = extract()
    yield_df = transform_yield(raw_yield)
    report = quality_checks(raw_yield, yield_df)
    load(yield_df, transform_weather(raw_weather), db_url)
    with create_engine(db_url).connect() as conn:
        results = {name: [dict(r._mapping) for r in conn.execute(text(q))] for name, q in QUERIES.items()}
    return {"quality": report.__dict__, **results}


if __name__ == "__main__":
    import json

    parser = argparse.ArgumentParser()
    parser.add_argument("--db", help="SQLAlchemy URL (default: SQLite file in AIML/datasets)")
    out = run(parser.parse_args().db)
    out["yield_trend_wheat"] = out["yield_trend_wheat"][-5:]
    print(json.dumps(out, indent=2, default=str))
