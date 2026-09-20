"""Package four supplied sheets into an isolated, template-only bitmap family."""
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
SOURCE_DIR = ROOT / 'public/generated-flyers/assets'
OUT = ROOT / 'public/generated-flyers/assets/png-glyphs/bad-girls'
OUT.mkdir(parents=True, exist_ok=True)
SHEETS = ['ABCDEFGHIJKLMNOP', 'QRSTUVWXYZabcdef', 'ghijklmnopqrstuv', 'wxyz0123456789']
FONT = FontBuilder(1000, isTTF=True)
GLYF, METRICS, REPORT, PROFILES = {}, {}, {}, {}
CMAP = {32: 'space'}
STRIKE = Strike(ppem=400, resolution=72)
SOURCES = []
for name in ['.notdef', 'space']:
    GLYF[name] = TTGlyphPen(None).glyph()
    METRICS[name] = (280, 0)
    STRIKE.glyphs[name] = Glyph(glyphName=name)

for sheet_index, chars in enumerate(SHEETS, 1):
    path = SOURCE_DIR / f'bad-g{sheet_index:02d}.png'
    source = Image.open(path).convert('RGBA')
    w, h = source.size
    alpha = source.getchannel('A')
    rgb = source.load()
    core_alpha = alpha.copy()
    cp = core_alpha.load()
    for y in range(h):
        for x in range(w):
            if rgb[x,y][1] < 65: cp[x,y] = 0
    raw = core_alpha.tobytes()
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
        # User-requested neutral white BAD: remove colored red source fringe
        # through coverage, preserving the pale brush core and its distress.
        pixels=rgba.load()
        for yy in range(rgba.height):
            for xx in range(rgba.width):
                rr,gg,bb,aa=pixels[xx,yy]
                coverage=min(1,max(0,(min(gg,bb)-30)/130))
                pixels[xx,yy]=(255,255,255,round(aa*coverage))
        rgba.save(OUT / f'u{ord(char):04X}.png')
        ink_height = bounds[3]-bounds[1]
        if char.isupper() or char.isdigit() or char in 'bdhkl':
            ascender, descender = 750, 0
        elif char in 'ij':
            ascender, descender = 690, (210 if char=='j' else 0)
        elif char == 'f':
            ascender, descender = 750, 110
        elif char in 'gpqy':
            ascender, descender = 490, 215
        else:
            ascender, descender = 490, 0
        scale = (ascender+descender)*.4/ink_height
        bitmap = rgba.resize((round(rgba.width*scale),round(rgba.height*scale)),Image.Resampling.LANCZOS)
        encoded = BytesIO(); bitmap.save(encoded,format='PNG')
        advance = max(150, round((bounds[2]-bounds[0])*scale*2.5)+34)
        name = f'uni{ord(char):04X}'
        CMAP[ord(char)] = name
        ox = round(10-(bounds[0]-l+pad)*scale)
        oy = round(164-descender*.4-(b-bounds[3]+pad)*scale)
        # Chromium clips sbix paint to the glyf outline. Advance is spacing,
        # not paint width: slanted brush strokes extend beyond that advance.
        # Keep the original origin/bearing/baseline and expand only the right
        # paint boundary to include the entire bitmap plus a safety margin.
        paint_right = max(advance-18, ceil(18+(ox+bitmap.width)*2.5)+8)
        pen = TTGlyphPen(None)
        pen.moveTo((18,-420));pen.lineTo((paint_right,-420));pen.lineTo((paint_right,960));pen.lineTo((18,960));pen.closePath()
        GLYF[name] = pen.glyph(); METRICS[name] = (advance,18)
        ink = bitmap.getchannel('A').getbbox()
        assert ink and ox+ink[0] >= 0, f'{char}: left paint clipping'
        assert -420+(oy+bitmap.height-ink[1])*2.5 <= 960, f'{char}: top paint clipping'
        assert oy+bitmap.height-ink[3] >= 0, f'{char}: bottom paint clipping'
        STRIKE.glyphs[name] = Glyph(glyphName=name,originOffsetX=ox,originOffsetY=oy,graphicType='png ',imageData=encoded.getvalue())
        baseline = bounds[3]-descender/(ascender+descender)*ink_height
        profile = {}
        cp = core.load()
        for y in range(bounds[1],bounds[3]):
            xs=[x for x in range(bounds[0],bounds[2]) if cp[x,y]]
            if xs: profile[round((baseline-y)*scale*2.5)] = ((min(xs)-bounds[0])*scale*2.5,(bounds[2]-max(xs))*scale*2.5)
        PROFILES[name] = profile
        REPORT[char] = {'sheet':sheet_index,'cell':index,'sourceBounds':[l,t,r,b],'coreBounds':list(bounds),'sourceSize':[r-l,b-t], 'sourceScale':scale,'advance':advance,'ascender':ascender,'descender':descender,'bitmapOffsetX':ox,'bitmapOffsetY':oy,'componentCount':len(groups),'nativeGlyph':f'u{ord(char):04X}.png'}
