import base64
import json
import mimetypes
from pathlib import Path

root = Path(__file__).resolve().parents[1]
web = root
output = root / "dist" / "server"
output.mkdir(parents=True, exist_ok=True)
assets = {
    file.name: [mimetypes.guess_type(file.name)[0] or "application/octet-stream",
                base64.b64encode(file.read_bytes()).decode("ascii")]
    for file in sorted(web.iterdir()) if file.is_file()
}
seeds = json.loads((web / "artists.json").read_text())
for event in seeds:
    if event["image"] not in assets:
        raise ValueError(f"Missing catalogue image for {event['name']}")
handler = (root / "server" / "handler.mjs").read_text()
(output / "index.js").write_text(f"const assets = {json.dumps(assets)};\nconst seeds = {json.dumps(seeds)};\n{handler}")
