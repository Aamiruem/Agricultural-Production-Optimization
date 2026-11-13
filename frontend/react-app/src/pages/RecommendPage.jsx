import { Sprout } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { CropRecommendForm } from "@/components/crops/CropRecommendForm";
import { LiveWhatIf } from "@/components/crops/LiveWhatIf";
import { RecommendationHistory } from "@/components/crops/RecommendationHistory";

export default function RecommendPage() {
  return (
    <>
      <PageHeader page="recommend" icon={Sprout} color="#22c55e" />
      <CropRecommendForm />
      <LiveWhatIf />
      <RecommendationHistory />
    </>
  );
}
