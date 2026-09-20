"""Package the supplied SVG outlines as an editable font (fonttools + brotli)."""
from pathlib import Path
import re
from fontTools.fontBuilder import FontBuilder
from fontTools.pens.ttGlyphPen import TTGlyphPen
from fontTools.pens.boundsPen import BoundsPen
from fontTools.pens.transformPen import TransformPen
from fontTools.svgLib.path import parse_path

root = Path(__file__).resolve().parent.parent
source = root / 'public/generated-flyers/assets/offshore-ai-traced-svg-glyphs'
font = FontBuilder(1000, isTTF=True)
glyphs, metrics, cmap = {}, {}, {}

def add(name, path=None):
    pen = TTGlyphPen(None)
    advance = 300
    if path:
        bounds = BoundsPen(None)
        parse_path(path, bounds)
        x0, y0, x1, y1 = bounds.bounds
        scale = 720 / (y1-y0)
        parse_path(path, TransformPen(pen, (scale, 0, 0, -scale, 12-x0*scale, y1*scale)))
        advance = round((x1-x0)*scale+24)
    glyphs[name] = pen.glyph()
    metrics[name] = (advance, 12 if path else 0)

add('.notdef', 'M 30 0 L 270 0 L 270 720 L 30 720 Z M 60 30 L 60 690 L 240 690 L 240 30 Z')
add('space')
cmap[32] = 'space'
for key in list('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789') + ['O-palm']:
    svg = (source / (key+'.svg')).read_text()
    path = re.search(r'<path\s+d="([^"]+)"', svg).group(1)
    if key == 'O-palm':
        # The supplied crop includes two disconnected strips of adjacent letters.
        contours = re.findall(r'M[^M]+', path)
        assert len(contours) >= 3 and contours[0].startswith('M 185 13') and contours[1].startswith('M 0 13')
        path = ' '.join(contours[2:])
    add(key, path)
    if len(key) == 1:
        cmap[ord(key)] = key
        if key.isalpha(): cmap[ord(key.lower())] = key
cmap[ord('O')] = 'O-palm'
# Basic separators remain available without borrowing a system font.
for char, name, path in [('.', 'period', 'M 0 0 L 70 0 L 70 70 L 0 70 Z'), ('-', 'hyphen', 'M 0 0 L 250 0 L 250 50 L 0 50 Z')]:
    # Build punctuation at native dimensions rather than normalizing cap height.
    pen = TTGlyphPen(None)
    parse_path(path, TransformPen(pen, (1,0,0,1,12,300 if char=='-' else 0)))
    glyphs[name]=pen.glyph(); metrics[name]=(274 if char=='-' else 94,12); cmap[ord(char)]=name
font.setupGlyphOrder(list(glyphs))
font.setupCharacterMap(cmap)
font.setupGlyf(glyphs)
font.setupHorizontalMetrics(metrics)
font.setupHorizontalHeader(ascent=850, descent=-150)
font.setupNameTable({'familyName':'Offshore SVG','styleName':'Regular','uniqueFontIdentifier':'OffshoreSVG-Regular-1','fullName':'Offshore SVG Regular','psName':'OffshoreSVG-Regular','version':'Version 1.000'})
font.setupOS2(sTypoAscender=850,sTypoDescender=-150,usWinAscent=850,usWinDescent=150,sCapHeight=720,sxHeight=720)
font.setupPost()
font.setupMaxp()
font.font.flavor='woff2'
font.save(root / 'public/fonts/OffshoreSVG.woff2')
print('Built Offshore SVG: A–Z, 0–9; o plain, O palm')
