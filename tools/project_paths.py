"""Resolve maintained source and content independently of public URLs."""

from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SOURCE = ROOT / "src/generated/compatibility"
STATIC = ROOT / "static"


def project_path(*parts):
    relative = Path(*parts)
    first = relative.parts[0]
    if first == "apps-script.gs":
        return str(ROOT / "backend" / relative)
    if first == "sugya":
        return str(ROOT / "docs/research" / relative)
    if str(relative) == "data.js":
        return str(ROOT / "src/config/program.js")
    if str(relative) == "links.js":
        return str(ROOT / "src/config/links.js")
    if str(relative) == "sw.js":
        return str(ROOT / "src/service-worker.js")
    if len(relative.parts) == 1 and relative.suffix == ".js":
        return str(ROOT / "src/shared" / relative)
    if len(relative.parts) == 1 and relative.suffix == ".html":
        return str(SOURCE / relative)
    if (
        first
        in {
            "daf",
            "chav",
            "slides",
            "sfarim",
            "fonts",
            "m",
            "mh",
            "flyer",
            "guidepics",
            "joinpics",
            "weekpics",
            "vendor",
        }
        or len(relative.parts) == 1
        and relative.suffix in {".json", ".png", ".jpg"}
    ):
        return str(STATIC / relative)
    return str(ROOT / relative)
