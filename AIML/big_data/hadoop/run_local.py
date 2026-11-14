"""Run the MapReduce job locally, exactly as Hadoop Streaming would:
map (per split) → shuffle & sort by key → reduce.

    python -m AIML.big_data.hadoop.run_local            # top state-crop yields

On a real cluster (input already in HDFS):
    hdfs dfs -put AIML/datasets/crop_yield.csv /data/
    hadoop jar $HADOOP_HOME/share/hadoop/tools/lib/hadoop-streaming-*.jar \\
      -files AIML/big_data/hadoop/mapper.py,AIML/big_data/hadoop/reducer.py \\
      -mapper "python3 mapper.py" -reducer "python3 reducer.py" \\
      -input /data/crop_yield.csv -output /out/state_crop_yield
"""

from __future__ import annotations

import subprocess
import sys
from pathlib import Path

from AIML.config import YIELD_DATA_PATH

HERE = Path(__file__).parent


def run(input_path: Path = YIELD_DATA_PATH, splits: int = 4) -> list[tuple[str, float, float, float]]:
    lines = input_path.read_text(encoding="utf-8").splitlines(keepends=True)
    header, body = lines[0], lines[1:]
    size = -(-len(body) // splits)
    mapped: list[str] = []
    for i in range(splits):  # each split is mapped independently, like separate map tasks
        chunk = header + "".join(body[i * size : (i + 1) * size])
        out = subprocess.run(
            [sys.executable, str(HERE / "mapper.py")], input=chunk, capture_output=True, text=True, check=True
        )
        mapped += out.stdout.splitlines(keepends=True)
    shuffled = "".join(sorted(mapped, key=lambda l: l.split("\t", 1)[0]))  # the shuffle/sort phase
    reduced = subprocess.run(
        [sys.executable, str(HERE / "reducer.py")], input=shuffled, capture_output=True, text=True, check=True
    )
    rows = []
    for line in reduced.stdout.splitlines():
        key, prod, area, y = line.split("\t")
        rows.append((key, float(prod), float(area), float(y)))
    return rows


if __name__ == "__main__":
    result = run()
    print(f"{len(result)} state|crop keys")
    for key, prod, area, y in sorted((r for r in result if r[0].endswith("|Wheat")), key=lambda r: -r[3])[:5]:
        print(f"{key:30s} yield {y:.2f} t/ha over {area:,.0f} ha")
