"""Generative AI with Claude (Anthropic SDK): prompting patterns for agriculture.

* zero-shot          — an advisory answer from instructions only
* few-shot           — examples steer tone and format (crop-calendar advice)
* structured output  — extract soil-test values from free text into a validated
                       Pydantic object (`messages.parse`), ready for the ML model
* streaming          — tokens printed as they arrive

Requires ANTHROPIC_API_KEY (or an `ant auth login` profile). Every call bills
your account; the examples are short.

    python -m AIML.generative_ai.prompting
"""
from __future__ import annotations

from pydantic import BaseModel, Field

MODEL = "claude-opus-5-5"
# Server-side fallback: if a safety classifier declines, the API retries on a
# suitable model within the same call.
FALLBACK = {"betas": ["server-side-fallback-2026-07-01"], "fallbacks": "default"}

SYSTEM = (
    "You are an agronomy advisor for smallholder farmers in India. Answer practically and briefly, "
    "with quantities per acre and per hectare. Say when a soil test or the local Krishi Vigyan Kendra should confirm advice."
)


class SoilTest(BaseModel):
    """Soil health card values; null when the text doesn't give a value."""

    nitrogen_kg_ha: float | None = Field(None, description="Available nitrogen (N), kg/ha")
    phosphorus_kg_ha: float | None = Field(None, description="Available phosphorus (P), kg/ha")
    potassium_kg_ha: float | None = Field(None, description="Available potassium (K), kg/ha")
    ph: float | None = Field(None, description="Soil pH")
    organic_carbon_pct: float | None = Field(None, description="Organic carbon, %")
    electrical_conductivity: float | None = Field(None, description="EC, dS/m")


def _text(response) -> str:
    return "".join(b.text for b in response.content if b.type == "text")


def client():
    import anthropic

    return anthropic.Anthropic()


def zero_shot(question: str) -> str:
    r = client().beta.messages.create(
        model=MODEL, max_tokens=2000, system=SYSTEM, output_config={"effort": "low"},
        messages=[{"role": "user", "content": question}], **FALLBACK)
    return _text(r)


FEW_SHOT = [
    {"role": "user", "content": "Crop: wheat. Region: Punjab."},
    {"role": "assistant", "content": "Sow: 1-15 Nov · Seed: 100 kg/ha · First irrigation: 20-25 days (crown root) · Harvest: April"},
    {"role": "user", "content": "Crop: mustard. Region: Rajasthan."},
    {"role": "assistant", "content": "Sow: 5-25 Oct · Seed: 5 kg/ha · First irrigation: 30-35 days · Harvest: Feb-Mar"},
]


def few_shot(crop: str, region: str) -> str:
    r = client().beta.messages.create(
        model=MODEL, max_tokens=500, system=SYSTEM + " Reply in exactly the one-line format shown.",
        output_config={"effort": "low"},
        messages=[*FEW_SHOT, {"role": "user", "content": f"Crop: {crop}. Region: {region}."}], **FALLBACK)
    return _text(r)


def extract_soil_test(text: str) -> SoilTest:
    r = client().beta.messages.parse(
        model=MODEL, max_tokens=2000, output_format=SoilTest, output_config={"effort": "low"},
        messages=[{"role": "user", "content": f"Extract the soil test values from this report:\n\n{text}"}],
        **FALLBACK)
    if r.stop_reason == "refusal" or r.parsed_output is None:
        raise RuntimeError("the model did not return a soil test")
    return r.parsed_output


def stream_answer(question: str) -> str:
    chunks = []
    with client().beta.messages.stream(
        model=MODEL, max_tokens=4000, system=SYSTEM, output_config={"effort": "low"},
        messages=[{"role": "user", "content": question}], **FALLBACK,
    ) as stream:
        for text in stream.text_stream:
            print(text, end="", flush=True)
            chunks.append(text)
    print()
    return "".join(chunks)


if __name__ == "__main__":
    print(zero_shot("My paddy leaves are turning yellow from the tips. What should I check first?"))
    print(few_shot("chickpea", "Madhya Pradesh"))
    print(extract_soil_test("Soil Health Card — N 212 kg/ha (low), P 18.5 kg/ha, K 290 kg/ha, pH 7.9, OC 0.42%, EC 0.6"))
