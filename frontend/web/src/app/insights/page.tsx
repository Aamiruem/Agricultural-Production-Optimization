import type { Metadata } from "next";

import { RequireAuth } from "@/components/auth/require-auth";
import { ModelInsights } from "@/components/insights/model-insights";
import { MyHistory } from "@/components/insights/my-history";
import { PageHeader } from "@/components/page-header";

export const metadata: Metadata = {
  title: "Insights",
  description: "Compare the machine-learning models behind the crop advisor and review your saved recommendations.",
};

export default function InsightsPage() {
  return (
    <div className="space-y-10">
      <PageHeader
        title="Insights"
        description="How the crop model was chosen, which soil and climate features matter most, and your own history."
      />
      <section aria-labelledby="model-title" className="space-y-4">
        <h2 id="model-title" className="text-lg font-semibold">Model comparison</h2>
        <ModelInsights />
      </section>
      <section aria-labelledby="history-title" className="space-y-4">
        <h2 id="history-title" className="text-lg font-semibold">Your history</h2>
        <RequireAuth what="see your saved recommendations and run batch jobs">
          <MyHistory />
        </RequireAuth>
      </section>
    </div>
  );
}
