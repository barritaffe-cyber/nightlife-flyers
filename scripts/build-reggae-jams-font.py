"""Package the supplied Reggae Jams script sheet as editable sbix lettering.

The source has a real alpha channel. We retain its cream/gold pixels and use
source-row cells only to assign overlapping brush strokes to their glyphs.
"""
from pathlib import Path
from io import BytesIO
import hashlib
import json

from PIL import Image, ImageFilter
from fontTools.fontBuilder import FontBuilder
from fontTools.pens.ttGlyphPen import TTGlyphPen
from fontTools.feaLib.builder import addOpenTypeFeaturesFromString
from fontTools.ttLib import newTable
from fontTools.ttLib.tables.sbixStrike import Strike
from fontTools.ttLib.tables.sbixGlyph import Glyph

ROOT = Path(__file__).resolve().parent.parent
SOURCE_PATH = ROOT / "public/generated-flyers/assets/png-glyphs/reggae script.png"
SOURCE = Image.open(SOURCE_PATH).convert("RGBA")
W, H = SOURCE.size
ALPHA = SOURCE.getchannel("A")

# The artwork is arranged in four 13-character rows and one 10-digit row.
# Shared baselines keep lowercase proportions and real descenders intact.
ROWS = [
    ("ABCDEFGHIJKLM", 18, 252, 239, 178),
    ("NOPQRSTUVWXYZ", 244, 456, 441, 175),
    ("abcdefghijklm", 449, 654, 631, 160),
    ("nopqrstuvwxyz", 650, 844, 822, 154),
    ("0123456789", 837, 1024, 1008, 150),
]


def bounds(mask: Image.Image):
    return mask.getbbox()


def glyph_mask(index: int, count: int, top: int, bottom: int) -> Image.Image:
    """Keep this cell plus its brush overhang, without importing neighbours."""
    left = round(index * W / count)
    right = round((index + 1) * W / count)
    # Core ink labels are separated from the supplied soft shadow at alpha 72.
    core = ALPHA.point(lambda a: 255 if a >= 72 else 0)
    pixels = core.load()
    seen = set()
    components = []
    # Uppercase J has a long supplied descender below the first row. Start only
    # from unmistakable first-row ink, then let that connected stroke travel
    # into the inter-row space. This avoids cutting the tail at y=252.
    scan_bottom = bottom - 10 if top == 18 else bottom
    flood_bottom = min(H, bottom + 45) if top == 18 else bottom
    for y in range(top, scan_bottom):
        for x in range(W):
            if pixels[x, y] == 0 or (x, y) in seen:
                continue
            stack = [(x, y)]
            seen.add((x, y))
            points = []
            while stack:
                px, py = stack.pop()
                points.append((px, py))
                for nx, ny in ((px - 1, py), (px + 1, py), (px, py - 1), (px, py + 1)):
                    if 0 <= nx < W and top <= ny < flood_bottom and pixels[nx, ny] and (nx, ny) not in seen:
                        seen.add((nx, ny))
                        stack.append((nx, ny))
            if len(points) >= 45:
                overlap = sum(left <= px < right for px, _ in points)
                if overlap:
                    components.append((overlap, points))

    # A glyph's main body has the strongest overlap with its nominal cell.
    # Retain smaller detached parts (i/j dots and brush flecks) when centered in it.
    # Prefer the component whose ink belongs most strongly to this cell. This
    # rejects a wide connected K/L/M swash that barely enters J's cell.
    components.sort(reverse=True, key=lambda item: item[0] / len(item[1]))
    selected = []
    if components:
        # The main brush body is one connected component. Nearby letters have
        # long swashes that enter this cell, so taking secondary components
        # would visibly splice neighbours into J, s and other narrow glyphs.
        selected.extend(components[0][1])
        # Restore the only genuinely detached supplied marks: i and j dots.
        # Their components are small and centered above the selected stem.
        if count == 13 and top == 449 and index in (8, 9):
            for overlap, points in components[1:]:
                cx = sum(px for px, _ in points) / len(points)
                cy = sum(py for _, py in points) / len(points)
                if left <= cx < right and top <= cy < top + 85:
                    selected.extend(points)

    seed = Image.new("L", (W, H))
    sp = seed.load()
    for x, y in selected:
        sp[x, y] = 255
    # Recover the supplied antialiasing and fine translucent edge texture around
    # the high-alpha body, while suppressing the beige preview field completely.
    grown = seed.filter(ImageFilter.MaxFilter(13))
    return Image.composite(ALPHA, Image.new("L", (W, H)), grown)


OUT = ROOT / "public/generated-flyers/assets/png-glyphs/reggae-jams-script"
OUT.mkdir(parents=True, exist_ok=True)
FONT = FontBuilder(1000, isTTF=True)
GLYF = {}
METRICS = {}
CMAP = {32: "space"}
REPORT = {}
PROFILES = {}
STRIKE = Strike(ppem=200, resolution=72)

