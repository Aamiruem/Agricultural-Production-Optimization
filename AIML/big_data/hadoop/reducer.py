#!/usr/bin/env python3
"""Hadoop Streaming REDUCER: sum production and area per key (input arrives sorted
by key), output "state|crop<TAB>total_production<TAB>total_area<TAB>yield_t_ha"."""
import sys


def main() -> None:
    current, prod, area = None, 0.0, 0.0
    for line in sys.stdin:
        key, p, a = line.rstrip("\n").split("\t")
        if key != current:
            if current is not None:
                print(f"{current}\t{prod:.0f}\t{area:.0f}\t{prod / area:.3f}")
            current, prod, area = key, 0.0, 0.0
        prod += float(p)
        area += float(a)
    if current is not None:
        print(f"{current}\t{prod:.0f}\t{area:.0f}\t{prod / area:.3f}")


if __name__ == "__main__":
    main()
