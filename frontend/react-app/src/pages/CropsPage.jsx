import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { ErrorAlert } from "@/components/common/ErrorAlert";
import { Loader } from "@/components/common/Loader";
import { PageHeader } from "@/components/common/PageHeader";
import { CropTable } from "@/components/crops/CropTable";
import { fetchCrops } from "@/services/cropService";
import { INDIA_CROPS } from "@/data/indiaCrops";
import { CropExplorer } from "@/components/crops/CropExplorer";
import { fetchYieldCoverage } from "@/services/mlService";

export default function CropsPage() {
  const [category,setCategory]=useState("All crops"); const [query,setQuery]=useState("");
  const [state,setState]=useState("All India"); const [season,setSeason]=useState("All seasons"); const [soil,setSoil]=useState("All soil types");
  const filtered=useMemo(()=>INDIA_CROPS.filter(c=>{
    const text=c.slice(0,4).join(" ").toLowerCase();
    const seasonMatch=season==="All seasons"||(Array.isArray(c[6]) ? c[6].join(" ") : c[2]).toLowerCase().includes(season.toLowerCase());
    const soilMatch=soil==="All soil types"||c[2].toLowerCase().includes(soil.toLowerCase());
    const stateMatch=state==="All India"||(c[5] || c[3]).toLowerCase().includes(state.toLowerCase());
    return (category==="All crops"||c[0]===category)&&seasonMatch&&soilMatch&&stateMatch&&text.includes(query.toLowerCase());
  }),[category,query,state,season,soil]);
  const crops = useQuery({ queryKey: ["crops"], queryFn: () => fetchCrops() });
  const coverage = useQuery({ queryKey: ["yield-coverage"], queryFn: fetchYieldCoverage, staleTime: 60 * 60 * 1000 });
  return (
    <>
      <PageHeader title="India crop library" description="Explore Indian grains, pulses, oilseeds, fruits, vegetables, nuts and spices by season, soil and leading states." />
      <p className="source-note">India dataset coverage: {coverage.data ? `${coverage.data.crops.length} recorded crop types across ${coverage.data.states.length} regions, ${coverage.data.observations.toLocaleString()} rows (${coverage.data.first_year}-${coverage.data.last_year})` : "Loading India crop records..."}. State presence is shown from historical records where available. <a href="https://www.data.gov.in/catalog/district-wise-season-wise-crop-production-statistics-0" target="_blank" rel="noreferrer">Official Indian crop production catalogue</a>.</p>
      <CropExplorer category={category} setCategory={setCategory} query={query} setQuery={setQuery} state={state} setState={setState} season={season} setSeason={setSeason} soil={soil} setSoil={setSoil} filtered={filtered}/>
      <h2 className="h4 mt-5">Crops supported by the trained recommendation model</h2>
      {crops.isLoading && <Loader label="Loading crops" />}
      <ErrorAlert error={crops.error} />
      {crops.data && <CropTable crops={crops.data} />}
    </>
  );
}
