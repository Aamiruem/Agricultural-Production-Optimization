"""Multi-agent farm advisor with LangGraph: supervisor + specialist agents.

    START → supervisor ─┬─► crop_agent ───────┐
                        ├─► nutrient_agent ───┤
                        ├─► weather_agent ────┼─► (approval?) ─► writer → END
                        └─► knowledge_agent ──┘

* supervisor       routes the question using the NLP intent classifier + extracted numbers
                   (planning without an LLM: cheap, fast and deterministic)
* specialists      call tools (crop model, fertilizer calculator, Open-Meteo, RAG)
* human-in-the-loop large fertilizer orders pause for approval (LangGraph `interrupt`)
* writer           composes the answer — with Claude when available, else a template
* memory           a checkpointer keeps each conversation thread

`run_plain` executes the same nodes without LangGraph (used in tests and where
LangGraph isn't installed).

    python -m AIML.agentic_ai.multi_agent "Soil N 20 P 10 K 40, rice on 2 ha: how much fertilizer?"
"""
from __future__ import annotations

import re
import sys
from typing import TypedDict

from AIML.agentic_ai import tools

APPROVAL_KG = 500  # fertilizer orders above this need a human "yes"


class State(TypedDict, total=False):
    question: str
    route: str
    numbers: dict
    findings: list[dict]
    needs_approval: bool
    approved: bool
    answer: str


# ---------------------------------------------------------------- parsing
_NUM = r"(\d+(?:\.\d+)?)"
PATTERNS = {"N": rf"\bN\s*[:=]?\s*{_NUM}", "P": rf"\bP\s*[:=]?\s*{_NUM}", "K": rf"\bK\s*[:=]?\s*{_NUM}",
            "ph": rf"\bpH\s*[:=]?\s*{_NUM}", "area_ha": rf"{_NUM}\s*(?:ha|hectare)", "temperature": rf"{_NUM}\s*°?C\b",
            "humidity": rf"{_NUM}\s*%\s*humid", "rainfall": rf"{_NUM}\s*mm"}
CROPS = sorted(tools.NPK_TARGETS, key=len, reverse=True)


def extract(question: str) -> dict:
    found = {k: float(m.group(1)) for k, p in PATTERNS.items() if (m := re.search(p, question, re.I))}
    crop = next((c for c in CROPS if c in question.lower()), None)
    return {**found, **({"crop": crop} if crop else {})}


# ------------------------------------------------------------------ nodes
def supervisor(state: State) -> State:
    q = state["question"]
    nums = extract(q)
    try:
        from AIML.nlp.intent_classifier import predict

        intent = predict([q])[0]["intent"]
    except Exception:  # model not trained yet
        intent = "fertilizer" if {"N", "P", "K"} <= nums.keys() else "other"
    if {"N", "P", "K", "temperature", "humidity", "ph", "rainfall"} <= nums.keys():
        route = "crop"
    elif intent == "fertilizer" or ({"N", "P", "K"} <= nums.keys() and "crop" in nums):
        route = "nutrient"
    elif intent == "weather":
        route = "weather"
    else:
        route = "knowledge"
    return {"route": route, "numbers": nums, "findings": []}


def crop_agent(state: State) -> State:
    n = state["numbers"]
    result = tools.recommend_crop(**{k: n[k] for k in ("N", "P", "K", "temperature", "humidity", "ph", "rainfall")})
    return {"findings": state["findings"] + [{"agent": "crop", "result": result}]}


def nutrient_agent(state: State) -> State:
    n = state["numbers"]
    if not ({"N", "P", "K"} <= n.keys() and "crop" in n):
        return knowledge_agent(state)
    plan = tools.fertilizer_plan(n["crop"], n["N"], n["P"], n["K"], n.get("area_ha", 1.0))
    total = sum(plan["kg_total"].values())
    return {"findings": state["findings"] + [{"agent": "nutrient", "result": plan}], "needs_approval": total > APPROVAL_KG}


def weather_agent(state: State, latitude: float = 30.90, longitude: float = 75.85) -> State:
    try:
        result = tools.weather_forecast(latitude, longitude, days=3)
    except Exception as exc:  # offline
        result = {"error": f"forecast unavailable: {exc.__class__.__name__}"}
    return {"findings": state["findings"] + [{"agent": "weather", "result": result}]}


def knowledge_agent(state: State) -> State:
    return {"findings": state["findings"] + [{"agent": "knowledge", "result": tools.search_knowledge(state["question"])}]}


def approval(state: State) -> State:
    """Human-in-the-loop: pause the graph until a person approves the order."""
    if not state.get("needs_approval"):
        return {"approved": True}
    from langgraph.types import interrupt

    decision = interrupt({"question": "Approve this fertilizer order?", "plan": state["findings"][-1]["result"]})
    return {"approved": bool(decision)}


def writer(state: State) -> State:
    lines = []
    for f in state["findings"]:
        r = f["result"]
        if f["agent"] == "crop":
            lines.append("Best crops: " + ", ".join(f"{t['crop']} ({t['probability']:.0%})" for t in r["top"]))
        elif f["agent"] == "nutrient":
            kg = r["kg_total"]
            lines.append(f"For {r['crop']} on {r['area_ha']} ha apply DAP {kg['DAP']} kg, Urea {kg['Urea']} kg, MOP {kg['MOP']} kg.")
            if state.get("approved") is False:
                lines.append("(Order not approved — nothing scheduled.)")
        elif f["agent"] == "weather":
            if "error" in r:
                lines.append(r["error"])
            else:
                lines.append("Next days rain (mm): " + ", ".join(f"{d}: {p}" for d, p in zip(r["time"], r["precipitation_sum"])))
        else:
            lines += [f"[{p['source']}] {p['text']}" for p in r[:2]]
    return {"answer": "\n".join(lines)}


SPECIALISTS = {"crop": crop_agent, "nutrient": nutrient_agent, "weather": weather_agent, "knowledge": knowledge_agent}


# --------------------------------------------------------------- runners
def build_graph():
    from langgraph.checkpoint.memory import InMemorySaver
    from langgraph.graph import END, START, StateGraph

    g = StateGraph(State)
    g.add_node("supervisor", supervisor)
    for name, fn in SPECIALISTS.items():
        g.add_node(f"{name}_agent", fn)
        g.add_edge(f"{name}_agent", "approval")
    g.add_node("approval", approval)
    g.add_node("writer", writer)
    g.add_edge(START, "supervisor")
    g.add_conditional_edges("supervisor", lambda s: f"{s['route']}_agent")
    g.add_edge("approval", "writer")
    g.add_edge("writer", END)
    return g.compile(checkpointer=InMemorySaver())


def run_plain(question: str, approve: bool = True) -> State:
    state: State = {"question": question}
    state.update(supervisor(state))
    state.update(SPECIALISTS[state["route"]](state))
    state["approved"] = approve if state.get("needs_approval") else True
    state.update(writer(state))
    return state


if __name__ == "__main__":
    q = " ".join(sys.argv[1:]) or "Soil N 20 P 10 K 40, rice on 2 ha: how much fertilizer?"
    try:
        graph = build_graph()
        config = {"configurable": {"thread_id": "demo"}}
        result = graph.invoke({"question": q}, config)
        if "__interrupt__" in result:
            from langgraph.types import Command

            print("Approval requested:", result["__interrupt__"][0].value)
            result = graph.invoke(Command(resume=True), config)
        print(result["answer"])
    except ImportError:
        print(run_plain(q)["answer"])
