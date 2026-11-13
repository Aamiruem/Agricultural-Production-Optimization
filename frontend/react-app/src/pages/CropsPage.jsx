import { useQuery } from "@tanstack/react-query";
import { LibraryBig } from "lucide-react";
import { useSearchParams } from "react-router";

import { ErrorAlert } from "@/components/common/ErrorAlert";
import { Loader } from "@/components/common/Loader";
import { PageHeader } from "@/components/common/PageHeader";
import { CropExplorer } from "@/components/crops/CropExplorer";
import { CropTable } from "@/components/crops/CropTable";
import { useT } from "@/i18n/useT";
import { fetchCrops } from "@/services/cropService";

const KEYS = ["query", "category", "state", "season", "soil"];

export default function CropsPage() {
  const { lang } = useT();
  // Filters live in the URL so a filtered view can be shared or bookmarked.
  const [params, setParams] = useSearchParams();
  const filters = Object.fromEntries(KEYS.map((k) => [k, params.get(k) ?? ""]));
  const onChange = (key, value) => setParams((p) => {
    const next = new URLSearchParams(p);
    if (value) next.set(key, value); else next.delete(key);
    return next;
  }, { replace: true });
  const crops = useQuery({ queryKey: ["crops"], queryFn: () => fetchCrops() });

  return (
    <>
      <PageHeader page="crops" icon={LibraryBig} color="#ea580c" />
      <CropExplorer filters={filters} onChange={onChange} />
      <h2 className="h4 mt-5">{lang === "hi" ? "ML सुझाव मॉडल द्वारा समर्थित 22 फसलें" : "22 crops supported by the ML recommendation model"}</h2>
      {crops.isLoading && <Loader label="Loading crops" />}
      <ErrorAlert error={crops.error} />
      {crops.data && <CropTable crops={crops.data} />}
    </>
  );
}
