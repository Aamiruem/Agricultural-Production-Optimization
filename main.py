"""Start the whole AgriSmart platform with one command (Windows, macOS, Linux).

    python main.py                  everything: API + AIML, MCP, farm service, web app, dashboard
    python main.py api dashboard    only the services you name
    python main.py --list           show the services and their URLs

Press Ctrl+C to stop everything this command started. Services already running
and healthy on their port are reused, not restarted. Logs go to .devlogs/.
First time? Run `npm run setup` (installs every Python and Node dependency).
"""

from __future__ import annotations

import argparse
import json
import os
import shutil
import signal
import socket
import subprocess
import sys
import time
import urllib.error
import urllib.request
from dataclasses import dataclass, field
from pathlib import Path

ROOT = Path(__file__).resolve().parent
LOGS = ROOT / ".devlogs"
WINDOWS = os.name == "nt"
VENV_PY = ROOT / "backend" / ".venv" / ("Scripts/python.exe" if WINDOWS else "bin/python")
CORS = ",".join(f"http://localhost:{p}" for p in (5173, 5175, 5180, 8080, 8090))


@dataclass
class Service:
    name: str
    title: str
    port: int
    health: str  # path probed for {"status": "ok"}; "/" means "any 200 response"
    cwd: Path
    command: list[str]
    env: dict[str, str] = field(default_factory=dict)
    ok_statuses: tuple[str, ...] = ("ok",)
    url_path: str = ""

    @property
    def url(self) -> str:
        return f"http://localhost:{self.port}{self.url_path}"


def services(py: str, node: str | None, workers: int) -> dict[str, Service]:
    def vite(app: Path) -> list[str]:
        return [
            node or "node",
            str(app / "node_modules" / "vite" / "bin" / "vite.js"),
            "--host",
            "127.0.0.1",
            "--strictPort",
            "--port",
        ]

    web, dash = ROOT / "frontend" / "react-app", ROOT / "Dashboard"
    proxies = {
        "API_PROXY_TARGET": "http://127.0.0.1:8000",
        "FARM_PROXY_TARGET": "http://127.0.0.1:4100",
        "MCP_PROXY_TARGET": "http://127.0.0.1:8100",
        "WEB_PROXY_TARGET": "http://127.0.0.1:5175",
    }
    return {
        "api": Service(
            "api",
            "FastAPI + AIML models",
            8000,
            "/api/health",
            ROOT / "backend" / "python-fastapi",
            [py, "-m", "uvicorn", "app.main:app", "--host", "127.0.0.1", "--port", "8000", "--workers", str(workers)],
            url_path="/docs",
        ),
        "mcp": Service(
            "mcp",
            "MCP tool server",
            8100,
            "/health",
            ROOT,
            [
                py,
                "-m",
                "AIML.agentic_ai.mcp_server",
                "--transport",
                "http",
                "--host",
                "127.0.0.1",
                "--port",
                "8100",
                "--workers",
                str(workers),
            ],
            url_path="/mcp",
        ),
        "farm": Service(
            "farm",
            "Express farm service",
            4100,
            "/health",
            ROOT / "backend" / "node-express",
            [node or "node", "src/server.js"],
            env={
                "PORT": "4100",
                "MONGODB_URI": "mongodb://127.0.0.1:27017/agrioptima",
                "AGRI_API_URL": "http://127.0.0.1:8000/api",
            },
            ok_statuses=("ok", "degraded"),
            url_path="/health",
        ),  # degraded = running without MongoDB
        "web": Service("web", "React web app", 5175, "/", web, [*vite(web), "5175"], env=proxies),
        "dashboard": Service("dashboard", "Operations dashboard", 5180, "/", dash, [*vite(dash), "5180"], env=proxies),
    }


def port_open(port: int) -> bool:
    with socket.socket() as s:
        s.settimeout(0.3)
        return s.connect_ex(("127.0.0.1", port)) == 0


def healthy(svc: Service) -> bool:
    try:
        with urllib.request.urlopen(f"http://127.0.0.1:{svc.port}{svc.health}", timeout=5) as res:
            body = res.read()
    except urllib.error.HTTPError as err:  # a degraded service answers 503 with a JSON body
        body = err.read()
    except (OSError, ValueError):
        return False
    if svc.health == "/":
        return True
    try:
        return json.loads(body).get("status") in svc.ok_statuses
    except (ValueError, AttributeError):
        return False


def start(svc: Service, base_env: dict[str, str]) -> subprocess.Popen:
    LOGS.mkdir(exist_ok=True)
    log = open(LOGS / f"{svc.name}.log", "w", encoding="utf-8")  # noqa: SIM115 — kept open for the child
    kwargs = {"creationflags": subprocess.CREATE_NEW_PROCESS_GROUP} if WINDOWS else {"start_new_session": True}
    return subprocess.Popen(
        svc.command, cwd=svc.cwd, env={**base_env, **svc.env}, stdout=log, stderr=subprocess.STDOUT, **kwargs
    )


