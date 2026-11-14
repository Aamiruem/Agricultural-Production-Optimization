"""Model Context Protocol (MCP) server exposing AgriSmart tools to any MCP
client (Claude Desktop, Claude Code, IDE agents) and to other services.

Tools:     recommend_crop · explain_crop · predict_yield · fertilizer_plan ·
           weather_forecast · search_knowledge
Resources: knowledge://{name} — the agronomy knowledge base documents

Transports
----------
stdio (how desktop clients launch it)::

    python -m AIML.agentic_ai.mcp_server
    claude mcp add agrismart -- python -m AIML.agentic_ai.mcp_server

Streamable HTTP, **stateless**, so any number of replicas can sit behind a load
balancer with no sticky sessions (every request carries its full context)::

    python -m AIML.agentic_ai.mcp_server --transport http --port 8100 --workers 2
    claude mcp add --transport http agrismart http://localhost:8100/mcp

``GET /health`` answers load-balancer health checks on the HTTP transport.
"""
from __future__ import annotations

import argparse
import os
import time

from AIML.agentic_ai import tools
from AIML.config import KNOWLEDGE_DIR

try:  # mcp >= 2.0
    from mcp.server.mcpserver import MCPServer as _Server

    MCP_V2 = True
except ImportError:  # mcp 1.x
    from mcp.server.fastmcp import FastMCP as _Server

    MCP_V2 = False

INSTRUCTIONS = (
    "AgriSmart agronomy tools for Indian farms. Use recommend_crop (and explain_crop to justify it) "
    "for soil readings, predict_yield for state/season/crop forecasts, fertilizer_plan for DAP/Urea/MOP "
    "doses, weather_forecast for field weather and search_knowledge to cite agronomy guidance."
)
_STARTED = time.time()

mcp = _Server("agrismart", instructions=INSTRUCTIONS)


@mcp.tool()
def recommend_crop(N: float, P: float, K: float, temperature: float, humidity: float, ph: float, rainfall: float) -> dict:
    """Rank the 3 best crops for soil N, P, K, pH, temperature (°C), humidity (%) and rainfall (mm)."""
    return tools.recommend_crop(N, P, K, temperature, humidity, ph, rainfall)


@mcp.tool()
def explain_crop(N: float, P: float, K: float, temperature: float, humidity: float, ph: float, rainfall: float,
                 top: int = 3) -> dict:
    """Explain a crop recommendation: TreeSHAP contribution of each reading to each top crop's probability."""
    return tools.explain_crop(N, P, K, temperature, humidity, ph, rainfall, top=min(max(top, 1), 5))


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


@mcp.custom_route("/health", methods=["GET"], include_in_schema=False)
async def health(_request):
    from starlette.responses import JSONResponse

    return JSONResponse({"status": "ok", "service": "mcp", "transport": "streamable-http", "stateless": True,
                         "pid": os.getpid(), "uptime_s": round(time.time() - _STARTED, 1)})


def create_http_app():
    """ASGI app for the stateless streamable-HTTP transport (uvicorn factory)."""
    if MCP_V2:
        # host="0.0.0.0" skips localhost-only DNS-rebinding checks: in a container the
        # Host header is the gateway's service name. Expose only behind the gateway.
        host = os.getenv("MCP_BIND_HOST", "0.0.0.0")
        return mcp.streamable_http_app(stateless_http=True, json_response=True, host=host)
    mcp.settings.stateless_http = True
    mcp.settings.json_response = True
    return mcp.streamable_http_app()


def main(argv: list[str] | None = None) -> None:
    parser = argparse.ArgumentParser(description="AgriSmart MCP server")
    parser.add_argument("--transport", choices=["stdio", "http"], default=os.getenv("MCP_TRANSPORT", "stdio"))
    parser.add_argument("--host", default=os.getenv("MCP_HOST", "127.0.0.1"))
    parser.add_argument("--port", type=int, default=int(os.getenv("MCP_PORT", "8100")))
    parser.add_argument("--workers", type=int, default=int(os.getenv("MCP_WORKERS", "1")))
    args = parser.parse_args(argv)

    if args.transport == "stdio":
        mcp.run()
        return
    import uvicorn

    os.environ.setdefault("MCP_BIND_HOST", args.host)
    uvicorn.run("AIML.agentic_ai.mcp_server:create_http_app", factory=True, host=args.host, port=args.port,
                workers=args.workers, proxy_headers=True, forwarded_allow_ips="*", log_level="info")


if __name__ == "__main__":
    main()
