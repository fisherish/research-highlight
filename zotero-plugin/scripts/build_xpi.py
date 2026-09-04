from pathlib import Path
import json
import zipfile

ROOT = Path(__file__).resolve().parents[1]
manifest = json.loads((ROOT / "manifest.json").read_text(encoding="utf-8"))
version = manifest["version"]
out_dir = ROOT / "dist"
out_dir.mkdir(exist_ok=True)
out_path = out_dir / f"research-highlight-ai-{version}.xpi"

files = [
    "manifest.json",
    "bootstrap.js",
    "src/core.js",
    "src/provider.js",
    "src/annotation.js",
    "src/annotation-provider.js",
    "src/reader.js",
    "src/batch.js",
    "src/topics.js",
    "src/topics-groq.js",
    "prefs.js",
    "prefs.xhtml",
    "prefs.css",
    "locale/en-US/research-highlight-ai.ftl",
    "locale/zh-CN/research-highlight-ai.ftl",
]

with zipfile.ZipFile(out_path, "w", zipfile.ZIP_DEFLATED) as archive:
    for rel in files:
        archive.write(ROOT / rel, rel)

print(out_path)
