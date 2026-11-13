#!/usr/bin/env python3
"""Hadoop Streaming MAPPER: crop_yield.csv lines → "state|crop<TAB>production<TAB>area".

Hadoop feeds each input split to stdin; we emit key/value lines on stdout.
The framework then sorts by key and sends each key's values to one reducer.
"""
import csv
import sys


def main() -> None:
    reader = csv.reader(sys.stdin)
    for row in reader:
        if not row or row[0] == "Crop":  # header (appears once per split at most)
            continue
        try:
            crop, _year, _season, state, area, production = (c.strip() for c in row[:6])
            area_f, prod_f = float(area), float(production)
        except (ValueError, IndexError):
            continue  # skip malformed lines instead of failing the job
        if area_f > 0 and crop != "Coconut":
            print(f"{state}|{crop}\t{prod_f}\t{area_f}")


if __name__ == "__main__":
    main()
