import { useState } from "react";
import { Link } from "react-router";

import { BarList, DataTable } from "@/components/charts/Charts.jsx";
import { cx } from "@/lib/cx.js";
import { Button, Card, EmptyState, ErrorState, Icon, Skeleton, TextField } from "@/components/ui/primitives.jsx";
import { useAuth } from "@/context/auth.js";
import { fmtNumber, titleCase } from "@/lib/format.js";
import { useCreateFarm, useDeleteFarm, useFarms, useFarmSummary } from "@/lib/queries.js";

function NewFarm({ onCreated }) {
  const create = useCreateFarm();
  const [form, setForm] = useState({ name: "", state: "", district: "" });
  const submit = (e) => {
    e.preventDefault();
    const location = Object.fromEntries(Object.entries({ state: form.state, district: form.district }).filter(([, v]) => v.trim()));
    create.mutate({ name: form.name.trim(), ...(Object.keys(location).length ? { location } : {}) }, {
      onSuccess: (farm) => {
        setForm({ name: "", state: "", district: "" });
        onCreated?.(farm._id);
      },
    });
  };
  return (
    <Card title="Add a farm" icon="add">
      <form onSubmit={submit} className="flex flex-col gap-3">
        <TextField label="Farm name" required minLength={2} maxLength={80} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <div className="grid grid-cols-2 gap-3">
          <TextField label="State" maxLength={60} value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} />
          <TextField label="District" maxLength={60} value={form.district} onChange={(e) => setForm({ ...form, district: e.target.value })} />
        </div>
        {create.error && <p className="text-[13px] text-bad">{create.error.message}</p>}
        <Button type="submit" icon="add" loading={create.isPending}>Create farm</Button>
      </form>
    </Card>
  );
}

function Summary({ id, onDeleted }) {
  const q = useFarmSummary(id);
  const del = useDeleteFarm();
  const [confirming, setConfirming] = useState(false);
  if (q.isLoading) return <Skeleton className="h-96" />;
  if (q.error) return <Card><ErrorState error={q.error} onRetry={q.refetch} /></Card>;
  const { farm, totals, byCrop, byStatus, recentActivities } = q.data;
  const place = [farm.location?.village, farm.location?.district, farm.location?.state].filter(Boolean).join(", ");
  return (
    <div className="flex flex-col gap-4">
      <Card title={farm.name} subtitle={place || "No location set"} icon="landscape"
        actions={confirming ? (
          <>
            <span className="text-[13px] text-ink-2">Delete this farm and its fields?</span>
            <Button variant="danger" size="sm" icon="delete" loading={del.isPending}
              onClick={() => del.mutate(id, { onSuccess: () => { setConfirming(false); onDeleted(); } })}>Delete</Button>
            <Button variant="text" size="sm" onClick={() => setConfirming(false)}>Cancel</Button>
          </>
        ) : <Button variant="text" size="sm" icon="delete" onClick={() => setConfirming(true)}>Delete</Button>}>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {[["Fields", fmtNumber(totals.fields)], ["Area", `${fmtNumber(totals.areaHa, { decimals: 1 })} ha`],
            ["Growing", fmtNumber(byStatus.growing ?? 0)], ["Harvested", fmtNumber(byStatus.harvested ?? 0)]].map(([k, v]) => (
            <div key={k} className="rounded-2xl bg-surface-2 p-3">
              <p className="text-xs text-ink-2">{k}</p>
              <p className="text-xl font-medium tabular-nums text-ink">{v}</p>
            </div>
          ))}
        </div>
      </Card>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card title="Area by crop" subtitle="Hectares under each crop" icon="grass">
          {byCrop.length ? (
            <BarList format={(v) => `${v.toFixed(1)} ha`} items={byCrop.map((c) => ({ label: titleCase(c.crop ?? "Unplanted"), value: c.areaHa,
              detail: [{ label: "Fields", value: c.fields }] }))} />
          ) : <EmptyState icon="grass" title="No fields yet">Add fields in the AgriSmart web app to see crop allocation here.</EmptyState>}
        </Card>
        <Card title="Recent activity" subtitle="Last 10 operations across fields" icon="schedule">
          {recentActivities.length ? (
            <DataTable rows={recentActivities} columns={[
              { key: "date", label: "Date", format: (v) => new Date(v).toLocaleDateString("en-IN") },
              { key: "fieldName", label: "Field" },
              { key: "type", label: "Activity", format: (v) => titleCase(v) },
              { key: "quantity", label: "Qty", align: "right", format: (v, r) => (v != null ? `${v} ${r.unit ?? ""}` : "—") },
            ]} />
          ) : <EmptyState icon="schedule" title="No activity logged" />}
        </Card>
      </div>
    </div>
  );
}

export default function FarmsPage() {
  const { user, loading } = useAuth();
  const farms = useFarms(Boolean(user));
  const [selected, setSelected] = useState(null);

  if (loading) return <Skeleton className="h-96" />;
  if (!user) {
    return (
      <Card>
        <EmptyState icon="key" title="Sign in to see your farms"
          action={<Link to="/login?next=/farms"><Button icon="login">Sign in</Button></Link>}>
          Farms are stored by the Express farm-service (MongoDB) and secured with the same JWT the AI API issues.
        </EmptyState>
      </Card>
    );
  }
  const list = farms.data ?? [];
  const activeId = selected ?? list[0]?._id;

  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-[20rem_1fr]">
      <div className="flex flex-col gap-4">
        <Card title="Your farms" icon="agriculture" bodyClassName="p-2">
          {farms.isLoading ? <div className="flex flex-col gap-2 p-3">{[1, 2].map((i) => <Skeleton key={i} className="h-14" />)}</div>
            : farms.error ? <ErrorState error={farms.error} onRetry={farms.refetch} compact />
              : list.length === 0 ? <p className="p-4 text-[13px] text-ink-2">No farms yet — add your first one below.</p> : (
                <ul className="flex flex-col gap-0.5">
                  {list.map((f) => (
                    <li key={f._id}>
                      <button type="button" onClick={() => setSelected(f._id)}
                        className={cx("flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left transition",
                          activeId === f._id ? "bg-primary-soft text-on-primary-soft" : "text-ink hover:bg-surface-2")}>
                        <Icon name="landscape" size={20} />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-medium">{f.name}</span>
                          <span className="block truncate text-xs opacity-75">{f.fields} fields · {fmtNumber(f.areaHa, { decimals: 1 })} ha{f.location?.state ? ` · ${f.location.state}` : ""}</span>
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
        </Card>
        <NewFarm onCreated={setSelected} />
      </div>
      {activeId ? <Summary key={activeId} id={activeId} onDeleted={() => setSelected(null)} />
        : !farms.isLoading && !farms.error && <Card><EmptyState icon="agriculture" title="Create a farm to get started" /></Card>}
    </div>
  );
}
