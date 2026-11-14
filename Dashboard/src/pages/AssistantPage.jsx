import { useEffect, useRef, useState } from "react";

import { cx } from "@/lib/cx.js";
import { Button, Card, Chip, Icon, StatusPill } from "@/components/ui/primitives.jsx";
import { streamSse } from "@/lib/api.js";
import { titleCase } from "@/lib/format.js";
import { useAssistantStatus } from "@/lib/queries.js";

const SUGGESTIONS = [
  "Soil N 20 P 10 K 40 — how much fertilizer for rice on 2 ha?",
  "Which crop suits N 90, P 42, K 43, 21 °C, 82% humidity, pH 6.5 and 200 mm rain?",
  "How do I reclaim sodic soil?",
  "When should I split nitrogen doses for wheat?",
];

const newThread = () => `console-${Math.random().toString(36).slice(2, 10)}`;

function sourceLabel(s) {
  if (typeof s === "string") return s;
  return s.title ? `${s.title}${s.source ? ` · ${s.source}` : ""}` : s.source ?? JSON.stringify(s);
}

function Message({ m }) {
  const user = m.role === "user";
  return (
    <li className={cx("flex gap-3", user && "flex-row-reverse")}>
      <span className={cx("grid size-8 shrink-0 place-items-center rounded-full", user ? "bg-primary text-on-primary" : "bg-good-soft text-good")}>
        <Icon name={user ? "account_circle" : "smart_toy"} size={18} />
      </span>
      <div className={cx("flex max-w-[85%] min-w-0 flex-col gap-2", user && "items-end")}>
        {m.tools?.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {m.tools.map((t, i) => (
              <span key={`${t.name}-${i}`} className="inline-flex items-center gap-1 rounded-full bg-surface-2 px-2.5 py-1 text-xs text-ink-2">
                <Icon name={t.done ? (t.error ? "error" : "check_circle") : "sync"} size={14} className={cx(!t.done && "animate-spin", t.error && "text-bad")} />
                {titleCase(t.name)}
              </span>
            ))}
          </div>
        )}
        {(m.text || m.pending) && (
          <div className={cx("rounded-3xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap",
            user ? "rounded-tr-md bg-primary-soft text-ink" : "rounded-tl-md border border-outline bg-surface text-ink")}>
            {m.text || <span className="animate-pulse-dot text-ink-3">Thinking…</span>}
          </div>
        )}
        {m.notice && <p className="text-xs text-ink-3">{m.notice}</p>}
        {m.error && <p className="flex items-center gap-1 text-xs text-bad"><Icon name="error" size={14} />{m.error}</p>}
        {m.sources?.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {m.sources.map((s) => (
              <span key={sourceLabel(s)} className="inline-flex items-center gap-1 rounded-lg border border-outline px-2 py-0.5 text-[11.5px] text-ink-2">
                <Icon name="info" size={13} />{sourceLabel(s)}
              </span>
            ))}
          </div>
        )}
      </div>
    </li>
  );
}

