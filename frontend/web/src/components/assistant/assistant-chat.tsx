"use client";

import { useQuery } from "@tanstack/react-query";
import { BookOpen, Loader2, RotateCcw, Send, Wrench } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import Markdown from "react-markdown";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { fetchAssistantStatus } from "@/lib/api/endpoints";
import { streamChat } from "@/lib/api/sse";
import type { ChatEvent, Source } from "@/lib/api/types";
import { cn } from "@/lib/utils";

interface Turn {
  id: string;
  role: "user" | "assistant";
  text: string;
  tools: { name: string; isError?: boolean; done: boolean }[];
  sources: Source[];
  notices: string[];
  error?: string;
}

const TOOL_LABELS: Record<string, string> = {
  recommend_crop: "Ran the crop model",
  fertilizer_plan: "Calculated fertilizer doses",
  get_crop_profile: "Looked up a crop profile",
  search_knowledge: "Searched the knowledge base",
};

const SUGGESTIONS = [
  "How much urea and DAP should I apply for rice on 2 ha with soil N 20, P 10, K 40?",
  "My soil pH is 5.2. What should I do before sowing pulses?",
  "Which crops suit N 40, P 65, K 78, 19°C, 18% humidity, pH 7.2 and 80 mm rain?",
];

/** Apply one streamed event to the assistant turn being built. */
export function applyEvent(turn: Turn, event: ChatEvent): Turn {
  switch (event.type) {
    case "token":
      return { ...turn, text: turn.text + event.text };
    case "tool":
      return { ...turn, tools: [...turn.tools, { name: event.name, done: false }] };
    case "tool_result": {
      const i = turn.tools.findIndex((t) => t.name === event.name && !t.done);
      if (i < 0) return turn;
      const tools = [...turn.tools];
      tools[i] = { ...tools[i], done: true, isError: event.is_error };
      return { ...turn, tools };
    }
    case "sources":
      return { ...turn, sources: event.sources };
    case "notice":
      return { ...turn, notices: [...turn.notices, event.text] };
    case "error":
      return { ...turn, error: event.message };
    default:
      return turn;
  }
}

const newThreadId = () => crypto.randomUUID().replace(/-/g, "").slice(0, 24);

export function AssistantChat() {
  const status = useQuery({ queryKey: ["assistant-status"], queryFn: fetchAssistantStatus, staleTime: 60_000 });
  const [turns, setTurns] = useState<Turn[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  // Created on first send (not during render: random values can't be prerendered).
  const threadRef = useRef<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  // Braces matter: newer browsers return a Promise from scrollIntoView(), and an
  // effect must return nothing or a cleanup function.
  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [turns]);
  useEffect(() => () => abortRef.current?.abort(), []);

  async function send(message: string) {
    const text = message.trim();
    if (!text || busy) return;
    const assistantId = crypto.randomUUID();
    setInput("");
    setBusy(true);
    setTurns((prev) => [
      ...prev,
      { id: crypto.randomUUID(), role: "user", text, tools: [], sources: [], notices: [] },
      { id: assistantId, role: "assistant", text: "", tools: [], sources: [], notices: [] },
    ]);
    const update = (fn: (t: Turn) => Turn) =>
      setTurns((prev) => prev.map((t) => (t.id === assistantId ? fn(t) : t)));

    abortRef.current = new AbortController();
    threadRef.current ??= newThreadId();
    try {
      await streamChat({ message: text, thread_id: threadRef.current }, (e) => update((t) => applyEvent(t, e)), abortRef.current.signal);
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        update((t) => ({ ...t, error: err instanceof TypeError ? "Cannot reach the assistant. Is the FastAPI backend running?" : (err as Error).message }));
      }
    } finally {
      setBusy(false);
    }
  }

  function newChat() {
    abortRef.current?.abort();
    setTurns([]);
    threadRef.current = null;
  }

  return (
    <div className="grid gap-4">
      {status.data && (
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <Badge variant={status.data.llm_available ? "secondary" : "outline"}>
            {status.data.llm_available ? `Claude · ${status.data.model}` : "Knowledge base only"}
          </Badge>
          <span>
            {status.data.agent_runtime} agent · {status.data.documents} passages · {status.data.vector_store} vectors ·{" "}
            {status.data.embedder}
          </span>
          {!status.data.llm_available && <span>({status.data.llm_reason})</span>}
        </div>
      )}

      <div className="min-h-80 space-y-4 rounded-xl border bg-card p-4" aria-live="polite" aria-busy={busy}>
        {turns.length === 0 && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Ask about crops, soil, fertilizers or irrigation. The assistant uses the crop model, the fertilizer
              calculator and a knowledge base, and cites its sources.
            </p>
            <div className="flex flex-col gap-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => send(s)}
                  className="rounded-lg border px-3 py-2 text-left text-sm hover:bg-muted"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {turns.map((t) =>
          t.role === "user" ? (
            <div key={t.id} className="ml-auto max-w-[85%] rounded-2xl rounded-br-sm bg-primary px-3 py-2 text-sm text-primary-foreground">
              {t.text}
            </div>
          ) : (
            <div key={t.id} className="max-w-[95%] space-y-2" data-testid="assistant-turn">
              {t.tools.length > 0 && (
                <ul className="flex flex-wrap gap-1.5" aria-label="Steps">
                  {t.tools.map((tool, i) => (
                    <li key={i}>
                      <Badge variant="outline" className={cn(tool.isError && "border-destructive text-destructive")}>
                        {tool.done ? <Wrench /> : <Loader2 className="animate-spin" />}
                        {TOOL_LABELS[tool.name] ?? tool.name}
                      </Badge>
                    </li>
                  ))}
                </ul>
              )}
              {t.text ? (
                // react-markdown never renders raw HTML, so model output can't inject markup.
                <div className="space-y-2 text-sm leading-relaxed [&_li]:ml-5 [&_ol]:list-decimal [&_strong]:font-semibold [&_ul]:list-disc">
                  <Markdown>{t.text}</Markdown>
                </div>
              ) : (
                busy && !t.error && <Loader2 className="size-4 animate-spin text-muted-foreground" aria-label="Thinking" />
              )}
              {t.notices.map((n, i) => <p key={i} className="text-xs text-muted-foreground italic">{n}</p>)}
              {t.error && <p role="alert" className="text-sm text-destructive">{t.error}</p>}
              {t.sources.length > 0 && (
                <ul aria-label="Sources" className="flex flex-wrap gap-1.5">
                  {t.sources.map((s) => (
                    <li key={s.title}>
                      <Badge variant="secondary" title={s.title}>
                        <BookOpen /> {s.source}
                      </Badge>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ),
        )}
        <div ref={endRef} />
      </div>

      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          void send(input);
        }}
      >
        <label htmlFor="chat-input" className="sr-only">Message</label>
        <textarea
          id="chat-input"
          value={input}
          maxLength={2000}
          rows={2}
          placeholder="Ask a farming question…"
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              void send(input);
            }
          }}
          className="min-h-11 flex-1 resize-y rounded-lg border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        />
        <div className="flex flex-col gap-2">
          <Button type="submit" disabled={busy || !input.trim()} aria-label="Send">
            {busy ? <Loader2 className="animate-spin" /> : <Send />}
          </Button>
          <Button type="button" variant="ghost" onClick={newChat} aria-label="New chat" title="New chat">
            <RotateCcw />
          </Button>
        </div>
      </form>
    </div>
  );
}