for name in [".notdef", "space"]:
    GLYF[name] = TTGlyphPen(None).glyph()
    METRICS[name] = (300, 0)
    STRIKE.glyphs[name] = Glyph(glyphName=name)

for chars, top, bottom, baseline, cap in ROWS:
    for index, char in enumerate(chars):
        mask = glyph_mask(index, len(chars), top, bottom)
        box = bounds(mask)
        if not box:
            raise RuntimeError(f"No supplied artwork found for {char}")
        l, t, r, b = box
        pad = 5
        l, t, r, b = max(0, l - pad), max(0, t - pad), min(W, r + pad), min(H, b + pad)
        rgba = SOURCE.crop((l, t, r, b))
        rgba.putalpha(mask.crop((l, t, r, b)))
        scale = 150 / cap
        rgba = rgba.resize((max(1, round(rgba.width * scale)), max(1, round(rgba.height * scale))), Image.Resampling.LANCZOS)
        rgba.save(OUT / f"u{ord(char):04X}.png")
        encoded = BytesIO()
        rgba.save(encoded, format="PNG")

        advance = max(170, round((r - l - 2 * pad) * scale * 5) + 36)
        glyph_name = f"uni{ord(char):04X}"
        CMAP[ord(char)] = glyph_name
        pen = TTGlyphPen(None)
        pen.moveTo((18, -420)); pen.lineTo((advance - 18, -420)); pen.lineTo((advance - 18, 960)); pen.lineTo((18, 960)); pen.closePath()
        GLYF[glyph_name] = pen.glyph()
        METRICS[glyph_name] = (advance, 18)
        ox = round(5 - pad * scale)
        oy = round((baseline - b) * scale) + 84
        if oy < 0 or oy + rgba.height > 276:
            raise RuntimeError(f"{char}: bitmap exceeds paint box ({oy}, {rgba.height})")
        STRIKE.glyphs[glyph_name] = Glyph(glyphName=glyph_name, originOffsetX=ox, originOffsetY=oy, graphicType="png ", imageData=encoded.getvalue())

        profile = {}
        mask_pixels = mask.load()
        for y in range(t, b):
            xs = [x for x in range(l, r) if mask_pixels[x, y] > 72]
            if not xs:
                continue
            row = round((baseline - y) * scale / 2)
            profile[row] = ((min(xs) - l) * scale * 5, (r - max(xs)) * scale * 5)
        PROFILES[glyph_name] = profile
        REPORT[char] = {
            "sourceBounds": [l, t, r, b],
            "sourceBaseline": baseline,
            "sourceScale": scale,
            "advance": advance,
            "bitmapOffsetX": ox,
            "bitmapOffsetY": oy,
        }

FONT.setupGlyphOrder(list(GLYF))
FONT.setupCharacterMap(CMAP)
FONT.setupGlyf(GLYF)
FONT.setupHorizontalMetrics(METRICS)
FONT.setupHorizontalHeader(ascent=960, descent=-420)
FONT.setupNameTable({
    "familyName": "Reggae Jams Script PNG",
    "styleName": "Regular",
    "uniqueFontIdentifier": "ReggaeJamsScriptPNG-1",
    "fullName": "Reggae Jams Script PNG",
    "psName": "ReggaeJamsScriptPNG",
    "version": "Version 1.000",
})
FONT.setupOS2(sTypoAscender=960, sTypoDescender=-420, usWinAscent=960, usWinDescent=420)
FONT.setupPost(); FONT.setupMaxp()
SBIX = newTable("sbix"); SBIX.version = 1; SBIX.flags = 1; SBIX.strikes = {200: STRIKE}; FONT.font["sbix"] = SBIX

pairs = []
for left_name, lp in PROFILES.items():
    for right_name, rp in PROFILES.items():
        gaps = sorted(lp[y][1] + rp[y][0] + 30 for y in lp.keys() & rp.keys())
        if gaps:
            adjustment = round(max(-260, 22 - gaps[len(gaps) // 4], 8 - gaps[0]))
            if adjustment:
                pairs.append(f"pos {left_name} {right_name} {adjustment};")
addOpenTypeFeaturesFromString(FONT.font, "feature kern { " + " ".join(pairs) + " } kern;")
FONT.font.flavor = "woff2"
FONT.save(ROOT / "public/fonts/ReggaeJamsScriptPNG.woff2")

(OUT / "metrics.json").write_text(json.dumps({
    "family": "Reggae Jams Script PNG",
    "source": str(SOURCE_PATH.relative_to(ROOT)),
    "sourceSha256": hashlib.sha256(SOURCE_PATH.read_bytes()).hexdigest(),
    "glyphs": REPORT,
    "kerningPairs": len(pairs),
}, indent=2) + "\n")
print(f"Built {len(REPORT)} editable supplied glyphs with {len(pairs)} kerning pairs.")
