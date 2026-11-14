import { RotateCcw, Send } from "lucide-react";
import { useState } from "react";
import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";
import Spinner from "react-bootstrap/Spinner";

export function ChatInput({ busy, onSend, onReset }) {
  const [text, setText] = useState("");

  const submit = () => {
    if (!text.trim() || busy) return;
    onSend(text);
    setText("");
  };

  return (
    <form
      className="d-flex gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
    >
      <Form.Label htmlFor="chat-input" visuallyHidden>
        Message
      </Form.Label>
      <Form.Control
        as="textarea"
        id="chat-input"
        rows={2}
        maxLength={2000}
        placeholder="Ask a farming question… (Enter to send, Shift+Enter for a new line)"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            submit();
          }
        }}
      />
      <div className="d-flex flex-column gap-2">
        <Button type="submit" disabled={busy || !text.trim()} aria-label="Send">
          {busy ? <Spinner size="sm" /> : <Send size={16} />}
        </Button>
        <Button variant="outline-secondary" onClick={onReset} aria-label="New chat" title="New chat">
          <RotateCcw size={16} />
        </Button>
      </div>
    </form>
  );
}
