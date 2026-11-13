import { ArrowDown, ArrowUp } from "lucide-react";
import { useMemo, useState } from "react";
import Button from "react-bootstrap/Button";
import ButtonGroup from "react-bootstrap/ButtonGroup";
import Form from "react-bootstrap/Form";
import Table from "react-bootstrap/Table";
import { Link } from "react-router";

import { formatCropName, SEASONS, seasonLabel } from "@/utils/crops";

const COLUMNS = [
  { key: "name", label: "Crop" },
  { key: "N", label: "N", numeric: true },
  { key: "P", label: "P", numeric: true },
  { key: "K", label: "K", numeric: true },
  { key: "ph", label: "pH", numeric: true },
  { key: "temperature", label: "Temp °C", numeric: true },
  { key: "rainfall", label: "Rain mm", numeric: true },
];

/** Searchable, filterable, sortable crop table. */
export function CropTable({ crops }) {
  const [query, setQuery] = useState("");
  const [season, setSeason] = useState("all");
  const [sort, setSort] = useState({ key: "name", dir: "asc" });

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    const sign = sort.dir === "asc" ? 1 : -1;
    return crops
      .filter((c) => (season === "all" || c.season === season) && (!q || formatCropName(c.name).toLowerCase().includes(q)))
      .sort((a, b) => (sort.key === "name" ? sign * a.name.localeCompare(b.name) : sign * (a[sort.key] - b[sort.key])));
  }, [crops, query, season, sort]);

  const toggleSort = (key) => setSort((s) => ({ key, dir: s.key === key && s.dir === "asc" ? "desc" : "asc" }));

  return (
    <>
      <div className="d-flex flex-wrap gap-2 mb-3">
        <Form.Control type="search" placeholder="Search crops" aria-label="Search crops" value={query}
                      onChange={(e) => setQuery(e.target.value)} style={{ maxWidth: 260 }} />
        <ButtonGroup aria-label="Filter by season" className="flex-wrap">
          {[{ value: "all", label: "All" }, ...SEASONS].map((s) => (
            <Button key={s.value} variant={season === s.value ? "primary" : "outline-secondary"} size="sm"
                    aria-pressed={season === s.value} onClick={() => setSeason(s.value)}>
              {s.label}
            </Button>
          ))}
        </ButtonGroup>
      </div>
      <Table responsive hover size="sm" className="align-middle" aria-label="Crop growing conditions">
        <thead>
          <tr>
            {COLUMNS.map((c) => (
              <th key={c.key} className={c.numeric ? "text-end" : ""}
                  aria-sort={sort.key === c.key ? (sort.dir === "asc" ? "ascending" : "descending") : "none"}>
                <button type="button" className="btn btn-link btn-sm p-0 text-body fw-semibold text-decoration-none"
                        onClick={() => toggleSort(c.key)}>
                  {c.label}
                  {sort.key === c.key && (sort.dir === "asc" ? <ArrowUp size={12} className="ms-1" /> : <ArrowDown size={12} className="ms-1" />)}
                </button>
              </th>
            ))}
            <th>Season</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((c) => (
            <tr key={c.name}>
              <td><Link to={`/crops/${c.name}`} className="fw-medium">{formatCropName(c.name)}</Link></td>
              {COLUMNS.slice(1).map((col) => <td key={col.key} className="text-end tabular">{c[col.key]}</td>)}
              <td>{seasonLabel(c.season)}</td>
            </tr>
          ))}
          {rows.length === 0 && (
            <tr><td colSpan={COLUMNS.length + 1} className="text-center text-body-secondary">No crops match your filters.</td></tr>
          )}
        </tbody>
      </Table>
      <p className="small text-body-secondary mb-0">Showing {rows.length} of {crops.length} crops · N, P, K are soil nutrient ratios.</p>
    </>
  );
}
