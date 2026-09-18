import json
import os
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import parse_qs, quote, urlparse
from urllib.request import Request, urlopen

ROOT = os.path.dirname(os.path.abspath(__file__))
PORT = int(os.environ.get("PORT", "5173"))


def search_duckduckgo(query):
    api_url = (
        "https://api.duckduckgo.com/?q="
        f"{quote(query)}&format=json&no_html=1&skip_disambig=1"
    )
    request = Request(api_url, headers={"User-Agent": "Spiderweb/1.0"})
    with urlopen(request, timeout=10) as response:
        data = json.loads(response.read().decode("utf-8"))

    results = []
    if data.get("AbstractText"):
        results.append(
            {
                "title": data.get("Heading") or query,
                "url": data.get("AbstractURL", ""),
                "snippet": data["AbstractText"],
            }
        )

    for topic in data.get("RelatedTopics", []):
        if topic.get("Text") and topic.get("FirstURL"):
            results.append(
                {
                    "title": topic["Text"].split(" - ", 1)[0],
                    "url": topic["FirstURL"],
                    "snippet": topic["Text"],
                }
            )
        if len(results) == 8:
            break

    return results


class SpiderwebHandler(SimpleHTTPRequestHandler):
    def do_GET(self):
        request_url = urlparse(self.path)
        if request_url.path == "/api/search":
            query = parse_qs(request_url.query).get("q", [""])[0].strip()
            if not query:
                return self.send_json(400, {"error": "Enter something to search for."})
            try:
                results = search_duckduckgo(query)
                return self.send_json(200, {"query": query, "results": results})
            except Exception:
                return self.send_json(
                    502, {"error": "The search service could not be reached."}
                )

        return super().do_GET()

    def send_json(self, status, payload):
        body = json.dumps(payload).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def log_message(self, format_string, *args):
        print(f"{self.address_string()} - {format_string % args}")


if __name__ == "__main__":
    os.chdir(ROOT)
    server = ThreadingHTTPServer(("localhost", PORT), SpiderwebHandler)
    print(f"Spiderweb is running at http://localhost:{PORT}")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nSpiderweb stopped.")
    finally:
        server.server_close()
