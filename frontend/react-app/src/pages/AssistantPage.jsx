import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import Badge from "react-bootstrap/Badge";
import Card from "react-bootstrap/Card";

import { ChatInput } from "@/components/assistant/ChatInput";
import { ChatMessage } from "@/components/assistant/ChatMessage";
import { PageHeader } from "@/components/common/PageHeader";
import { useChat } from "@/hooks/useChat";
import { fetchAssistantStatus } from "@/services/assistantService";

const SUGGESTIONS = [
  "How much urea and DAP should I apply for rice on 2 ha with soil N 20, P 10, K 40?",
  "My soil pH is 5.2. What should I do before sowing pulses?",
  "Which crops suit N 40, P 65, K 78, 19°C, 18% humidity, pH 7.2 and 80 mm rain?",
];

export default function AssistantPage() {
  const status = useQuery({ queryKey: ["assistant-status"], queryFn: fetchAssistantStatus, staleTime: 60_000 });
  const { turns, busy, send, reset } = useChat();
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [turns]);

  const s = status.data;
  return (
    <div className="mx-auto" style={{ maxWidth: 820 }}>
      <PageHeader
        title="Farm assistant"
        description="An AI agent (Claude + LangGraph) that runs the crop model and fertilizer calculator, searches the agronomy knowledge base (RAG) and cites its sources."
      />
      {s && (
        <p className="small text-body-secondary d-flex flex-wrap align-items-center gap-2">
          <Badge bg={s.llm_available ? "success" : "secondary"}>{s.llm_available ? `Claude · ${s.model}` : "Knowledge base only"}</Badge>
          {s.agent_runtime} agent · {s.documents} passages · {s.vector_store} vectors · {s.embedder}
          {!s.llm_available && <span>({s.llm_reason})</span>}
        </p>
      )}
      <Card className="mb-3">
        <Card.Body className="d-grid gap-3" style={{ minHeight: 320 }} aria-live="polite" aria-busy={busy}>
          {turns.length === 0 && (
            <div className="d-grid gap-2">
              <p className="small text-body-secondary mb-1">Ask about crops, soil, fertilizers or irrigation. Try one of these:</p>
              {SUGGESTIONS.map((q) => (
                <button key={q} type="button" className="btn btn-outline-secondary btn-sm text-start" onClick={() => send(q)}>
                  {q}
                </button>
              ))}
            </div>
          )}
          {turns.map((t, i) => (
            <ChatMessage key={t.id} turn={t} streaming={busy && i === turns.length - 1} />
          ))}
          <div ref={endRef} />
        </Card.Body>
      </Card>
      <ChatInput busy={busy} onSend={send} onReset={reset} />
    </div>
  );
}
