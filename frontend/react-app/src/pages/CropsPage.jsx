import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { ErrorAlert } from "@/components/common/ErrorAlert";
import { Loader } from "@/components/common/Loader";
import { PageHeader } from "@/components/common/PageHeader";
import { CropTable } from "@/components/crops/CropTable";
import { fetchCrops } from "@/services/cropService";
import { CropExplorer, INDIA_CROPS } from "@/pages/IndiaToolsPage";

export default function CropsPage() {
  const [category,setCategory]=useState("All crops"); const [query,setQuery]=useState("");
  const filtered=useMemo(()=>INDIA_CROPS.filter(c=>(category==="All crops"||c[0]===category)&&c.slice(0,4).join(" ").toLowerCase().includes(query.toLowerCase())),[category,query]);
  const crops = useQuery({ queryKey: ["crops"], queryFn: () => fetchCrops() });
  return (
    <>
      <PageHeader title="India crop library" description="Explore Indian grains, pulses, oilseeds, fruits, vegetables, nuts and spices by season, soil and leading states." />
      <CropExplorer category={category} setCategory={setCategory} query={query} setQuery={setQuery} filtered={filtered}/>
      <h2 className="h4 mt-5">Crops supported by the trained recommendation model</h2>
      {crops.isLoading && <Loader label="Loading crops" />}
      <ErrorAlert error={crops.error} />
      {crops.data && <CropTable crops={crops.data} />}
    </>
  );
}
