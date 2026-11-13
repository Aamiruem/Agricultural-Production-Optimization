"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import MenuItem from "@mui/material/MenuItem";
import Slider from "@mui/material/Slider";
import TextField from "@mui/material/TextField";
import { useMutation, useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { Controller, useForm } from "react-hook-form";

import { NumberField } from "@/components/number-field";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getErrorMessage } from "@/lib/api/client";
import { fetchCrops, recommendFertilizer } from "@/lib/api/endpoints";
import type { FertilizerRecommendation, NutrientGap } from "@/lib/api/types";
import { formatCropName } from "@/lib/crops";
import { fertilizerSchema, type FertilizerFormValues } from "@/lib/validation";

const NUTRIENT_NAMES = { N: "Nitrogen", P: "Phosphorus", K: "Potassium" } as const;
const STATUS_STYLE: Record<NutrientGap["status"], string> = {
  low: "bg-destructive/10 text-destructive",
  ok: "bg-primary/10 text-primary",
  high: "bg-accent text-accent-foreground",
};

export function FertilizerForm() {
  // TanStack Query: crop list is fetched once and cached for 5 minutes.
  const crops = useQuery({ queryKey: ["crops"], queryFn: fetchCrops });
  const mutation = useMutation({ mutationFn: recommendFertilizer });

  const {
    control,
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FertilizerFormValues>({
    resolver: zodResolver(fertilizerSchema),
    defaultValues: { crop: "", area_ha: 1 },
    mode: "onTouched",
  });

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Field details</CardTitle>
          <CardDescription>Pick a crop and enter the soil N-P-K from your soil test.</CardDescription>
        </CardHeader>
        <CardContent>
          <form
            noValidate
            aria-label="Fertilizer calculator"
            onSubmit={handleSubmit((v) => mutation.mutate(v))}
            className="grid gap-5"
          >
            {/* Material UI select controlled by React Hook Form */}
            <Controller
              name="crop"
              control={control}
              render={({ field, fieldState }) => (
                <TextField
                  {...field}
                  select
                  label="Crop"
                  size="small"
                  error={!!fieldState.error}
                  helperText={
                    fieldState.error?.message ??
                    (crops.isError ? getErrorMessage(crops.error) : undefined)
                  }
                  disabled={crops.isLoading || crops.isError}
                >
                  {(crops.data ?? []).map((c) => (
                    <MenuItem key={c.name} value={c.name}>
                      {formatCropName(c.name)}
                    </MenuItem>
                  ))}
                </TextField>
              )}
            />

            <div className="grid grid-cols-3 gap-3">
              {(["N", "P", "K"] as const).map((n) => (
                <NumberField
                  key={n}
                  id={`fert-${n}`}
                  label={NUTRIENT_NAMES[n]}
                  unit="kg/ha"
                  registration={register(n, { valueAsNumber: true })}
                  error={errors[n]}
                />
              ))}
            </div>

            <Controller
              name="area_ha"
              control={control}
              render={({ field }) => (
                <div>
                  <p id="area-label" className="text-sm font-medium">
                    Field area: <span className="tabular-nums">{field.value} ha</span>
                  </p>
                  <Slider
                    value={field.value}
                    onChange={(_, v) => field.onChange(v as number)}
                    onBlur={field.onBlur}
                    min={0.5}
                    max={50}
                    step={0.5}
                    valueLabelDisplay="auto"
                    slotProps={{ input: { "aria-labelledby": "area-label" } }}
                  />
                </div>
              )}
            />

            <Button type="submit" size="lg" disabled={mutation.isPending} className="w-full sm:w-fit sm:px-6">
              {mutation.isPending && <Loader2 className="animate-spin" />}
              Calculate doses
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
        {mutation.data && <FertilizerResult result={mutation.data} />}
        {mutation.isIdle && (
          <div className="grid h-full min-h-40 place-items-center rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
            Nutrient gaps and fertilizer doses will appear here.
          </div>
        )}
      </div>
    </div>
  );
}

function FertilizerResult({ result }: { result: FertilizerRecommendation }) {
  return (
    <motion.section
      key={`${result.crop}-${result.area_ha}-${result.gaps.map((g) => g.current).join()}`}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      aria-label="Fertilizer recommendation"
      className="space-y-4"
    >
      <h2 className="text-lg font-semibold">
        {formatCropName(result.crop)} · {result.area_ha} ha
      </h2>

      <div className="grid grid-cols-3 gap-3">
        {result.gaps.map((g) => (
          <div key={g.nutrient} className="rounded-xl border bg-card p-3">
            <p className="text-xs text-muted-foreground">{NUTRIENT_NAMES[g.nutrient]}</p>
            <p className="text-lg font-semibold tabular-nums">
              {g.current}
              <span className="text-sm font-normal text-muted-foreground"> / {g.target}</span>
            </p>
            <Badge className={STATUS_STYLE[g.status]}>{g.status}</Badge>
          </div>
        ))}
      </div>

      {result.doses.length > 0 && (
        <div className="overflow-x-auto rounded-xl border">
          <table className="w-full text-sm">
            <thead className="bg-muted/60 text-left">
              <tr>
                <th className="px-3 py-2 font-medium">Fertilizer</th>
                <th className="px-3 py-2 text-right font-medium">kg / ha</th>
                <th className="px-3 py-2 text-right font-medium">Total kg</th>
              </tr>
            </thead>
            <tbody>
              {result.doses.map((d) => (
                <tr key={d.product} className="border-t">
                  <td className="px-3 py-2">{d.product}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{d.kg_per_ha}</td>
                  <td className="px-3 py-2 text-right font-medium tabular-nums">{d.total_kg}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
        {result.advice.map((a) => (
          <li key={a}>{a}</li>
        ))}
      </ul>
    </motion.section>
  );
}
