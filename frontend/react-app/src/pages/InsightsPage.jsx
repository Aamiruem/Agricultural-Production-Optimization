import { Link } from "react-router";

import { EmptyState } from "@/components/common/EmptyState";
import { PageHeader } from "@/components/common/PageHeader";
import { ModelInsights } from "@/components/insights/ModelInsights";
import { MyHistory } from "@/components/insights/MyHistory";
import { useSession } from "@/store/authStore";

export default function InsightsPage() {
  const { user } = useSession();
  return (
    <>
      <PageHeader
        title="Insights"
        description="How the crop model was chosen, which soil and climate features matter most, and your own history."
      />
      <section aria-labelledby="model-title" className="mb-5">
        <h2 id="model-title" className="h5 mb-3">
          Model comparison
        </h2>
        <ModelInsights />
      </section>
      <section aria-labelledby="history-title">
        <h2 id="history-title" className="h5 mb-3">
          Your history
        </h2>
        {user ? (
          <MyHistory />
        ) : (
          <EmptyState>
            <p className="mb-0">
              Saved prediction history needs the AgriSmart API service. Your recent crop recommendations are kept in this
              browser on the <Link to="/crop-recommendation">crop advisor</Link> page.
            </p>
          </EmptyState>
        )}
      </section>
    </>
  );
}
