"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import MenuItem from "@mui/material/MenuItem";
import TextField from "@mui/material/TextField";
import { AnimatePresence, motion } from "framer-motion";
import { Plus, Trash2 } from "lucide-react";
import { Controller, useForm } from "react-hook-form";

import { NumberField } from "@/components/number-field";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CROP_NAMES, formatCropName, SEASONS, seasonLabel } from "@/lib/crops";
import { fieldSchema, type FieldFormValues } from "@/lib/validation";
import {
  fieldAdded,
  fieldRemoved,
  fieldsCleared,
  selectAreaBySeason,
  selectFields,
  selectStatusCounts,
  selectTotalArea,
  statusAdvanced,
  type FieldStatus,
} from "@/store/fields-slice";
import { useAppDispatch, useAppSelector } from "@/store/hooks";

const STATUS_STYLE: Record<FieldStatus, string> = {
  planned: "bg-secondary text-secondary-foreground",
  sown: "bg-primary/15 text-primary",
  harvested: "bg-accent text-accent-foreground",
};

export function FarmPlanner() {
  return (
    <div className="grid gap-6 lg:grid-cols-[22rem_minmax(0,1fr)]">
      <AddFieldForm />
      <div className="space-y-6">
        <PlannerSummary />
        <FieldList />
      </div>
    </div>
  );
}

function AddFieldForm() {
  const dispatch = useAppDispatch();
  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FieldFormValues>({
    resolver: zodResolver(fieldSchema),
    defaultValues: { name: "", crop: "", season: "kharif" },
  });

  const onSubmit = (values: FieldFormValues) => {
    dispatch(fieldAdded(values));
    reset({ name: "", crop: "", season: values.season });
  };

  return (
    <Card className="h-fit">
      <CardHeader>
        <CardTitle>Add a field</CardTitle>
        <CardDescription>Fields are saved in this browser.</CardDescription>
      </CardHeader>
      <CardContent>
        <form noValidate aria-label="Add field" onSubmit={handleSubmit(onSubmit)} className="grid gap-4">
          <div className="grid gap-1.5">
            <Label htmlFor="field-name">Field name</Label>
            <Input
              id="field-name"
              placeholder="e.g. North plot"
              aria-invalid={errors.name ? true : undefined}
              {...register("name")}
            />
            {errors.name && (
              <p role="alert" className="text-xs text-destructive">
                {errors.name.message}
              </p>
            )}
          </div>

          <Controller
            name="crop"
            control={control}
            render={({ field, fieldState }) => (
              <TextField
                {...field}
                select
                size="small"
                label="Crop"
                error={!!fieldState.error}
                helperText={fieldState.error?.message}
              >
                {CROP_NAMES.map((c) => (
                  <MenuItem key={c} value={c}>
                    {formatCropName(c)}
                  </MenuItem>
                ))}
              </TextField>
            )}
          />

          <Controller
            name="season"
            control={control}
            render={({ field, fieldState }) => (
              <TextField
                {...field}
                select
                size="small"
                label="Season"
                error={!!fieldState.error}
                helperText={fieldState.error?.message}
              >
                {SEASONS.map((s) => (
                  <MenuItem key={s.value} value={s.value}>
                    {s.label}
                  </MenuItem>
                ))}
              </TextField>
            )}
          />

          <NumberField
            id="field-area"
            label="Area"
            unit="ha"
            step={0.1}
            registration={register("areaHa", { valueAsNumber: true })}
            error={errors.areaHa}
          />

          <Button type="submit" className="w-full">
            <Plus /> Add field
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function PlannerSummary() {
  const total = useAppSelector(selectTotalArea);
  const bySeason = useAppSelector(selectAreaBySeason);
  const counts = useAppSelector(selectStatusCounts);

  const tiles = [
    { label: "Total area", value: `${total.toFixed(1)} ha` },
    ...SEASONS.map((s) => ({ label: s.label, value: `${(bySeason[s.value] ?? 0).toFixed(1)} ha` })),
  ];

  return (
    <section aria-label="Planner summary" className="space-y-3">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {tiles.map((t) => (
          <div key={t.label} className="rounded-xl border bg-card p-3">
            <p className="text-xs text-muted-foreground">{t.label}</p>
            <p className="text-lg font-semibold tabular-nums">{t.value}</p>
          </div>
        ))}
      </div>
      <p className="text-sm text-muted-foreground">
        {counts.planned} planned · {counts.sown} sown · {counts.harvested} harvested
      </p>
    </section>
  );
}

function FieldList() {
  const fields = useAppSelector(selectFields);
  const dispatch = useAppDispatch();

  if (fields.length === 0) {
    return (
      <div className="grid min-h-40 place-items-center rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
        No fields yet. Add your first field to start planning.
      </div>
    );
  }

  return (
    <section aria-labelledby="fields-title" className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 id="fields-title" className="text-lg font-semibold">
          Your fields ({fields.length})
        </h2>
        <Button variant="ghost" size="sm" onClick={() => dispatch(fieldsCleared())}>
          Remove all
        </Button>
      </div>
      <ul className="space-y-2">
        <AnimatePresence initial={false}>
          {fields.map((f) => (
            <motion.li
              key={f.id}
              layout
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex flex-wrap items-center gap-3 rounded-xl border bg-card p-3"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{f.name}</p>
                <p className="text-sm text-muted-foreground">
                  {formatCropName(f.crop)} · {f.areaHa} ha · {seasonLabel(f.season)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => dispatch(statusAdvanced(f.id))}
                title="Click to advance status"
                aria-label={`Status: ${f.status}. Advance status of ${f.name}`}
              >
                <Badge className={`capitalize ${STATUS_STYLE[f.status]}`}>{f.status}</Badge>
              </button>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => dispatch(fieldRemoved(f.id))}
                aria-label={`Remove ${f.name}`}
              >
                <Trash2 />
              </Button>
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>
    </section>
  );
}
