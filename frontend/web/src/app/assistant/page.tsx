import type { Metadata } from "next";

import { AssistantChat } from "@/components/assistant/assistant-chat";
import { PageHeader } from "@/components/page-header";

export const metadata: Metadata = {
  title: "Farm assistant",
  description: "Ask an AI assistant about crops, soil nutrients, fertilizers and irrigation.",
};

export default function AssistantPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        title="Farm assistant"
        description="An AI agent that runs the crop model and fertilizer calculator, searches the agronomy knowledge base and cites its sources."
      />
      <AssistantChat />
    </div>
  );
}
