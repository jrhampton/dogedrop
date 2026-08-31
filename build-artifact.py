#!/usr/bin/env python3
"""Bundle the game into one self-contained HTML file.

Inlines the CSS, every JS module, and all ten coin logos (as data URIs)
into a single page with zero external requests — handy for hosting the
game anywhere static, or pasting it somewhere that only takes one file.

Usage: python3 build-artifact.py [output.html]
"""

import base64
import pathlib
import sys

ROOT = pathlib.Path(__file__).parent
# Load order matters: coins/physics/particles/audio/storage define the
# globals that game.js uses, and main.js boots once everything exists.
MODULES = ["coins", "physics", "particles", "audio", "storage", "game", "main"]
MIMES = {".png": "image/png", ".jpg": "image/jpeg"}


def build(out_path):
    css = (ROOT / "css/style.css").read_text()
    js = {name: (ROOT / "js" / f"{name}.js").read_text() for name in MODULES}

    # Every logo coins.js references must end up inlined; a miss would leave
    # the page fetching a file that isn't there.
    expected = js["coins"].count("'assets/coins/")
    inlined = 0
    for image in sorted((ROOT / "assets/coins").iterdir()):
        if image.suffix not in MIMES:
            continue
        data = base64.b64encode(image.read_bytes()).decode()
        ref = f"'assets/coins/{image.name}'"
        if ref in js["coins"]:
            js["coins"] = js["coins"].replace(ref, f"'data:{MIMES[image.suffix]};base64,{data}'")
            inlined += 1

    if inlined != expected:
        raise SystemExit(f"coins.js references {expected} logos, only inlined {inlined}")

    # Reuse game.html's markup so the two builds can't drift apart.
    html = (ROOT / "game.html").read_text()
    body = html.split("<body>", 1)[1].split("<script src=", 1)[0].strip()

    parts = ["<title>DogeDrop</title>", "<style>", css, "</style>", body]
    parts += [f"<script>\n{js[name]}\n</script>" for name in MODULES]

    out_path.write_text("\n".join(parts) + "\n")
    print(f"wrote {out_path} ({out_path.stat().st_size / 1024:.0f} KB, {inlined} logos inlined)")


if __name__ == "__main__":
    build(pathlib.Path(sys.argv[1] if len(sys.argv) > 1 else ROOT / "dist-artifact.html"))
