import { useQuery } from "@tanstack/react-query";

import { ErrorAlert } from "@/components/common/ErrorAlert";
import { Loader } from "@/components/common/Loader";
import { PageHeader } from "@/components/common/PageHeader";
import { CropTable } from "@/components/crops/CropTable";
import { fetchCrops } from "@/services/cropService";

export default function CropsPage() {
  const crops = useQuery({ queryKey: ["crops"], queryFn: () => fetchCrops() });
  return (
    <>
      <PageHeader title="Crop library" description="Average growing conditions for each crop. Select a crop for details." />
      {crops.isLoading && <Loader label="Loading crops" />}
      <ErrorAlert error={crops.error} />
      {crops.data && <CropTable crops={crops.data} />}
    </>
  );
}