export default function AssistantPage() {
  const status = useAssistantStatus();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [thread, setThread] = useState(newThread);
  const abortRef = useRef(null);
  const endRef = useRef(null);

  useEffect(() => endRef.current?.scrollIntoView?.({ behavior: "smooth", block: "end" }), [messages]);
  useEffect(() => () => abortRef.current?.abort(), []);

  const patchLast = (fn) => setMessages((ms) => [...ms.slice(0, -1), fn(ms[ms.length - 1])]);

  const send = async (text) => {
    const message = text.trim();
    if (!message || busy) return;
    setInput("");
    setBusy(true);
    setMessages((ms) => [...ms, { role: "user", text: message }, { role: "assistant", text: "", pending: true, tools: [], sources: [] }]);
    const controller = new AbortController();
    abortRef.current = controller;
    try {
      await streamSse("/api/assistant/chat", { message, thread_id: thread }, (ev) => {
        if (ev.type === "token") patchLast((m) => ({ ...m, text: m.text + ev.text }));
        else if (ev.type === "tool") patchLast((m) => ({ ...m, tools: [...m.tools, { name: ev.name }] }));
        else if (ev.type === "tool_result") patchLast((m) => ({
          ...m, tools: m.tools.map((t) => (t.name === ev.name && !t.done ? { ...t, done: true, error: ev.is_error } : t)),
        }));
        else if (ev.type === "sources") patchLast((m) => ({ ...m, sources: ev.sources }));
        else if (ev.type === "notice") patchLast((m) => ({ ...m, notice: ev.text }));
        else if (ev.type === "error") patchLast((m) => ({ ...m, error: ev.message }));
      }, { signal: controller.signal });
    } catch (error) {
      if (!controller.signal.aborted) patchLast((m) => ({ ...m, error: error.message }));
    } finally {
      patchLast((m) => ({ ...m, pending: false }));
      setBusy(false);
      abortRef.current = null;
    }
  };

  const reset = () => {
    abortRef.current?.abort();
    setMessages([]);
    setThread(newThread());
  };

  const st = status.data;
  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_20rem]">
      <Card className="flex min-h-[70dvh] flex-col" bodyClassName="flex flex-1 flex-col gap-4">
        {messages.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 py-10 text-center">
            <span className="grid size-14 place-items-center rounded-full bg-good-soft text-good"><Icon name="smart_toy" size={30} /></span>
            <div>
              <p className="text-xl text-ink">Ask the agronomy assistant</p>
              <p className="mt-1 text-sm text-ink-2">It calls the crop, fertilizer and yield models as tools and cites the knowledge base.</p>
            </div>
            <div className="flex max-w-2xl flex-wrap justify-center gap-2">
              {SUGGESTIONS.map((s) => <Chip key={s} onClick={() => send(s)}>{s}</Chip>)}
            </div>
          </div>
        ) : (
          <ul className="flex flex-1 flex-col gap-5 overflow-y-auto" aria-live="polite">
            {messages.map((m, i) => <Message key={i} m={m} />)}
            <li ref={endRef} />
          </ul>
        )}
        <form className="flex items-end gap-2 border-t border-outline pt-4" onSubmit={(e) => { e.preventDefault(); send(input); }}>
          <label htmlFor="chat-input" className="sr-only">Message</label>
          <textarea id="chat-input" rows={1} value={input} maxLength={2000} placeholder="Ask about crops, soil, fertilizer or yield…"
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(input); } }}
            className="max-h-40 min-h-11 flex-1 resize-y rounded-3xl border border-outline bg-surface px-4 py-2.5 text-sm text-ink placeholder:text-ink-3 focus:border-primary focus:outline-none" />
          {busy
            ? <Button variant="tonal" icon="stop" onClick={() => abortRef.current?.abort()}>Stop</Button>
            : <Button type="submit" icon="send" disabled={!input.trim()}>Send</Button>}
        </form>
      </Card>
      <div className="flex flex-col gap-4">
        <Card title="Assistant runtime" icon="psychology">
          {st ? (
            <dl className="flex flex-col gap-2 text-[13px]">
              <div className="flex items-center justify-between gap-2"><dt className="text-ink-2">LLM</dt>
                <dd><StatusPill status={st.llm_available ? "ok" : "degraded"} label={st.llm_available ? "Claude" : "Offline"} /></dd></div>
              {!st.llm_available && <p className="text-xs text-ink-3">{st.llm_reason} — answers come from the knowledge base and models.</p>}
              <div className="flex justify-between gap-2"><dt className="text-ink-2">Model</dt><dd className="truncate text-ink">{st.model}</dd></div>
              <div className="flex justify-between gap-2"><dt className="text-ink-2">Agent</dt><dd className="text-ink">{st.agent_runtime}</dd></div>
              <div className="flex justify-between gap-2"><dt className="text-ink-2">Vector store</dt><dd className="text-ink">{st.vector_store}</dd></div>
              <div className="flex justify-between gap-2"><dt className="text-ink-2">Embeddings</dt><dd className="truncate text-ink">{st.embedder}</dd></div>
              <div className="flex justify-between gap-2"><dt className="text-ink-2">Chunks indexed</dt><dd className="text-ink">{st.documents}</dd></div>
            </dl>
          ) : <p className="text-[13px] text-ink-3">{status.error ? status.error.message : "Loading…"}</p>}
        </Card>
        <Button variant="outlined" icon="refresh" onClick={reset} disabled={!messages.length}>New conversation</Button>
      </div>
    </div>
  );
}