FONT.setupGlyphOrder(list(GLYF));FONT.setupCharacterMap(CMAP);FONT.setupGlyf(GLYF);FONT.setupHorizontalMetrics(METRICS)
FONT.setupHorizontalHeader(ascent=960,descent=-420)
FONT.setupNameTable({'familyName':'Bad Girls Brush PNG','styleName':'Regular','uniqueFontIdentifier':'BadGirlsBrushPNG-3','fullName':'Bad Girls Brush PNG','psName':'BadGirlsBrushPNG','version':'Version 1.003'})
FONT.setupOS2(sTypoAscender=960,sTypoDescender=-420,usWinAscent=960,usWinDescent=420)
FONT.setupPost();FONT.setupMaxp()
sbix=newTable('sbix');sbix.version=1;sbix.flags=1;sbix.strikes={400:STRIKE};FONT.font['sbix']=sbix
pairs=[]
for left,lp in PROFILES.items():
    for right,rp in PROFILES.items():
        gaps=sorted(lp[y][1]+rp[y][0]+28 for y in lp.keys()&rp.keys())
        if gaps:
            adjustment=round(max(-150,18-gaps[len(gaps)//4],8-gaps[0]))
            if adjustment:pairs.append(f'pos {left} {right} {adjustment};')
addOpenTypeFeaturesFromString(FONT.font,'feature kern { '+' '.join(pairs)+' } kern;')
FONT.font.flavor='woff2';FONT.save(ROOT/'public/fonts/BadGirlsBrushPNG.woff2')
(OUT/'metrics.json').write_text(json.dumps({'family':'Bad Girls Brush PNG','version':3,'sources':SOURCES,'glyphs':REPORT,'kerningPairs':len(pairs)},indent=2)+'\n')
print(f'Built {len(REPORT)} isolated glyphs from four sheets with {len(pairs)} kerning pairs.')
# A second paint of the same extracted shapes supports the target's pink GIRLS
# without changing the original input sheets or flattening words into images.
for glyph in STRIKE.glyphs.values():
    if not glyph.imageData: continue
    bitmap=Image.open(BytesIO(glyph.imageData)).convert('RGBA')
    px=bitmap.load()
    for y in range(bitmap.height):
        for x in range(bitmap.width):
            r,g,b,a=px[x,y]
            light=1
            px[x,y]=(round(255*light),round(18*light),round(72*light),a)
    encoded=BytesIO();bitmap.save(encoded,format='PNG');glyph.imageData=encoded.getvalue()
FONT.setupNameTable({'familyName':'Bad Girls Pink PNG','styleName':'Regular','uniqueFontIdentifier':'BadGirlsPinkPNG-3','fullName':'Bad Girls Pink PNG','psName':'BadGirlsPinkPNG','version':'Version 1.003'})
FONT.save(ROOT/'public/fonts/BadGirlsPinkPNG.woff2')
