"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";

import { NumberField } from "@/components/number-field";
import { RecommendationResults } from "@/components/recommendation-results";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getErrorMessage } from "@/lib/api/client";
import { recommendCrop } from "@/lib/api/endpoints";
import { SAMPLE_SOILS } from "@/lib/crops";
import { soilSchema, type SoilFormValues } from "@/lib/validation";
import { useHistoryStore } from "@/store/history-store";

const FIELDS: { name: keyof SoilFormValues; label: string; unit?: string; step?: number }[] = [
  { name: "N", label: "Nitrogen", unit: "N" },
  { name: "P", label: "Phosphorus", unit: "P" },
  { name: "K", label: "Potassium", unit: "K" },
  { name: "ph", label: "Soil pH", step: 0.1 },
  { name: "temperature", label: "Temperature", unit: "°C", step: 0.1 },
  { name: "humidity", label: "Humidity", unit: "%", step: 0.1 },
  { name: "rainfall", label: "Rainfall", unit: "mm", step: 0.1 },
];

export function CropRecommendForm() {
  const addToHistory = useHistoryStore((s) => s.add);

  // React Hook Form + Zod: client-side validation before any request is sent.
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<SoilFormValues>({ resolver: zodResolver(soilSchema), mode: "onTouched" });

  // TanStack Query mutation: tracks loading / error / data for the POST.
  const mutation = useMutation({
    mutationFn: recommendCrop,
    onSuccess: (result, soil) => addToHistory(soil, result),
  });

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <Card>
        <CardHeader>
          <CardTitle>Soil &amp; climate readings</CardTitle>
          <CardDescription>
            Use values from your soil health card. Try a sample to see how it works.
          </CardDescription>
          <div className="flex flex-wrap gap-2 pt-2">
            {SAMPLE_SOILS.map((s) => (
              <Button
                key={s.label}
                type="button"
                variant="outline"
                size="sm"
                onClick={() => reset(s.values)}
              >
                {s.label}
              </Button>
            ))}
          </div>
        </CardHeader>
        <CardContent>
          <form
            noValidate
            aria-label="Crop recommendation"
            onSubmit={handleSubmit((values) => mutation.mutate(values))}
            className="grid gap-4"
          >
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              {FIELDS.map((f) => (
                <NumberField
                  key={f.name}
                  id={`soil-${f.name}`}
                  label={f.label}
                  unit={f.unit}
                  step={f.step}
                  registration={register(f.name, { valueAsNumber: true })}
                  error={errors[f.name]}
                />
              ))}
            </div>
            <Button type="submit" size="lg" disabled={mutation.isPending} className="w-full sm:w-fit sm:px-6">
              {mutation.isPending && <Loader2 className="animate-spin" />}
              Recommend crops
            </Button>
          </form>
        </CardContent>
      </Card>

      <div aria-live="polite">
        {mutation.isError && (
          <p role="alert" className="rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
            {getErrorMessage(mutation.error)}
          </p>
        )}
        {mutation.data && <RecommendationResults result={mutation.data} />}
        {mutation.isIdle && (
          <div className="grid h-full min-h-40 place-items-center rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
            Your top three crops will appear here.
          </div>
        )}
      </div>
    </div>
  );
}
