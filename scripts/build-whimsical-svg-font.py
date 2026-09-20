"""Clean supplied Whimsical outlines + symmetric, automatic word ornaments.

Run with Python, Pillow, fonttools, brotli and vtracer. The SVG masters contain
paths only; the WOFF2 uses those same outlines (no bitmap/color font tables).
The runtime SVG compositor places ornaments against each rendered word's ink
bounds. Its outline data and the plain fallback font share the same geometry.
"""
from pathlib import Path
from collections import OrderedDict
import hashlib
import json
import re
import subprocess
import xml.etree.ElementTree as ET
from PIL import Image
import vtracer
from fontTools.fontBuilder import FontBuilder
from fontTools.feaLib.builder import addOpenTypeFeaturesFromString
from fontTools.pens.ttGlyphPen import TTGlyphPen
from fontTools.pens.cu2quPen import Cu2QuPen
from fontTools.pens.transformPen import TransformPen
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.boundsPen import BoundsPen
from fontTools.svgLib.path import parse_path

ROOT = Path(__file__).resolve().parent.parent
SOURCE = ROOT / 'public/generated-flyers/assets/png-glyphs/whimsical.png'
OUT = ROOT / 'public/generated-flyers/assets/whimsical-svg'
OUT.mkdir(exist_ok=True)
image = Image.open(SOURCE).convert('L')
pixels = {(x, y) for y in range(image.height) for x in range(image.width)
          if image.getpixel((x, y)) >= 128}
components = []
while pixels:
    point = pixels.pop()
    part, queue = {point}, [point]
    while queue:
        x, y = queue.pop()
        for point in ((x-1, y), (x+1, y), (x, y-1), (x, y+1)):
            if point in pixels:
                pixels.remove(point)
                part.add(point)
                queue.append(point)
    if len(part) > 30:
        components.append(part)


def bounds(part):
    return (min(x for x, y in part), min(y for x, y in part),
            max(x for x, y in part)+1, max(y for x, y in part)+1)


def component(x, y):
    return next(c for c in components if bounds(c)[:2] == (x, y))


assigned = OrderedDict()
for chars, lo, hi, baseline in [('ABCDEFGHI', 0, 154, 146),
                                ('JKLMNOPQR', 154, 303, 285),
                                ('STUVWXYZ', 303, 431, 425)]:
    parts = sorted([c for c in components if lo <= bounds(c)[1] < hi and len(c) > 1000],
                   key=lambda c: bounds(c)[0])
    assert len(parts) == len(chars), (chars, len(parts))
    for char, part in zip(chars, parts):
        assigned[char] = (part, baseline, 5.4)

# Explicit component anchors preserve overlapping swashes and detached heart dots.
lower = [(34,483), (160,432), (261,478), (352,446), (470,477), (557,447),
         (645,476), (781,441), (899,484), (960,483), (1105,443), (1197,446), (1333,477),
         (56,584), (159,589), (267,582), (390,585), (485,585), None, None,
         (813,598), (932,598), (1023,599), (1145,593), (1259,588), (1382,584)]
joined_st = component(589, 566)
for char, anchor in zip('abcdefghijklmnopqrstuvwxyz', lower):
    part = set(component(*anchor)) if anchor else {
        (x,y) for x,y in joined_st if (x <= 651 if char == 's' else x > 651)}
    if char == 'i': part.update(component(906,458))
    if char == 'j': part.update(component(1012,458))
    assigned[char] = (part, 540 if char <= 'm' else 654, 5.4)
for char, anchor in zip('0123456789', [(142,703),(278,703),(355,705),(502,704),
                       (625,703),(745,702),(883,702),(1013,705),(1127,703),(1256,706)]):
    assigned[char] = (component(*anchor), 802, 6.8)


def trace(part, name):
    x0, y0, x1, y1 = bounds(part)
    # VTracer's binary mode traces black. No source texture is carried through.
    mask = Image.new('RGBA', (x1-x0+4, y1-y0+4), 'white')
    for x,y in part: mask.putpixel((x-x0+2, y-y0+2), (0,0,0,255))
    svg = vtracer.convert_pixels_to_svg(list(mask.getdata()), mask.size,
        colormode='binary', mode='spline', filter_speckle=8,
        corner_threshold=90, length_threshold=3.5, splice_threshold=45, path_precision=2)
    paths = SVGPathPen(None)
    for node in ET.fromstring(svg).iter('{http://www.w3.org/2000/svg}path'):
        translate = re.search(r'translate\(([-\d.]+)[ ,]+([-\d.]+)\)', node.get('transform', ''))
        dx, dy = map(float, translate.groups()) if translate else (0,0)
        parse_path(node.attrib['d'], TransformPen(paths, (1,0,0,1,dx-2,dy-2)))
    path = paths.getCommands()
    (OUT / f'{name}.svg').write_text(
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="-1 -1 {x1-x0+2} {y1-y0+2}">'
        f'<path fill="currentColor" d="{path}"/></svg>\n')
    return path, (x0,y0,x1,y1)


