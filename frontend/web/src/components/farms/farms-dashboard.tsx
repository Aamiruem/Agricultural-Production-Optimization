"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { FarmDetail } from "@/components/farms/farm-detail";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useFarmSocket } from "@/hooks/use-farm-socket";
import { getErrorMessage } from "@/lib/api/client";
import { createFarm, deleteFarm, fetchFarms } from "@/lib/api/endpoints";
import { newFarmSchema, type NewFarmValues } from "@/lib/validation";
import { cn } from "@/lib/utils";
import { useSession } from "@/store/auth-store";

export function FarmsDashboard() {
  const { token } = useSession();
  const queryClient = useQueryClient();
  const { connected, live } = useFarmSocket(token);
  const farms = useQuery({ queryKey: ["farms"], queryFn: fetchFarms, staleTime: 30_000 });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = farms.data?.find((f) => f._id === selectedId) ?? farms.data?.[0];

  const remove = useMutation({
    mutationFn: deleteFarm,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["farms"] }),
  });

  return (
    <div className="grid gap-6 lg:grid-cols-[18rem_minmax(0,1fr)]">
      <aside className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Your farms</h2>
          <Badge variant={connected ? "secondary" : "outline"} title="Real-time updates (Socket.IO)">
            <span className={cn("size-1.5 rounded-full", connected ? "bg-primary" : "bg-muted-foreground")} aria-hidden />
            {connected ? "Live" : "Offline"}
          </Badge>
        </div>

        {farms.isError && (
          <p role="alert" className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
            {getErrorMessage(farms.error)}
          </p>
        )}
        {farms.isLoading && <div className="h-24 animate-pulse rounded-xl bg-muted" />}

        <ul className="space-y-2">
          {farms.data?.map((farm) => (
            <li key={farm._id}>
              <div
                className={cn(
                  "flex items-center gap-2 rounded-xl border bg-card p-3 transition-colors",
                  selected?._id === farm._id && "border-primary ring-1 ring-primary/30",
                )}
              >
                <button type="button" className="min-w-0 flex-1 text-left" onClick={() => setSelectedId(farm._id)}>
                  <p className="truncate font-medium">{farm.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {[farm.location?.district, farm.location?.state].filter(Boolean).join(", ") || "No location"} ·{" "}
                    {farm.fields ?? 0} fields · {(farm.areaHa ?? 0).toFixed(1)} ha
                  </p>
                </button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`Delete ${farm.name}`}
                  onClick={() => remove.mutate(farm._id)}
                  disabled={remove.isPending}
                >
                  <Trash2 />
                </Button>
              </div>
            </li>
          ))}
        </ul>
        {farms.data?.length === 0 && <p className="text-sm text-muted-foreground">No farms yet — add your first one.</p>}

        <NewFarmForm onCreated={(id) => setSelectedId(id)} />

        {live.length > 0 && (
          <section aria-label="Live activity" className="space-y-2">
            <h3 className="text-sm font-medium">Live activity</h3>
            <ul className="space-y-1 text-xs text-muted-foreground">
              {live.map((a) => (
                <li key={a._id}>
                  <span className="font-medium text-foreground capitalize">{a.type}</span> · {a.fieldName} ·{" "}
                  {new Date(a.date).toLocaleTimeString()}
                </li>
              ))}
            </ul>
          </section>
        )}
      </aside>

      {selected ? (
        <FarmDetail farmId={selected._id} />
      ) : (
        !farms.isLoading && (
          <div className="grid min-h-60 place-items-center rounded-xl border border-dashed text-sm text-muted-foreground">
            Create a farm to start adding fields.
          </div>
        )
      )}
    </div>
  );
}

function NewFarmForm({ onCreated }: { onCreated: (id: string) => void }) {
  const queryClient = useQueryClient();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<NewFarmValues>({ resolver: zodResolver(newFarmSchema) });

  const mutation = useMutation({
    mutationFn: (v: NewFarmValues) =>
      createFarm({ name: v.name, location: { state: v.state || undefined, district: v.district || undefined } }),
    onSuccess: (farm) => {
      reset();
      void queryClient.invalidateQueries({ queryKey: ["farms"] });
      onCreated(farm._id);
    },
  });

  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle>New farm</CardTitle>
      </CardHeader>
      <CardContent>
        <form noValidate aria-label="New farm" onSubmit={handleSubmit((v) => mutation.mutate(v))} className="grid gap-3">
          <div className="grid gap-1.5">
            <Label htmlFor="farm-name">Name</Label>
            <Input id="farm-name" placeholder="e.g. Green Acres" aria-invalid={errors.name ? true : undefined} {...register("name")} />
            {errors.name && <p role="alert" className="text-xs text-destructive">{errors.name.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="grid gap-1.5">
              <Label htmlFor="farm-district">District</Label>
              <Input id="farm-district" {...register("district")} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="farm-state">State</Label>
              <Input id="farm-state" {...register("state")} />
            </div>
          </div>
          {mutation.isError && <p role="alert" className="text-xs text-destructive">{getErrorMessage(mutation.error)}</p>}
          <Button type="submit" disabled={mutation.isPending}>
            <Plus /> Add farm
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
