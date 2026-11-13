import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getCropCached } from "@/lib/api/server";
import { CROP_NAMES, formatCropName, seasonLabel } from "@/lib/crops";

// SSG: every known crop is prerendered at build time. The data comes from a
// "use cache" function, so pages are regenerated in the background (ISR).
export async function generateStaticParams() {
  return CROP_NAMES.map((name) => ({ name }));
}

export async function generateMetadata(props: PageProps<"/crops/[name]">): Promise<Metadata> {
  const { name } = await props.params;
  const label = formatCropName(name);
  return {
    title: `${label} growing conditions`,
    description: `Ideal soil nutrients, pH, temperature, humidity and rainfall for growing ${label.toLowerCase()} in India.`,
  };
}

async function CropDetails({ params }: Pick<PageProps<"/crops/[name]">, "params">) {
  const { name } = await params;
  if (!(CROP_NAMES as readonly string[]).includes(name)) notFound();

  const crop = await getCropCached(name);
  if (!crop) {
    return (
      <p role="alert" className="text-sm text-destructive">
        Crop data is temporarily unavailable. Make sure the API is running, then try again.
      </p>
    );
  }

  const stats = [
    { label: "Nitrogen (N)", value: crop.N },
    { label: "Phosphorus (P)", value: crop.P },
    { label: "Potassium (K)", value: crop.K },
    { label: "Soil pH", value: crop.ph },
    { label: "Temperature", value: `${crop.temperature} °C` },
    { label: "Humidity", value: `${crop.humidity} %` },
    { label: "Rainfall", value: `${crop.rainfall} mm` },
  ];

  return (
    <>
      <PageHeader
        title={formatCropName(crop.name)}
        description={`Average conditions where ${formatCropName(crop.name).toLowerCase()} grows well.`}
      />
      <div className="flex gap-2">
        <Badge>{seasonLabel(crop.season)}</Badge>
        <Badge variant="outline" className="capitalize">
          {crop.category}
        </Badge>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Ideal growing conditions</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {stats.map((s) => (
              <div key={s.label}>
                <dt className="text-xs text-muted-foreground">{s.label}</dt>
                <dd className="text-xl font-semibold tabular-nums">{s.value}</dd>
              </div>
            ))}
          </dl>
        </CardContent>
      </Card>
      <Link href="/fertilizer" className={buttonVariants({ className: "px-4" })}>
        Plan fertilizer for {formatCropName(crop.name).toLowerCase()}
      </Link>
    </>
  );
}

export default function CropPage(props: PageProps<"/crops/[name]">) {
  return (
    <div className="space-y-6">
      <Link href="/crops" className={buttonVariants({ variant: "ghost", size: "sm" })}>
        <ArrowLeft /> All crops
      </Link>
      <Suspense fallback={<div className="h-48 animate-pulse rounded-xl bg-muted" />}>
        <CropDetails params={props.params} />
      </Suspense>
    </div>
  );
}
