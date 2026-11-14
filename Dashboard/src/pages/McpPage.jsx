import { useMutation } from "@tanstack/react-query";
import { useMemo, useState } from "react";

import { cx } from "@/lib/cx.js";
import { Button, Card, Code, EmptyState, ErrorState, Icon, IconButton, Skeleton, StatusPill, TextField } from "@/components/ui/primitives.jsx";
import { mcpResultValue, mcpRpc } from "@/lib/api.js";
import { fmtDuration, titleCase } from "@/lib/format.js";
import { useMcpHealth, useMcpTools } from "@/lib/queries.js";

// Sensible example arguments so every tool can be run with one click.
const EXAMPLES = {
  recommend_crop: { N: 90, P: 42, K: 43, temperature: 20.8, humidity: 82, ph: 6.5, rainfall: 202 },
  explain_crop: { N: 90, P: 42, K: 43, temperature: 20.8, humidity: 82, ph: 6.5, rainfall: 202, top: 2 },
  predict_yield: { crop: "Rice", season: "Kharif", state: "Punjab", year: 2026, area_ha: 2 },
  fertilizer_plan: { crop: "rice", N: 20, P: 10, K: 40, area_ha: 2 },
  weather_forecast: { latitude: 30.9, longitude: 75.85, days: 5 },
  search_knowledge: { query: "How are sodic soils reclaimed?", k: 3 },
};

const TOOL_ICONS = {
  recommend_crop: "grass", explain_crop: "psychology", predict_yield: "query_stats", fertilizer_plan: "compost",
  weather_forecast: "partly_cloudy_day", search_knowledge: "forum",
};

function fieldType(schema) {
  const t = schema.type ?? schema.anyOf?.find((x) => x.type !== "null")?.type;
  return t === "number" || t === "integer" ? "number" : "text";
}

function ToolRunner({ tool }) {
  const props = useMemo(() => tool.inputSchema?.properties ?? {}, [tool]);
  const required = new Set(tool.inputSchema?.required ?? []);
  const initial = useMemo(() => {
    const ex = EXAMPLES[tool.name] ?? {};
    return Object.fromEntries(Object.keys(props).map((k) => [k, ex[k] ?? props[k].default ?? ""]));
  }, [tool.name, props]);
  const [args, setArgs] = useState(initial);
  const call = useMutation({
    mutationFn: async () => {
      const clean = {};
      for (const [k, v] of Object.entries(args)) {
        if (v === "" || v == null) continue;
        clean[k] = fieldType(props[k]) === "number" ? Number(v) : v;
      }
      const started = performance.now();
      const result = await mcpRpc("tools/call", { name: tool.name, arguments: clean });
      return { result, value: mcpResultValue(result), ms: performance.now() - started };
    },
  });
  const [copied, setCopied] = useState(false);
  const output = call.data ? JSON.stringify(call.data.value, null, 2) : "";

  return (
    <Card title={titleCase(tool.name)} subtitle={tool.description} icon={TOOL_ICONS[tool.name] ?? "build"}>
      <form className="flex flex-col gap-4" onSubmit={(e) => { e.preventDefault(); call.mutate(); }}>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {Object.entries(props).map(([key, schema]) => (
            <TextField key={key} id={`${tool.name}-${key}`} label={`${schema.title ?? key}${required.has(key) ? " *" : ""}`}
              type={fieldType(schema)} step="any" value={args[key]} required={required.has(key)}
              onChange={(e) => setArgs((a) => ({ ...a, [key]: e.target.value }))} className={fieldType(schema) === "text" ? "col-span-2" : ""} />
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit" icon="play_arrow" loading={call.isPending}>Call tool</Button>
          <Button variant="text" icon="refresh" onClick={() => { setArgs(initial); call.reset(); }}>Reset</Button>
          {call.data && <span className="text-xs text-ink-3">Answered in {Math.round(call.data.ms)} ms{call.data.result?.isError ? " · tool reported an error" : ""}</span>}
        </div>
      </form>
      {call.error && <div className="mt-4"><ErrorState error={call.error} compact /></div>}
      {call.data && (
        <div className="relative mt-4">
          <IconButton icon={copied ? "check_circle" : "content_copy"} label="Copy result" className="absolute top-1 right-1"
            onClick={() => navigator.clipboard?.writeText(output).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500); })} />
          <pre className={cx("max-h-96 overflow-auto rounded-2xl bg-surface-2 p-4 pr-12 font-mono text-[12.5px] leading-relaxed text-ink",
            call.data.result?.isError && "outline outline-bad")}>{output}</pre>
        </div>
      )}
    </Card>
  );
}

export default function McpPage() {
  const tools = useMcpTools();
  const health = useMcpHealth();
  const [active, setActive] = useState(null);
  const list = tools.data?.tools ?? [];
  const current = list.find((t) => t.name === active) ?? list[0];
  const origin = typeof window !== "undefined" ? window.location.origin : "http://localhost:8090";

  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-[22rem_1fr]">
      <div className="flex flex-col gap-4">
        <Card title="AgriSmart MCP server" subtitle="Model Context Protocol · stateless streamable HTTP" icon="hub"
          actions={<StatusPill status={health.isLoading ? "unknown" : health.data?.status === "ok" ? "ok" : "down"} />}>
          <dl className="flex flex-col gap-2 text-[13px]">
            <div className="flex justify-between gap-2"><dt className="text-ink-2">Endpoint</dt><dd><Code>/mcp</Code></dd></div>
            <div className="flex justify-between gap-2"><dt className="text-ink-2">Tools</dt><dd className="font-medium text-ink">{list.length || "—"}</dd></div>
            <div className="flex justify-between gap-2"><dt className="text-ink-2">Uptime</dt><dd className="text-ink">{fmtDuration(health.data?.uptime_s)}</dd></div>
            <div className="flex justify-between gap-2"><dt className="text-ink-2">Scaling</dt><dd className="text-right text-ink">No sessions · any replica</dd></div>
          </dl>
          <p className="mt-4 mb-1.5 text-xs font-medium text-ink-2">Connect Claude Code</p>
          <pre className="overflow-x-auto rounded-xl bg-surface-2 p-3 font-mono text-[11.5px] text-ink">claude mcp add --transport http agrismart {origin}/mcp</pre>
        </Card>
        <Card title="Tools" icon="build" bodyClassName="p-2">
          {tools.isLoading ? <div className="flex flex-col gap-2 p-3">{[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-12" />)}</div>
            : tools.error ? <ErrorState error={tools.error} onRetry={tools.refetch} compact /> : (
              <ul className="flex flex-col gap-0.5">
                {list.map((t) => (
                  <li key={t.name}>
                    <button type="button" onClick={() => setActive(t.name)}
                      className={cx("flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left transition",
                        current?.name === t.name ? "bg-primary-soft text-on-primary-soft" : "text-ink hover:bg-surface-2")}>
                      <Icon name={TOOL_ICONS[t.name] ?? "build"} size={20} />
                      <span className="min-w-0">
                        <span className="block font-mono text-[13px]">{t.name}</span>
                        <span className="block truncate text-xs opacity-75">{t.description}</span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
        </Card>
      </div>
      {current ? <ToolRunner key={current.name} tool={current} /> : !tools.isLoading && (
        <Card><EmptyState icon="terminal" title="MCP server not reachable">
          Start it with <Code>python -m AIML.agentic_ai.mcp_server --transport http --port 8100</Code>.
        </EmptyState></Card>
      )}
    </div>
  );
}