def stop(proc: subprocess.Popen) -> None:
    if proc.poll() is not None:
        return
    if WINDOWS:  # kill the whole tree (uvicorn workers, vite's esbuild)
        subprocess.run(["taskkill", "/PID", str(proc.pid), "/T", "/F"], capture_output=True)
    else:
        try:
            os.killpg(proc.pid, signal.SIGTERM)
        except ProcessLookupError:
            pass


def preflight(names: list[str], node: str | None) -> list[str]:
    problems = []
    if any(n in names for n in ("farm", "web", "dashboard")) and not node:
        problems.append("Node.js 20+ is not on PATH — install it from https://nodejs.org")
    for name, folder in (("farm", "backend/node-express"), ("web", "frontend/react-app"), ("dashboard", "Dashboard")):
        if name in names and not (ROOT / folder / "node_modules").exists():
            problems.append(f"{folder} dependencies missing — run `npm run setup`")
    return problems


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("only", nargs="*", help="api, mcp, farm, web, dashboard (default: all)")
    parser.add_argument("--workers", type=int, default=2, help="worker processes for the API and MCP server")
    parser.add_argument("--list", action="store_true", help="list services and exit")
    args = parser.parse_args(argv)

    # Use the project virtual environment even when started with the system Python.
    if VENV_PY.exists() and Path(sys.executable).resolve() != VENV_PY.resolve():
        # The child handles Ctrl+C and stops the services; this wrapper only waits for it.
        for sig_name in ("SIGINT", "SIGTERM", "SIGBREAK"):
            if hasattr(signal, sig_name):
                signal.signal(getattr(signal, sig_name), signal.SIG_IGN)
        return subprocess.call([str(VENV_PY), __file__, *(argv if argv is not None else sys.argv[1:])])
    if not VENV_PY.exists():
        print("Python environment missing — run `npm run setup` first.", file=sys.stderr)
        return 1

    node = shutil.which("node")
    catalogue = services(sys.executable, node, args.workers)
    names = args.only or list(catalogue)
    unknown = [n for n in names if n not in catalogue]
    if unknown:
        parser.error(f"unknown service(s): {', '.join(unknown)} — choose from {', '.join(catalogue)}")
    if args.list:
        for svc in catalogue.values():
            print(f"  {svc.name:10s} {svc.title:24s} {svc.url}")
        return 0
    problems = preflight(names, node)
    if problems:
        print("Cannot start:\n  - " + "\n  - ".join(problems), file=sys.stderr)
        return 1
    if "farm" in names and not port_open(27017):
        print("Note: MongoDB is not running on 127.0.0.1:27017 — farm pages will report the database as unavailable.")

    base_env = {
        **os.environ,
        "PYTHONPATH": str(ROOT),
        "ENVIRONMENT": "development",
        "CORS_ORIGINS": CORS,
        "JWT_SECRET": os.environ.get("JWT_SECRET", "dev-only-insecure-secret-change-me"),
        "FARM_SERVICE_URL": "http://127.0.0.1:4100",
        "MCP_URL": "http://127.0.0.1:8100",
    }
    started: list[subprocess.Popen] = []
    try:
        for name in names:
            svc = catalogue[name]
            if port_open(svc.port):
                if healthy(svc):
                    print(f"  ↺ {svc.title:24s} already running — reusing {svc.url}")
                    continue
                print(
                    f"Port {svc.port} is busy but {svc.title} is not answering there. Free the port and retry.",
                    file=sys.stderr,
                )
                return 1
            print(f"  … starting {svc.title}", flush=True)
            proc = start(svc, base_env)
            started.append(proc)
            deadline = time.time() + 120
            while not healthy(svc):
                if proc.poll() is not None:
                    print(f"{svc.title} exited during startup — see .devlogs/{svc.name}.log", file=sys.stderr)
                    return 1
                if time.time() > deadline:
                    print(f"{svc.title} did not become healthy — see .devlogs/{svc.name}.log", file=sys.stderr)
                    return 1
                time.sleep(1)
            print(f"  ✓ {svc.title:24s} {svc.url}", flush=True)

        print("\nAgriSmart is running. Press Ctrl+C to stop." if started else "\nEverything was already running.")
        while started:
            for proc in started:
                if proc.poll() is not None:
                    print(f"A service stopped unexpectedly (exit {proc.returncode}) — see .devlogs/.", file=sys.stderr)
                    return 1
            time.sleep(1)
        return 0
    except KeyboardInterrupt:
        return 0
    finally:
        if started:
            print("\nStopping services…")
            for proc in reversed(started):
                stop(proc)


def _interrupt(*_):
    raise KeyboardInterrupt


if __name__ == "__main__":
    if hasattr(sys.stdout, "reconfigure"):
        # UTF-8 for ✓ / ↺ on Windows consoles; line buffering so progress shows up live in pipes and logs.
        sys.stdout.reconfigure(encoding="utf-8", errors="replace", line_buffering=True)
    # Terminating the launcher (SIGTERM, Ctrl+Break) stops the services too, like Ctrl+C.
    for sig_name in ("SIGTERM", "SIGBREAK"):
        if hasattr(signal, sig_name):
            signal.signal(getattr(signal, sig_name), _interrupt)
    sys.exit(main())
