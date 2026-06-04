from __future__ import annotations

import datetime as dt
import json
import os
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path


ROOT = Path(__file__).resolve().parent
LOG_DIR = ROOT / "artifacts" / "runtime-logs"


class VoiceToActionHandler(SimpleHTTPRequestHandler):
    def do_POST(self) -> None:
        if self.path == "/api/run-log":
            self._handle_run_log()
            return

        if self.path == "/api/llm-tool-plan":
            self._handle_llm_tool_plan()
            return

        self.send_error(404, "Not found")

    def _read_json_body(self) -> dict:
        length = int(self.headers.get("Content-Length", "0") or 0)
        raw_body = self.rfile.read(length)
        try:
            payload = json.loads(raw_body.decode("utf-8"))
        except json.JSONDecodeError:
            self.send_error(400, "Invalid JSON")
            raise
        if not isinstance(payload, dict):
            self.send_error(400, "JSON body must be an object")
            raise ValueError("JSON body must be an object")
        return payload

    def _handle_run_log(self) -> None:
        try:
            payload = self._read_json_body()
        except (json.JSONDecodeError, ValueError):
            return

        LOG_DIR.mkdir(parents=True, exist_ok=True)
        today = dt.datetime.now().strftime("%Y-%m-%d")
        log_path = LOG_DIR / f"run-log-{today}.jsonl"
        record = {
            "serverTime": dt.datetime.now().isoformat(timespec="seconds"),
            "client": self.client_address[0],
            "payload": payload,
        }
        with log_path.open("a", encoding="utf-8") as handle:
            handle.write(json.dumps(record, ensure_ascii=False) + "\n")

        self.send_response(204)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()

    def _handle_llm_tool_plan(self) -> None:
        try:
            payload = self._read_json_body()
        except (json.JSONDecodeError, ValueError):
            return

        command = str(payload.get("command") or "").strip()
        tool_names = [
            tool.get("name")
            for tool in payload.get("toolSpecs", [])
            if isinstance(tool, dict) and tool.get("name")
        ]
        missing_fields = []
        if not command:
            missing_fields.append("command")
        if not tool_names:
            missing_fields.append("toolSpecs")
        if not payload.get("worldSnapshot"):
            missing_fields.append("worldSnapshot")

        has_server_key = bool(os.environ.get("OPENAI_API_KEY"))
        response = {
            "mode": "server_proxy_dry_run",
            "serverTime": dt.datetime.now().isoformat(timespec="seconds"),
            "provider": {
                "name": "openai_responses_api",
                "configured": has_server_key,
                "keyExposedToBrowser": False,
                "status": "ready_to_call" if has_server_key else "missing_server_api_key",
            },
            "requestValidation": {
                "passed": not missing_fields,
                "missingFields": missing_fields,
            },
            "toolChoicePolicy": {
                "allowedTools": tool_names,
                "requiredFinalGate": "decide_execution_gate",
                "blockedDirectActions": ["robot_move", "pick", "place", "handoff_without_gate"],
            },
            "llmCall": {
                "executed": False,
                "reason": "This portfolio proxy is intentionally dry-run only. It validates the request boundary and lets the browser run the local deterministic fallback.",
            },
            "fallback": {
                "required": True,
                "strategy": "run_local_tool_chain_after_proxy_validation",
            },
        }

        self.send_response(200)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        self.wfile.write(json.dumps(response, ensure_ascii=False).encode("utf-8"))

    def do_OPTIONS(self) -> None:
        if self.path in {"/api/run-log", "/api/llm-tool-plan"}:
            self.send_response(204)
            self.send_header("Access-Control-Allow-Origin", "*")
            self.send_header("Access-Control-Allow-Methods", "POST, OPTIONS")
            self.send_header("Access-Control-Allow-Headers", "Content-Type")
            self.end_headers()
            return

        self.send_error(404, "Not found")

    def end_headers(self) -> None:
        self.send_header("Cache-Control", "no-store")
        super().end_headers()


if __name__ == "__main__":
    server = ThreadingHTTPServer(("0.0.0.0", 8765), VoiceToActionHandler)
    print("Serving Voice-to-Action Agent at http://localhost:8765/")
    server.serve_forever()
