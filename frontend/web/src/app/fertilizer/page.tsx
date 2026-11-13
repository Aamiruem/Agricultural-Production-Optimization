import type { Metadata } from "next";

import { FertilizerForm } from "@/components/fertilizer-form";
import { PageHeader } from "@/components/page-header";

export const metadata: Metadata = {
  title: "Fertilizer calculator",
  description: "Calculate DAP, Urea and MOP doses from your soil N-P-K and field size.",
};

export default function FertilizerPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Fertilizer calculator"
        description="Compare your soil nutrients with the crop's needs and get DAP, Urea and MOP doses for your field."
      />
      <FertilizerForm />
    </div>
  );
}
