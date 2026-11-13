"use client";

import Paper from "@mui/material/Paper";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TableSortLabel from "@mui/material/TableSortLabel";
import TextField from "@mui/material/TextField";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import Link from "next/link";
import { useMemo, useState } from "react";

import type { Crop, Season } from "@/lib/api/types";
import { formatCropName, SEASONS, seasonLabel } from "@/lib/crops";

type SortKey = "name" | "N" | "P" | "K" | "ph" | "temperature" | "rainfall";

const COLUMNS: { key: SortKey; label: string; numeric?: boolean }[] = [
  { key: "name", label: "Crop" },
  { key: "N", label: "N", numeric: true },
  { key: "P", label: "P", numeric: true },
  { key: "K", label: "K", numeric: true },
  { key: "ph", label: "pH", numeric: true },
  { key: "temperature", label: "Temp °C", numeric: true },
  { key: "rainfall", label: "Rain mm", numeric: true },
];

/** Material UI table with search, season filter and sorting. */
export function CropsTable({ crops }: { crops: Crop[] }) {
  const [query, setQuery] = useState("");
  const [season, setSeason] = useState<Season | "all">("all");
  const [sort, setSort] = useState<{ key: SortKey; dir: "asc" | "desc" }>({ key: "name", dir: "asc" });

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = crops.filter(
      (c) =>
        (season === "all" || c.season === season) &&
        (!q || c.name.includes(q) || formatCropName(c.name).toLowerCase().includes(q)),
    );
    const sign = sort.dir === "asc" ? 1 : -1;
    return [...filtered].sort((a, b) =>
      sort.key === "name" ? sign * a.name.localeCompare(b.name) : sign * (a[sort.key] - b[sort.key]),
    );
  }, [crops, query, season, sort]);

  const toggleSort = (key: SortKey) =>
    setSort((s) => ({ key, dir: s.key === key && s.dir === "asc" ? "desc" : "asc" }));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <TextField
          size="small"
          label="Search crops"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full sm:w-64"
        />
        <ToggleButtonGroup
          size="small"
          exclusive
          value={season}
          onChange={(_, v) => v && setSeason(v)}
          aria-label="Filter by season"
          className="flex-wrap"
        >
          <ToggleButton value="all">All</ToggleButton>
          {SEASONS.map((s) => (
            <ToggleButton key={s.value} value={s.value}>
              {s.label}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
      </div>

      <TableContainer component={Paper} variant="outlined">
        <Table size="small" aria-label="Crop growing conditions">
          <TableHead>
            <TableRow>
              {COLUMNS.map((col) => (
                <TableCell key={col.key} align={col.numeric ? "right" : "left"}>
                  <TableSortLabel
                    active={sort.key === col.key}
                    direction={sort.key === col.key ? sort.dir : "asc"}
                    onClick={() => toggleSort(col.key)}
                  >
                    {col.label}
                  </TableSortLabel>
                </TableCell>
              ))}
              <TableCell>Season</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((c) => (
              <TableRow key={c.name} hover>
                <TableCell>
                  <Link href={`/crops/${c.name}`} className="font-medium text-primary hover:underline">
                    {formatCropName(c.name)}
                  </Link>
                </TableCell>
                {COLUMNS.slice(1).map((col) => (
                  <TableCell key={col.key} align="right" className="tabular-nums">
                    {c[col.key as Exclude<SortKey, "name">]}
                  </TableCell>
                ))}
                <TableCell>{seasonLabel(c.season)}</TableCell>
              </TableRow>
            ))}
            {rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={COLUMNS.length + 1} align="center">
                  No crops match your filters.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
      <p className="text-xs text-muted-foreground">
        Showing {rows.length} of {crops.length} crops · N, P, K are soil nutrient ratios.
      </p>
    </div>
  );
}