curl, curl_bounds = trace(component(22,820), 'flourish-curl')
spray_part = component(670,856) | component(679,891) | component(709,833)
spray, spray_bounds = trace(spray_part, 'flourish-spray')
# Save the other supplied ornaments as clean SVG masters for future arrangements.
trace(component(349,829), 'flourish-heart-swash')
heart_path, heart_bounds = trace(component(1313,936), 'flourish-heart')
long_swash, long_bounds = trace(component(1008,807), 'flourish-long-swash')

font = FontBuilder(1000, isTTF=True)
glyphs, metrics, cmap, report = {}, {}, {32:'space', 160:'space'}, []


def pen():
    target = TTGlyphPen(None)
    return target, Cu2QuPen(target, max_err=0.7, reverse_direction=False)


for name in ['.notdef', 'space']:
    glyphs[name] = TTGlyphPen(None).glyph()
    metrics[name] = (320,0)


for char, (part, baseline, scale) in assigned.items():
    name = f'uni{ord(char):04X}'
    path, box = trace(part, name)
    advance = round((box[2]-box[0])*scale+36)
    target, curves = pen()
    parse_path(path, TransformPen(curves, (scale,0,0,-scale,18,(baseline-box[1])*scale)))
    glyphs[name] = target.glyph()
    glyphs[name].recalcBounds(glyphs)
    metrics[name] = (advance, glyphs[name].xMin)
    cmap[ord(char)] = name
    report.append({'character':char, 'sourceBounds':box, 'advance':advance,
                   'baseline':baseline, 'scale':scale})

# Everyday punctuation, outlined locally rather than silently falling back.
punctuation = {
    '.': ('M20 0 Q-10 0 -10 30 Q-10 60 20 60 Q50 60 50 30 Q50 0 20 0Z',110),
    ',': ('M0 -70 Q45 -10 0 0 Q-25 25 0 50 Q40 65 45 25 Q45 -30 0 -70Z',120),
    "'": ('M0 540 L40 540 L30 660 L-5 660Z',100),
    '-': ('M0 250 Q120 270 230 250 L230 225 Q100 245 0 225Z',270),
    '!': ('M40 160 L20 660 L95 660 L65 160Z M30 0 L30 70 L85 70 L85 0Z',150),
    '?': ('M0 530 Q20 710 190 660 Q340 595 195 450 Q120 390 115 220 L80 220 Q65 415 155 480 Q265 590 155 620 Q55 650 45 530Z M70 0 L70 65 L125 65 L125 0Z',300),
    '&': ('M415 90 Q340 -55 170 0 Q-10 45 40 220 Q65 295 190 370 Q325 480 295 560 Q255 650 175 565 Q105 440 440 0 L355 0 Q50 420 130 570 Q235 740 340 595 Q430 440 190 295 Q40 205 110 100 Q205 -30 365 155 L460 315 L500 285Z',530),
    '+': ('M0 260 L130 260 L130 390 L170 390 L170 260 L300 260 L300 220 L170 220 L170 90 L130 90 L130 220 L0 220Z',340),
    '/': ('M0 -60 L230 700 L270 700 L40 -60Z',310),
    ':': ('M20 0 L20 65 L85 65 L85 0Z M20 330 L20 395 L85 395 L85 330Z',140),
}
for char, (path, advance) in punctuation.items():
    name = f'uni{ord(char):04X}'
    target, curves = pen()
    parse_path(path, TransformPen(curves,(1,0,0,1,25,0)))
    glyphs[name] = target.glyph()
    glyphs[name].recalcBounds(glyphs)
    metrics[name] = (advance,glyphs[name].xMin)
    cmap[ord(char)] = name
cmap[ord('’')] = cmap[ord("'")]
cmap[ord('–')] = cmap[ord('-')]
cmap[ord('—')] = cmap[ord('-')]
font.setupGlyphOrder(list(glyphs))
font.setupCharacterMap(cmap)
font.setupGlyf(glyphs)
font.setupHorizontalMetrics(metrics)
font.setupHorizontalHeader(ascent=800,descent=-500)
font.setupNameTable({'familyName':'Whimsical SVG','styleName':'Regular',
    'uniqueFontIdentifier':'WhimsicalSVG-Regular-1','fullName':'Whimsical SVG Regular',
    'psName':'WhimsicalSVG-Regular','version':'Version 1.000'})
