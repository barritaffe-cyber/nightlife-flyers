"""Package four supplied sheets into an isolated, template-only bitmap family."""
from pathlib import Path
from io import BytesIO
import hashlib
import json
from PIL import Image, ImageFilter, ImageChops
from fontTools.fontBuilder import FontBuilder
from fontTools.pens.ttGlyphPen import TTGlyphPen
from fontTools.feaLib.builder import addOpenTypeFeaturesFromString
from fontTools.ttLib import newTable
from fontTools.ttLib.tables.sbixStrike import Strike
from fontTools.ttLib.tables.sbixGlyph import Glyph

ROOT = Path(__file__).resolve().parent.parent
SOURCE_DIR = ROOT / 'public/generated-flyers/assets/ladies-night-rose/replacement-sheets'
OUT = ROOT / 'public/generated-flyers/assets/png-glyphs/ladies-night-rose'
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
    path = SOURCE_DIR / f'sheet-{sheet_index}.png'
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
        if len(points) < 90:
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
        if not groups: raise ValueError(f'Missing glyph {char}')
        core = Image.new('L', (w,h))
        pixels = core.load()
        for group in groups:
            for pos in group: pixels[pos%w,pos//w] = 255
        bounds = core.getbbox()
        # Retain antialiasing immediately around the core; discard broad source haze.
        envelope = core.filter(ImageFilter.MaxFilter(5)).filter(ImageFilter.GaussianBlur(.35))
        clean_alpha = alpha.point(lambda a: 0 if a<12 else a)
        mask = ImageChops.multiply(clean_alpha,envelope)
        l,t,r,b = mask.getbbox()
        pad = 8
        rgba = source.crop((l-pad,t-pad,r+pad,b+pad))
        rgba.putalpha(mask.crop((l-pad,t-pad,r+pad,b+pad)))
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
        pen = TTGlyphPen(None)
        pen.moveTo((18,-420));pen.lineTo((advance-18,-420));pen.lineTo((advance-18,960));pen.lineTo((18,960));pen.closePath()
        GLYF[name] = pen.glyph(); METRICS[name] = (advance,18)
        ox = round(10-(bounds[0]-l+pad)*scale)
        oy = round(164-descender*.4-(b-bounds[3]+pad)*scale)
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
FONT.setupNameTable({'familyName':'Ladies Rose Gold PNG','styleName':'Regular','uniqueFontIdentifier':'LadiesRoseGoldPNG-3','fullName':'Ladies Rose Gold PNG','psName':'LadiesRoseGoldPNG','version':'Version 3.000'})
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
FONT.font.flavor='woff2';FONT.save(ROOT/'public/fonts/LadiesRoseGoldPNG.woff2')
(OUT/'metrics.json').write_text(json.dumps({'family':'Ladies Rose Gold PNG','version':3,'sources':SOURCES,'glyphs':REPORT,'kerningPairs':len(pairs)},indent=2)+'\n')
print(f'Built {len(REPORT)} isolated glyphs from four sheets with {len(pairs)} kerning pairs.')
