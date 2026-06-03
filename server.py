from __future__ import annotations

import datetime as dt
import json
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path


ROOT = Path(__file__).resolve().parent
LOG_DIR = ROOT / "artifacts" / "runtime-logs"


class VoiceToActionHandler(SimpleHTTPRequestHandler):
    def do_POST(self) -> None:
        if self.path != "/api/run-log":
            self.send_error(404, "Not found")
            return

        length = int(self.headers.get("Content-Length", "0") or 0)
        raw_body = self.rfile.read(length)
        try:
            payload = json.loads(raw_body.decode("utf-8"))
        except json.JSONDecodeError:
            self.send_error(400, "Invalid JSON")
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

    def end_headers(self) -> None:
        self.send_header("Cache-Control", "no-store")
        super().end_headers()


if __name__ == "__main__":
    server = ThreadingHTTPServer(("0.0.0.0", 8765), VoiceToActionHandler)
    print("Serving Voice-to-Action Agent at http://localhost:8765/")
    server.serve_forever()