font.setupOS2(sTypoAscender=800,sTypoDescender=-500,usWinAscent=800,usWinDescent=500,
             sCapHeight=720,sxHeight=380)
font.setupPost()
font.setupMaxp()
profiles = {}
for char, (part, baseline, scale) in assigned.items():
    x0, _, _, _ = bounds(part)
    rows = {}
    for x,y in part:
        row = round((baseline-y)*scale/12)
        value = (x-x0)*scale+18
        lo,hi = rows.get(row,(value,value))
        rows[row] = (min(lo,value),max(hi,value))
    profiles[char] = rows
kerns = []
for a in assigned:
    for b in assigned:
        shared = profiles[a].keys() & profiles[b].keys()
        if not shared: continue
        na,nb = f'uni{ord(a):04X}',f'uni{ord(b):04X}'
        gap = min(metrics[na][0]-profiles[a][row][1]+profiles[b][row][0] for row in shared)
        value = max(-180, min(0, round(28-gap)))
        if value < -8:
            kerns.append(f'pos {na} {nb} {value};')
features = 'feature kern {\n'+'\n'.join(kerns)+'\n} kern;'
# The word compositor owns connected ornaments. Keep the loadable outline font
# plain for accurate letter measurements and fallback text rendering.
addOpenTypeFeaturesFromString(font.font, features)
font.font.flavor = 'woff2'
font.save(ROOT/'public/fonts/WhimsicalSVG.woff2')
vector_data = {'unitsPerEm':1000, 'glyphs':{}, 'kerning':{}, 'ornaments':{}}
for name, path, box in [('top',curl,curl_bounds),('bottom',long_swash,long_bounds),
                        ('heart',heart_path,heart_bounds),('burst',spray,spray_bounds)]:
    exact = BoundsPen(None)
    parse_path(path,exact)
    x0,y0,x1,y1 = exact.bounds
    normalized = SVGPathPen(None)
    parse_path(path,TransformPen(normalized,(1,0,0,1,-x0,-y0)))
    vector_data['ornaments'][name] = {'path':normalized.getCommands(), 'width':x1-x0, 'height':y1-y0}
for codepoint, name in cmap.items():
    outline = glyphs[name]
    svg_pen = SVGPathPen(None)
    outline.draw(TransformPen(svg_pen,(1,0,0,-1,0,0)), glyphs)
    exact = BoundsPen(None)
    parse_path(svg_pen.getCommands(),exact)
    char = chr(codepoint)
    record = {'path':svg_pen.getCommands(), 'advance':metrics[name][0],
              'bounds':list(exact.bounds) if exact.bounds else [0,0,metrics[name][0],0]}
    if char in assigned:
        part, baseline, scale = assigned[char]
        x0,_,_,_ = bounds(part)
        points = [((x-x0)*scale+18,(y-baseline)*scale) for x,y in part]
        lo,hi = min(y for x,y in points),max(y for x,y in points)
        lower = [(x,y) for x,y in points if y > lo+(hi-lo)*.66]
        left = min(lower,key=lambda p:p[0]);right = max(lower,key=lambda p:p[0])
        record['entry'] = [round(left[0]+8,2),round(left[1],2)]
        record['exit'] = [round(right[0]-8,2),round(right[1],2)]
        upper = [(x,y) for x,y in points if y < lo+(hi-lo)*.26]
        left = min(upper,key=lambda p:p[0]);right = max(upper,key=lambda p:p[0])
        record['topEntry'] = [round(left[0]+8,2),round(left[1],2)]
        record['topExit'] = [round(right[0]-8,2),round(right[1],2)]
    vector_data['glyphs'][char] = record
for rule in kerns:
    match = re.match(r'pos uni([0-9A-F]+) uni([0-9A-F]+) (-?\d+);',rule)
    if match:
        a,b,value = match.groups()
        vector_data['kerning'][chr(int(a,16))+chr(int(b,16))] = int(value)
(ROOT/'lib/whimsicalSvgData.json').write_text(json.dumps(vector_data,separators=(',',':'))+'\n')
(OUT/'manifest.json').write_text(json.dumps({'family':'Whimsical SVG',
    'source':str(SOURCE.relative_to(ROOT)), 'sha256':hashlib.sha256(SOURCE.read_bytes()).hexdigest(),
    'threshold':128, 'texture':False, 'layoutRecipe':'lib/whimsicalWordLayout.ts',
    'ornamentBounds':{'curl':curl_bounds,'spray':spray_bounds},
    'features':features,'glyphs':report}, indent=2)+'\n')
print('Built 62 clean SVG letters/digits, 5 ornament SVGs, runtime vector data and outline WOFF2')
subprocess.run(['node', 'scripts/build-whimsical-ink-profiles.mjs'], cwd=ROOT, check=True)
