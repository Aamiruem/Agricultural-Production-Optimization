"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import MenuItem from "@mui/material/MenuItem";
import TextField from "@mui/material/TextField";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Calculator, Camera, NotebookPen, Plus, Trash2 } from "lucide-react";
import { useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";

import { NumberField } from "@/components/number-field";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getErrorMessage } from "@/lib/api/client";
import {
  createField,
  deleteField,
  fetchFarmSummary,
  fetchFields,
  fieldFertilizerPlan,
  logActivity,
  uploadFieldPhoto,
} from "@/lib/api/endpoints";
import type { ActivityType, FarmField, FertilizerRecommendation } from "@/lib/api/types";
import { CROP_NAMES, formatCropName, SEASONS, seasonLabel } from "@/lib/crops";
import { newFieldSchema, type NewFieldValues } from "@/lib/validation";

const ACTIVITY_TYPES: ActivityType[] = ["sowing", "irrigation", "fertilizer", "pesticide", "harvest", "note"];

export function FarmDetail({ farmId }: { farmId: string }) {
  const summary = useQuery({ queryKey: ["farm", farmId, "summary"], queryFn: () => fetchFarmSummary(farmId) });
  const fields = useQuery({ queryKey: ["farm", farmId, "fields"], queryFn: () => fetchFields(farmId) });
  const [plan, setPlan] = useState<{ field: FarmField; result: FertilizerRecommendation } | null>(null);

  const s = summary.data;
  return (
    <section aria-label="Farm details" className="min-w-0 space-y-6">
      <header className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-xl font-semibold">{s?.farm.name ?? "…"}</h2>
        {s && (
          <p className="text-sm text-muted-foreground">
            {s.totals.fields} fields · {s.totals.areaHa.toFixed(1)} ha ·{" "}
            {Object.entries(s.byStatus).map(([k, v]) => `${v} ${k}`).join(" · ") || "no fields yet"}
          </p>
        )}
      </header>

      {s && s.byCrop.length > 0 && (
        <div className="flex flex-wrap gap-2" aria-label="Area by crop">
          {s.byCrop.map((c) => (
            <Badge key={c.crop} variant="secondary">
              {formatCropName(c.crop)} · {c.areaHa.toFixed(1)} ha
            </Badge>
          ))}
        </div>
      )}

      {fields.isError && <p role="alert" className="text-sm text-destructive">{getErrorMessage(fields.error)}</p>}

      <div className="space-y-2">
        {fields.data?.map((field) => (
          <FieldRow key={field._id} field={field} onPlan={(result) => setPlan({ field, result })} />
        ))}
        {fields.data?.length === 0 && (
          <p className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
            No fields yet. Add one below.
          </p>
        )}
      </div>

      <NewFieldForm farmId={farmId} />

      {s && s.recentActivities.length > 0 && (
        <section aria-labelledby="activity-title" className="space-y-2">
          <h3 id="activity-title" className="font-medium">Recent activity</h3>
          <ul className="divide-y rounded-xl border text-sm">
            {s.recentActivities.map((a) => (
              <li key={a._id} className="flex flex-wrap gap-x-3 px-3 py-2">
                <span className="font-medium capitalize">{a.type}</span>
                <span className="text-muted-foreground">{a.fieldName}</span>
                {a.notes && <span className="min-w-0 flex-1 truncate">{a.notes}</span>}
                <time className="ml-auto text-muted-foreground" dateTime={a.date}>
                  {new Date(a.date).toLocaleDateString()}
                </time>
              </li>
            ))}
          </ul>
        </section>
      )}

      <Dialog open={!!plan} onClose={() => setPlan(null)} fullWidth maxWidth="xs">
        <DialogTitle>Fertilizer plan · {plan?.field.name}</DialogTitle>
        <DialogContent>
          {plan && (
            <div className="space-y-3 text-sm">
              <p className="text-muted-foreground">
                {formatCropName(plan.result.crop)} on {plan.result.area_ha} ha (calculated by the Python ML service)
              </p>
              {plan.result.doses.length === 0 ? (
                <p>No fertilizer needed for N, P and K.</p>
              ) : (
                <ul className="space-y-1">
                  {plan.result.doses.map((d) => (
                    <li key={d.product} className="flex justify-between gap-4">
                      <span>{d.product}</span>
                      <span className="font-medium tabular-nums">{d.total_kg} kg</span>
                    </li>
                  ))}
                </ul>
              )}
              <ul className="list-disc pl-5 text-muted-foreground">
                {plan.result.advice.map((a) => <li key={a}>{a}</li>)}
              </ul>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
}

function FieldRow({ field, onPlan }: { field: FarmField; onPlan: (r: FertilizerRecommendation) => void }) {
  const queryClient = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [activity, setActivity] = useState<ActivityType>("irrigation");
  const [notes, setNotes] = useState("");
  const refresh = () => queryClient.invalidateQueries({ queryKey: ["farm", field.farmId] });

  const plan = useMutation({ mutationFn: () => fieldFertilizerPlan(field._id), onSuccess: onPlan });
  const log = useMutation({
    mutationFn: () => logActivity(field._id, { type: activity, notes: notes || undefined }),
    onSuccess: () => {
      setNotes("");
      void refresh();
    },
  });
  const remove = useMutation({ mutationFn: () => deleteField(field._id), onSuccess: () => refresh() });
  const photo = useMutation({ mutationFn: (file: File) => uploadFieldPhoto(field._id, file), onSuccess: () => refresh() });
  const error = [plan, log, remove, photo].find((m) => m.isError)?.error;

  return (
    <article className="rounded-xl border bg-card p-3" aria-label={field.name}>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <div className="min-w-0 flex-1">
          <p className="font-medium">{field.name}</p>
          <p className="text-sm text-muted-foreground">
            {formatCropName(field.crop)} · {field.areaHa} ha · {seasonLabel(field.season)}
            {field.soil?.N !== undefined && ` · N-P-K ${field.soil.N}-${field.soil.P ?? "?"}-${field.soil.K ?? "?"}`}
          </p>
        </div>
        <Badge variant="outline" className="capitalize">{field.status}</Badge>
        <Button variant="outline" size="sm" onClick={() => plan.mutate()} disabled={plan.isPending}>
          <Calculator /> Fertilizer plan
        </Button>
        <Button variant="ghost" size="icon-sm" aria-label={`Upload photo of ${field.name}`} onClick={() => fileRef.current?.click()}>
          <Camera />
        </Button>
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) photo.mutate(file);
            e.target.value = "";
          }}
        />
        <Button variant="ghost" size="icon-sm" aria-label={`Delete ${field.name}`} onClick={() => remove.mutate()}>
          <Trash2 />
        </Button>
      </div>

      <form
        className="mt-2 flex flex-wrap items-center gap-2"
        aria-label={`Log activity for ${field.name}`}
        onSubmit={(e) => {
          e.preventDefault();
          log.mutate();
        }}
      >
        <select
          aria-label="Activity type"
          value={activity}
          onChange={(e) => setActivity(e.target.value as ActivityType)}
          className="h-8 rounded-lg border bg-background px-2 text-sm capitalize"
        >
          {ACTIVITY_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
        <Input
          aria-label="Notes"
          placeholder="Notes (optional)"
          value={notes}
          maxLength={500}
          onChange={(e) => setNotes(e.target.value)}
          className="h-8 min-w-40 flex-1"
        />
        <Button type="submit" size="sm" variant="secondary" disabled={log.isPending}>
          <NotebookPen /> Log
        </Button>
      </form>

      {field.photos.length > 0 && (
        <div className="mt-2 flex gap-2 overflow-x-auto">
          {field.photos.map((p) => (
            // eslint-disable-next-line @next/next/no-img-element -- user uploads on S3/CloudFront
            <img key={p.key} src={p.url} alt={`${field.name} photo`} className="size-16 rounded-md object-cover" />
          ))}
        </div>
      )}
      {error && <p role="alert" className="mt-2 text-xs text-destructive">{getErrorMessage(error)}</p>}
    </article>
  );
}

function NewFieldForm({ farmId }: { farmId: string }) {
  const queryClient = useQueryClient();
  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<NewFieldValues>({
    resolver: zodResolver(newFieldSchema),
    defaultValues: { name: "", crop: "", season: "kharif" },
  });

  const mutation = useMutation({
    mutationFn: ({ N, P, K, ...v }: NewFieldValues) => {
      const soil = Object.fromEntries(
        Object.entries({ N, P, K }).filter(([, x]) => typeof x === "number" && !Number.isNaN(x)),
      );
      return createField(farmId, { ...v, soil: Object.keys(soil).length ? soil : undefined });
    },
    onSuccess: () => {
      reset({ name: "", crop: "", season: "kharif" });
      void queryClient.invalidateQueries({ queryKey: ["farm", farmId] });
      void queryClient.invalidateQueries({ queryKey: ["farms"] });
    },
  });

  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle>Add a field</CardTitle>
      </CardHeader>
      <CardContent>
        <form noValidate aria-label="Add field" onSubmit={handleSubmit((v) => mutation.mutate(v))} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="grid gap-1.5">
            <Label htmlFor="nf-name">Field name</Label>
            <Input id="nf-name" aria-invalid={errors.name ? true : undefined} {...register("name")} />
            {errors.name && <p role="alert" className="text-xs text-destructive">{errors.name.message}</p>}
          </div>
          <Controller
            name="crop"
            control={control}
            render={({ field, fieldState }) => (
              <TextField {...field} select size="small" label="Crop" error={!!fieldState.error} helperText={fieldState.error?.message}>
                {CROP_NAMES.map((c) => <MenuItem key={c} value={c}>{formatCropName(c)}</MenuItem>)}
              </TextField>
            )}
          />
          <Controller
            name="season"
            control={control}
            render={({ field }) => (
              <TextField {...field} select size="small" label="Season">
                {SEASONS.map((s) => <MenuItem key={s.value} value={s.value}>{s.label}</MenuItem>)}
              </TextField>
            )}
          />
          <NumberField id="nf-area" label="Area" unit="ha" step={0.1} registration={register("areaHa", { valueAsNumber: true })} error={errors.areaHa} />
          {(["N", "P", "K"] as const).map((n) => (
            <NumberField key={n} id={`nf-${n}`} label={`Soil ${n}`} unit="optional" registration={register(n, { valueAsNumber: true })} error={errors[n]} />
          ))}
          <div className="flex items-end">
            <Button type="submit" className="w-full" disabled={mutation.isPending}>
              <Plus /> Add field
            </Button>
          </div>
          {mutation.isError && (
            <p role="alert" className="text-xs text-destructive sm:col-span-2 lg:col-span-4">{getErrorMessage(mutation.error)}</p>
          )}
        </form>
      </CardContent>
    </Card>
  );
}
