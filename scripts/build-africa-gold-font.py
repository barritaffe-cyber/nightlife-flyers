"""Extract supplied Africa Gold sheets and package editable UI bitmap lettering.

Run with /tmp/offshore-font-build/bin/python scripts/build-africa-gold-font.py.
Native glyph PNGs retain source pixels; the font strike never downsamples them.
"""
from pathlib import Path
from io import BytesIO
import hashlib
import json
from math import ceil
from PIL import Image, ImageFilter, ImageChops
from fontTools.fontBuilder import FontBuilder
from fontTools.pens.ttGlyphPen import TTGlyphPen
from fontTools.feaLib.builder import addOpenTypeFeaturesFromString
from fontTools.ttLib import newTable
from fontTools.ttLib.tables.sbixStrike import Strike
from fontTools.ttLib.tables.sbixGlyph import Glyph

ROOT = Path(__file__).resolve().parent.parent
SOURCE_DIR = ROOT / 'public/generated-flyers/assets/png-glyphs'
OUT = ROOT / 'public/generated-flyers/assets/png-glyphs/africa-gold'
OUT.mkdir(parents=True, exist_ok=True)
SHEETS = ['ABCDEFGHIJKLMNOP', 'QRSTUVWXYZabcdef', 'ghijklmnopqrstuv', 'wxyz0123456789']
FONT = FontBuilder(1000, isTTF=True)
GLYF, METRICS, REPORT, PROFILES = {}, {}, {}, {}
CMAP = {32: 'space'}
PPEM = 600  # Smallest round strike retaining every supplied glyph without downsampling.
PIXEL_SCALE = PPEM / 200
UNITS_PER_PIXEL = 1000 / PPEM
STRIKE = Strike(ppem=PPEM, resolution=72)
SOURCES = []
for name in ['.notdef', 'space']:
    GLYF[name] = TTGlyphPen(None).glyph()
    METRICS[name] = (280, 0)
    STRIKE.glyphs[name] = Glyph(glyphName=name)

