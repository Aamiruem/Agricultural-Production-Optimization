import { Sprout } from "lucide-react";
import { G } from "@/lib/icons";
import { PageHeader } from "@/components/common/PageHeader";
import { CropRecommendForm } from "@/components/crops/CropRecommendForm";
import { LiveWhatIf } from "@/components/crops/LiveWhatIf";
import { RecommendationHistory } from "@/components/crops/RecommendationHistory";

export default function RecommendPage() {
  return (
    <>
      <PageHeader page="recommend" icon="potted_plant" color={G.green} />
      <CropRecommendForm />
      <LiveWhatIf />
      <RecommendationHistory />
    </>
  );
}
