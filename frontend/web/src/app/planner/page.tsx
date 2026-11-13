import type { Metadata } from "next";

import { PageHeader } from "@/components/page-header";
import { FarmPlanner } from "@/components/planner/farm-planner";

export const metadata: Metadata = {
  title: "Farm planner",
  description: "Plan each field's crop, area and season, and track progress from sowing to harvest.",
};

export default function PlannerPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Farm planner"
        description="Add your fields, assign crops and seasons, and click a status badge to move it from planned → sown → harvested."
      />
      <FarmPlanner />
    </div>
  );
}
