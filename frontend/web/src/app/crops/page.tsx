import type { Metadata } from "next";
import { Suspense } from "react";

import { CropsTable } from "@/components/crops-table";
import { PageHeader } from "@/components/page-header";
import { getCropsFresh, requestTime } from "@/lib/api/server";

export const metadata: Metadata = {
  title: "Crop library",
  description: "Ideal N-P-K, pH, temperature, humidity and rainfall for 22 crops grown in India.",
};

// SSR: the header is part of the static shell; the table streams in at
// request time with fresh data from FastAPI (server component + fetch).
async function CropsData() {
  await requestTime(); // outside the catch, so Next's prerender signal isn't swallowed
  const crops = await getCropsFresh().catch(() => null);
  if (!crops) {
    return (
      <p role="alert" className="rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
        Could not load crops from the API. Start the backend with{" "}
        <code className="font-mono">uvicorn app.main:app --reload</code> and refresh.
      </p>
    );
  }
  return <CropsTable crops={crops} />;
}

function TableSkeleton() {
  return (
    <div className="space-y-2" aria-busy="true" aria-label="Loading crops">
      {Array.from({ length: 8 }, (_, i) => (
        <div key={i} className="h-10 animate-pulse rounded-md bg-muted" />
      ))}
    </div>
  );
}

export default function CropsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Crop library"
        description="Average growing conditions for each crop. Select a crop for details."
      />
      <Suspense fallback={<TableSkeleton />}>
        <CropsData />
      </Suspense>
    </div>
  );
}
