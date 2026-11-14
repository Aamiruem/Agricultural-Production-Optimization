import { BookOpen, Wrench } from "lucide-react";
import Badge from "react-bootstrap/Badge";
import Spinner from "react-bootstrap/Spinner";
import Markdown from "react-markdown";

const TOOL_LABELS = {
  recommend_crop: "Ran the crop model",
  fertilizer_plan: "Calculated fertilizer doses",
  get_crop_profile: "Looked up a crop profile",
  search_knowledge: "Searched the knowledge base",
};

export function ChatMessage({ turn, streaming }) {
  if (turn.role === "user") {
    return (
      <div className="chat-bubble-user ms-auto px-3 py-2 small" style={{ maxWidth: "85%" }}>
        {turn.text}
      </div>
    );
  }

  return (
    <div className="d-grid gap-2" style={{ maxWidth: "95%" }} data-testid="assistant-turn">
      {turn.tools.length > 0 && (
        <ul className="list-unstyled d-flex flex-wrap gap-1 mb-0" aria-label="Steps">
          {turn.tools.map((tool, i) => (
            <li key={i}>
              <Badge
                bg={tool.isError ? "danger-subtle" : "light"}
                text={tool.isError ? "danger-emphasis" : "dark"}
                className="border d-inline-flex align-items-center gap-1 fw-normal"
              >
                {tool.done ? <Wrench size={12} /> : <Spinner size="sm" style={{ width: 10, height: 10 }} />}
                {TOOL_LABELS[tool.name] ?? tool.name}
              </Badge>
            </li>
          ))}
        </ul>
      )}
      {turn.text ? (
        // react-markdown never renders raw HTML, so model output can't inject markup.
        <div className="markdown small lh-lg">
          <Markdown>{turn.text}</Markdown>
        </div>
      ) : (
        streaming && !turn.error && <Spinner size="sm" aria-label="Thinking" />
      )}
      {turn.notices.map((n, i) => (
        <p key={i} className="small fst-italic text-body-secondary mb-0">
          {n}
        </p>
      ))}
      {turn.error && (
        <p role="alert" className="small text-danger mb-0">
          {turn.error}
        </p>
      )}
      {turn.sources.length > 0 && (
        <ul className="list-unstyled d-flex flex-wrap gap-1 mb-0" aria-label="Sources">
          {turn.sources.map((s) => (
            <li key={s.title}>
              <Badge
                bg="success-subtle"
                text="success-emphasis"
                title={s.title}
                className="d-inline-flex align-items-center gap-1 fw-normal"
              >
                <BookOpen size={12} /> {s.source}
              </Badge>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
