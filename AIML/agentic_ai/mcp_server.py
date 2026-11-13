"""Model Context Protocol (MCP) server exposing AgriSmart tools to any MCP
client (Claude Desktop, Claude Code, IDE agents).

Tools:     recommend_crop · predict_yield · fertilizer_plan · weather_forecast · search_knowledge
Resources: knowledge://{name} — the agronomy knowledge base documents

Run over stdio (how desktop clients launch it):
    python -m AIML.agentic_ai.mcp_server

Claude Code:  claude mcp add agrismart -- python -m AIML.agentic_ai.mcp_server
"""
from __future__ import annotations

from mcp.server.fastmcp import FastMCP

from AIML.agentic_ai import tools
from AIML.config import KNOWLEDGE_DIR

mcp = FastMCP("agrismart")


@mcp.tool()
def recommend_crop(N: float, P: float, K: float, temperature: float, humidity: float, ph: float, rainfall: float) -> dict:
    """Rank the 3 best crops for soil N, P, K, pH, temperature (°C), humidity (%) and rainfall (mm)."""
    return tools.recommend_crop(N, P, K, temperature, humidity, ph, rainfall)


@mcp.tool()
def predict_yield(crop: str, season: str, state: str, year: int, area_ha: float, annual_rainfall: float | None = None) -> dict:
    """Predict yield (t/ha) and production for an Indian state, season and crop (e.g. 'Rice', 'Kharif', 'Punjab')."""
    return tools.predict_yield(crop, season, state, year, area_ha, annual_rainfall)


@mcp.tool()
def fertilizer_plan(crop: str, N: float, P: float, K: float, area_ha: float = 1.0) -> dict:
    """DAP, Urea and MOP doses (kg) for a crop given soil N, P, K (kg/ha) and field area."""
    return tools.fertilizer_plan(crop, N, P, K, area_ha)


@mcp.tool()
def weather_forecast(latitude: float, longitude: float, days: int = 5) -> dict:
    """Daily weather forecast: temperature, rain, evapotranspiration and wind."""
    return tools.weather_forecast(latitude, longitude, days)


@mcp.tool()
def search_knowledge(query: str, k: int = 3) -> list[dict]:
    """Search the agronomy knowledge base (soil, fertilizers, seasons, irrigation); cite results by source."""
    return tools.search_knowledge(query, k)


@mcp.resource("knowledge://{name}")
def knowledge_doc(name: str) -> str:
    """A knowledge-base document by file name, e.g. knowledge://fertilizers-india"""
    path = (KNOWLEDGE_DIR / f"{name}.md").resolve()
    if path.parent != KNOWLEDGE_DIR.resolve() or not path.exists():  # no path traversal
        raise ValueError(f"unknown document '{name}'")
    return path.read_text(encoding="utf-8")


if __name__ == "__main__":
    mcp.run()  # stdio transport
