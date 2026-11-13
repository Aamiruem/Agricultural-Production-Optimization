import type { Metadata } from "next";

import { RequireAuth } from "@/components/auth/require-auth";
import { FarmsDashboard } from "@/components/farms/farms-dashboard";
import { PageHeader } from "@/components/page-header";

export const metadata: Metadata = {
  title: "Farms",
  description: "Manage farms and fields, log field activities and get fertilizer plans.",
};

export default function FarmsPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Farms"
        description="Your farms, fields and activity log, saved to your account. Changes appear live in every open tab."
      />
      <RequireAuth what="manage your farms">
        <FarmsDashboard />
      </RequireAuth>
    </div>
  );
}
