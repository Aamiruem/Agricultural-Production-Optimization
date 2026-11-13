import type { Metadata } from "next";

import { CropRecommendForm } from "@/components/crop-recommend-form";
import { LiveWhatIf } from "@/components/live-what-if";
import { PageHeader } from "@/components/page-header";
import { RecommendationHistory } from "@/components/recommendation-history";

export const metadata: Metadata = {
  title: "Crop advisor",
  description: "Find the best crops for your soil N-P-K, pH, temperature, humidity and rainfall.",
};

export default function RecommendPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Crop advisor"
        description="Enter your soil test and climate readings. We rank all 22 crops and show the three best matches."
      />
      <CropRecommendForm />
      <LiveWhatIf />
      <RecommendationHistory />
    </div>
  );
}