for sheet_index, chars in enumerate(SHEETS, 1):
    path = SOURCE_DIR / f'africa-gold{sheet_index:02d}.png'
    source = Image.open(path).convert('RGBA')
    w, h = source.size
    alpha = source.getchannel('A')
    raw = alpha.tobytes()
    seen = bytearray(w*h)
    components = [[] for _ in chars]
    # Follow actual connected ink, never cut at a rectangular cell seam.
    for start, opacity in enumerate(raw):
        if opacity < 128 or seen[start]:
            continue
        stack, points = [start], []
        seen[start] = 1
        while stack:
            pos = stack.pop()
            points.append(pos)
            x, y = pos % w, pos // w
            adjacent = []
            if x: adjacent.append(pos-1)
            if x+1<w: adjacent.append(pos+1)
            if y: adjacent.append(pos-w)
            if y+1<h: adjacent.append(pos+w)
            for nxt in adjacent:
                if not seen[nxt] and raw[nxt] >= 128:
                    seen[nxt] = 1
                    stack.append(nxt)
        if len(points) < 12:
            continue
        xs, ys = [p % w for p in points], [p // w for p in points]
        # Assign by ink overlap; a dot is retained with its cell's stem.
        votes = [0]*16
        for x,y in zip(xs,ys): votes[min(3,y*4//h)*4+min(3,x*4//w)] += 1
        cell = max(range(16), key=votes.__getitem__)
        if cell >= len(chars):
            raise ValueError(f'Unexpected artwork in empty cell on sheet {sheet_index}')
        if max(xs)-min(xs)>w*.31 or max(ys)-min(ys)>h*.32:
            raise ValueError(f'Joined characters near {chars[cell]}')
        components[cell].append(points)
    SOURCES.append({'path':str(path.relative_to(ROOT)), 'size':[w,h], 'sha256':hashlib.sha256(path.read_bytes()).hexdigest()})
    for index, char in enumerate(chars):
        groups = components[index]
        if groups:
            largest=max(map(len,groups))
            groups=[g for g in groups if len(g)>=max(24,largest*.006)]
        if not groups: raise ValueError(f'Missing glyph {char}')
        core = Image.new('L', (w,h))
        pixels = core.load()
        for group in groups:
            for pos in group: pixels[pos%w,pos//w] = 255
        bounds = core.getbbox()
        # Retain antialiasing immediately around the core; discard broad source haze.
        envelope = core.filter(ImageFilter.MaxFilter(7)).filter(ImageFilter.GaussianBlur(.35))
        clean_alpha = alpha.point(lambda a: 0 if a<12 else a)
        mask = ImageChops.multiply(clean_alpha,envelope)
        l,t,r,b = mask.getbbox()
        pad = 8
        rgba = source.crop((l-pad,t-pad,r+pad,b+pad))
        rgba.putalpha(mask.crop((l-pad,t-pad,r+pad,b+pad)))
        rgba.save(OUT / f'u{ord(char):04X}.png')
        # Shared cap height / x-height with proper descenders. Preserve aspect
        # ratios, including narrow i/l and wide m/w, independently of source cells.
        descender = 200 if char in 'gjpqy' else 0
        top = 750 if char.isupper() or char.isdigit() or char in 'bdfhijklt' else 540
        ink_height = bounds[3]-bounds[1]
        scale = (top+descender)*PPEM/1000/ink_height
        assert scale >= 1, f'{char}: do not downsample the supplied clean glyph'
        bitmap = rgba.resize((round(rgba.width*scale),round(rgba.height*scale)),Image.Resampling.LANCZOS)
        encoded = BytesIO(); bitmap.save(encoded,format='PNG')
        advance = max(150, round((bounds[2]-bounds[0])*scale*UNITS_PER_PIXEL+34))
        name = f'uni{ord(char):04X}'
        CMAP[ord(char)] = name
        ox = round(5*PIXEL_SCALE-(bounds[0]-l+pad)*scale)
        oy = round((400-descender)*PPEM/1000-(b-bounds[3]+pad)*scale)
        # Chromium clips bitmap paint at glyf outlines. Include all four edges,
        # independently of advance (spacing), with a safety margin.
        paint_right = max(advance-20, ceil(20+(ox+bitmap.width)*UNITS_PER_PIXEL)+8)
        pen = TTGlyphPen(None)
        pen.moveTo((20,-400));pen.lineTo((paint_right,-400));pen.lineTo((paint_right,1100));pen.lineTo((20,1100));pen.closePath()
        GLYF[name] = pen.glyph(); METRICS[name] = (advance,20)
        ink = bitmap.getchannel('A').getbbox()
        assert ink and ox+ink[0] >= 0, f'{char}: left paint clipping'
        assert -400+(oy+bitmap.height-ink[1])*UNITS_PER_PIXEL <= 1100, f'{char}: top paint clipping'
        assert oy+bitmap.height-ink[3] >= 0, f'{char}: bottom paint clipping'
        assert 20+(ox+ink[2])*UNITS_PER_PIXEL <= paint_right, f'{char}: right paint clipping'
        STRIKE.glyphs[name] = Glyph(glyphName=name,originOffsetX=ox,originOffsetY=oy,graphicType='png ',imageData=encoded.getvalue())
        baseline = bounds[3]-descender*PPEM/1000/scale
        profile = {}
        cp = core.load()
        for y in range(bounds[1],bounds[3]):
            xs=[x for x in range(bounds[0],bounds[2]) if cp[x,y]]
            if xs: profile[round((baseline-y)*scale*UNITS_PER_PIXEL)] = ((min(xs)-bounds[0])*scale*UNITS_PER_PIXEL,(bounds[2]-max(xs))*scale*UNITS_PER_PIXEL)
        PROFILES[name] = profile
        REPORT[char] = {'sheet':sheet_index,'cell':index,'sourceBounds':[l,t,r,b],'coreBounds':list(bounds),'sourceSize':[r-l,b-t], 'sourceScale':scale,'advance':advance,'bitmapSize':list(bitmap.size),'bitmapOffsetX':ox,'bitmapOffsetY':oy,'componentCount':len(groups),'nativeGlyph':f'u{ord(char):04X}.png'}
FONT.setupGlyphOrder(list(GLYF));FONT.setupCharacterMap(CMAP);FONT.setupGlyf(GLYF);FONT.setupHorizontalMetrics(METRICS)
FONT.setupHorizontalHeader(ascent=1100,descent=-400)
FONT.setupNameTable({'familyName':'Africa Gold PNG','styleName':'Regular','uniqueFontIdentifier':'AfricaGoldPNG-2','fullName':'Africa Gold PNG','psName':'AfricaGoldPNG','version':'Version 2.000'})
FONT.setupOS2(sTypoAscender=1100,sTypoDescender=-400,usWinAscent=1100,usWinDescent=400)
FONT.setupPost();FONT.setupMaxp()
sbix=newTable('sbix');sbix.version=1;sbix.flags=1;sbix.strikes={PPEM:STRIKE};FONT.font['sbix']=sbix
pairs=[]
for left,lp in PROFILES.items():
    for right,rp in PROFILES.items():
        gaps=sorted(lp[y][1]+rp[y][0]+28 for y in lp.keys()&rp.keys())
        if gaps:
            adjustment=round(max(-150,18-gaps[len(gaps)//4],8-gaps[0]))
            if adjustment:pairs.append(f'pos {left} {right} {adjustment};')
addOpenTypeFeaturesFromString(FONT.font,'feature kern { '+' '.join(pairs)+' } kern;')
FONT.font.flavor='woff2';FONT.save(ROOT/'public/fonts/AfricaGoldPNG.woff2')
(OUT/'metrics.json').write_text(json.dumps({'family':'Africa Gold PNG','version':2,'bitmapPpem':PPEM,'sources':SOURCES,'glyphs':REPORT,'kerningPairs':len(pairs)},indent=2)+'\n')
print(f'Built {len(REPORT)} isolated glyphs from four sheets with {len(pairs)} kerning pairs.')
