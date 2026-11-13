import { PageHeader } from "@/components/common/PageHeader";
import { CropRecommendForm } from "@/components/crops/CropRecommendForm";
import { LiveWhatIf } from "@/components/crops/LiveWhatIf";
import { RecommendationHistory } from "@/components/crops/RecommendationHistory";

export default function RecommendPage() {
  return (
    <>
      <PageHeader
        title="Crop advisor"
        description="Enter your soil test and climate readings. The trained machine-learning model ranks all 22 crops and shows the three best matches."
      />
      <CropRecommendForm />
      <LiveWhatIf />
      <RecommendationHistory />
    </>
  );
}
