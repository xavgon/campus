#!/usr/bin/env python3
"""Gera icon.png (256×256) e icon.ico para o Electron / electron-builder."""

from __future__ import annotations

import sys
from pathlib import Path

try:
    from PIL import Image, ImageDraw, ImageFont
except ImportError:
    print("Instala Pillow: pip install pillow", file=sys.stderr)
    raise SystemExit(1)

SIZE = 256
YELLOW = (245, 197, 24, 255)  # #F5C518
BLACK = (10, 10, 10, 255)  # #0A0A0A
MARGIN = 28

ROOT = Path(__file__).resolve().parents[1]
OUT_PNG = ROOT / "build-resources" / "icon.png"
OUT_ICO = ROOT / "build-resources" / "icon.ico"
ELECTRON_PNG = ROOT / "electron" / "icon.png"


def load_font(size: int) -> ImageFont.FreeTypeFont | ImageFont.ImageFont:
    candidates = [
        "C:/Windows/Fonts/arialbd.ttf",
        "C:/Windows/Fonts/segoeuib.ttf",
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
        "/System/Library/Fonts/Supplemental/Arial Bold.ttf",
    ]
    for path in candidates:
        if Path(path).exists():
            return ImageFont.truetype(path, size)
    return ImageFont.load_default()


def draw_icon() -> Image.Image:
    img = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    draw.rectangle((MARGIN, MARGIN, SIZE - MARGIN - 1, SIZE - MARGIN - 1), fill=YELLOW)

    font = load_font(148)
    letter = "C"
    bbox = draw.textbbox((0, 0), letter, font=font)
    text_w = bbox[2] - bbox[0]
    text_h = bbox[3] - bbox[1]
    x = (SIZE - text_w) // 2 - bbox[0]
    y = (SIZE - text_h) // 2 - bbox[1] - 6
    draw.text((x, y), letter, fill=BLACK, font=font)
    return img


def save_ico(master: Image.Image, dest: Path) -> None:
    sizes = [256, 128, 64, 48, 32, 16]
    images = [master.resize((s, s), Image.Resampling.LANCZOS) for s in sizes]
    images[0].save(
        dest,
        format="ICO",
        sizes=[(s, s) for s in sizes],
        append_images=images[1:],
    )


def main() -> None:
    OUT_PNG.parent.mkdir(parents=True, exist_ok=True)
    icon = draw_icon()
    icon.save(OUT_PNG, format="PNG", optimize=True)
    icon.save(ELECTRON_PNG, format="PNG", optimize=True)
    save_ico(icon, OUT_ICO)
    print(f"OK {OUT_PNG} ({SIZE}x{SIZE})")
    print(f"OK {OUT_ICO}")
    print(f"OK {ELECTRON_PNG}")


if __name__ == "__main__":
    main()
