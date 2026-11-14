"""Apache Spark (PySpark): distributed analytics + MLlib on the crop-yield data.

* DataFrame API and Spark SQL
* Window functions: year-over-year yield growth per state & crop
* MLlib pipeline: StringIndexer → OneHotEncoder → VectorAssembler → RandomForestRegressor

Runs locally (`local[*]`) or on a cluster (spark-submit). Needs Java 17+ and
`pip install pyspark`.

    python -m AIML.big_data.spark_job
"""

from __future__ import annotations

from AIML.config import YIELD_DATA_PATH


def main(master: str = "local[*]") -> dict:
    from pyspark.ml import Pipeline
    from pyspark.ml.evaluation import RegressionEvaluator
    from pyspark.ml.feature import OneHotEncoder, StringIndexer, VectorAssembler
    from pyspark.ml.regression import RandomForestRegressor
    from pyspark.sql import SparkSession, Window
    from pyspark.sql import functions as F

    spark = SparkSession.builder.master(master).appName("agrismart-yield").getOrCreate()
    df = (
        spark.read.csv(str(YIELD_DATA_PATH), header=True, inferSchema=True)
        .withColumn("Crop", F.trim("Crop"))
        .withColumn("Season", F.trim("Season"))
        .withColumn("State", F.trim("State"))
        .filter((F.col("Area") > 0) & (F.col("Yield") > 0) & (F.col("Crop") != "Coconut"))
        .withColumn("log_area", F.log1p("Area"))
    )

    # Spark SQL
    df.createOrReplaceTempView("yield")
    top = spark.sql("""
        SELECT State, ROUND(SUM(Production) / SUM(Area), 3) AS yield_t_ha
        FROM yield WHERE Crop = 'Rice' GROUP BY State HAVING COUNT(*) >= 10 ORDER BY yield_t_ha DESC LIMIT 5
    """).collect()

    # Window function: year-over-year change of state-level yield
    yearly = df.groupBy("State", "Crop", "Crop_Year").agg((F.sum("Production") / F.sum("Area")).alias("y"))
    w = Window.partitionBy("State", "Crop").orderBy("Crop_Year")
    growth = (
        yearly.withColumn("yoy_pct", (F.col("y") / F.lag("y").over(w) - 1) * 100)
        .filter(F.col("Crop") == "Wheat")
        .orderBy(F.desc("Crop_Year"))
        .limit(5)
        .collect()
    )

    # MLlib regression on log yield, time-based split
    data = df.withColumn("label", F.log1p("Yield"))
    train, test = data.filter(F.col("Crop_Year") < 2015), data.filter(F.col("Crop_Year") >= 2015)
    cats = ["Crop", "Season", "State"]
    pipeline = Pipeline(
        stages=[
            *[StringIndexer(inputCol=c, outputCol=f"{c}_idx", handleInvalid="keep") for c in cats],
            OneHotEncoder(inputCols=[f"{c}_idx" for c in cats], outputCols=[f"{c}_oh" for c in cats]),
            VectorAssembler(
                inputCols=[f"{c}_oh" for c in cats] + ["Crop_Year", "log_area", "Annual_Rainfall"], outputCol="features"
            ),
            RandomForestRegressor(numTrees=100, maxDepth=12, seed=42),
        ]
    )
    pred = pipeline.fit(train).transform(test)
    rmse = RegressionEvaluator(metricName="rmse").evaluate(pred)
    r2 = RegressionEvaluator(metricName="r2").evaluate(pred)
    spark.stop()
    return {
        "top_rice_states": [r.asDict() for r in top],
        "wheat_yoy": [r.asDict() for r in growth],
        "mllib_rf": {"rmse_log": round(rmse, 3), "r2_log": round(r2, 3)},
    }


if __name__ == "__main__":
    import json

    print(json.dumps(main(), indent=2, default=str))
