"""Package the supplied rose-gold alphabet as a template-scoped sbix font."""
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
SOURCE_PATH = ROOT / "public/generated-flyers/assets/ladies-night-rose/night-alphabet.png"
SOURCE = Image.open(SOURCE_PATH).convert("RGBA")
W, H = SOURCE.size
ALPHA = SOURCE.getchannel("A")

ROWS = [
    ("ABCDEFGHIJKLM", 282, 434, 410, 120, [0,144,268,378,495,605,720,812,924,1000,1122,1222,1370,1536]),
    ("NOPQRSTUVWXYZ", 434, 581, 561, 120, [0,142,248,364,478,602,716,814,925,1025,1152,1273,1393,1536]),
    ("abcdefghijklm", 581, 735, 687, 120, [0,158,270,385,486,592,713,837,947,1015,1110,1258,1363,1536]),
    ("nopqrstuvwxyz", 735, 845, 790, 120, [0,161,275,387,497,592,698,811,923,1017,1151,1261,1361,1536]),
    ("0123456789", 845, 1024, 983, 120, [0,224,333,455,603,746,894,1025,1166,1305,1536]),
]


# Segment connected source ink so descending g/j and ascending t never leak
# across row crops. Preserve the original alpha and RGB around each component.
COMPONENTS=[]
seen=set()
ap=ALPHA.load()
for y in range(280,H):
    for x in range(W):
        if ap[x,y]<40 or (x,y) in seen:continue
        stack=[(x,y)];seen.add((x,y));points=[]
        while stack:
            xx,yy=stack.pop();points.append((xx,yy))
            for q in [(xx-1,yy),(xx+1,yy),(xx,yy-1),(xx,yy+1)]:
                if 0<=q[0]<W and 280<=q[1]<H and q not in seen and ap[q[0],q[1]]>=40:
                    seen.add(q);stack.append(q)
        if len(points)>60:
            xs,ys=zip(*points)
            COMPONENTS.append((min(xs),min(ys),max(xs)+1,max(ys)+1,points))

def glyph_mask(char: str,index:int,top:int,bottom:int,cuts:list[int])->Image.Image:
    left,right=cuts[index:index+2]
    candidates=[]
    for comp in COMPONENTS:
        l,t,r,b,points=comp
        overlap=max(0,min(right,r)-max(left,l))*max(0,min(bottom,b)-max(top,t))
        if overlap:candidates.append((overlap,comp))
    comp=max(candidates,key=lambda item:item[0])[1]
    chosen=[comp]
    if char=='i':chosen=[c for c in COMPONENTS if c[:4] in [(978,602,1011,632),(954,634,1026,687)]]
    if char=='g':chosen=[c for c in COMPONENTS if c[:4]==(686,611,834,737)]
    if char=='t':chosen=[c for c in COMPONENTS if c[:4]==(712,707,839,825)]
    mask=Image.new('L',(W,H));mp=mask.load()
    for l,t,r,b,points in chosen:
        split=(r-l)>1.65*(right-left)
        for x,y in points:
            if not split or left<=x<right:mp[x,y]=255
    mask=mask.filter(ImageFilter.MaxFilter(5))
    # Original antialiasing, glints and metallic pixels survive the segmentation.
    import PIL.ImageChops
    return PIL.ImageChops.multiply(mask,ALPHA)


OUT = ROOT / "public/generated-flyers/assets/png-glyphs/ladies-night-pink"
OUT.mkdir(parents=True, exist_ok=True)
FONT = FontBuilder(1000, isTTF=True)
GLYF = {}
METRICS = {}
CMAP = {32: "space"}
REPORT = {}
PROFILES = {}
STRIKE = Strike(ppem=400, resolution=72)

for name in [".notdef", "space"]:
    GLYF[name] = TTGlyphPen(None).glyph()
    METRICS[name] = (300, 0)
    STRIKE.glyphs[name] = Glyph(glyphName=name)

for chars, top, bottom, baseline, cap, cuts in ROWS:
    for index, char in enumerate(chars):
        mask = glyph_mask(char, index, top, bottom, cuts)
        box = mask.getbbox()
        if not box:
            raise RuntimeError(f"No supplied artwork found for {char}")
        l, t, r, b = box
        pad = 5
        l, t, r, b = max(0, l-pad), max(0, t-pad), min(W, r+pad), min(H, b+pad)
        rgba = SOURCE.crop((l, t, r, b))
        rgba.putalpha(mask.crop((l, t, r, b)))
        scale = 300 / cap
        rgba = rgba.resize((max(1, round(rgba.width*scale)), max(1, round(rgba.height*scale))), Image.Resampling.LANCZOS)
        rgba.save(OUT / f"u{ord(char):04X}.png")
        encoded = BytesIO()
        rgba.save(encoded, format="PNG")

        advance = max(165, round((r-l-2*pad)*scale*2.5)+34)
        glyph_name = f"uni{ord(char):04X}"
        CMAP[ord(char)] = glyph_name
        pen = TTGlyphPen(None)
        pen.moveTo((18,-420)); pen.lineTo((advance-18,-420)); pen.lineTo((advance-18,960)); pen.lineTo((18,960)); pen.closePath()
        GLYF[glyph_name] = pen.glyph()
        METRICS[glyph_name] = (advance,18)
        ox = round(10-pad*scale)
        oy = round((baseline-b)*scale)+164
        STRIKE.glyphs[glyph_name] = Glyph(glyphName=glyph_name, originOffsetX=ox, originOffsetY=oy, graphicType="png ", imageData=encoded.getvalue())

        profile = {}
        mp = mask.load()
        for y in range(t,b):
            xs=[x for x in range(l,r) if mp[x,y]>72]
            if xs:
                row=round((baseline-y)*scale/2)
                profile[row]=((min(xs)-l)*scale*2.5,(r-max(xs))*scale*2.5)
        PROFILES[glyph_name]=profile
        REPORT[char]={"sourceBounds":[l,t,r,b],"sourceBaseline":baseline,"sourceScale":scale,"advance":advance,"bitmapOffsetX":ox,"bitmapOffsetY":oy}

FONT.setupGlyphOrder(list(GLYF))
FONT.setupCharacterMap(CMAP)
FONT.setupGlyf(GLYF)
FONT.setupHorizontalMetrics(METRICS)
FONT.setupHorizontalHeader(ascent=960,descent=-420)
FONT.setupNameTable({"familyName":"Ladies Night Pink PNG","styleName":"Regular","uniqueFontIdentifier":"LadiesNightPinkPNG-1","fullName":"Ladies Night Pink PNG","psName":"LadiesNightPinkPNG","version":"Version 1.000"})
FONT.setupOS2(sTypoAscender=960,sTypoDescender=-420,usWinAscent=960,usWinDescent=420)
FONT.setupPost(); FONT.setupMaxp()
SBIX=newTable("sbix"); SBIX.version=1; SBIX.flags=1; SBIX.strikes={400:STRIKE}; FONT.font["sbix"]=SBIX

pairs=[]
for left_name,lp in PROFILES.items():
    for right_name,rp in PROFILES.items():
        gaps=sorted(lp[y][1]+rp[y][0]+28 for y in lp.keys()&rp.keys())
        if gaps:
            adjustment=round(max(-220,18-gaps[len(gaps)//4],6-gaps[0]))
            if adjustment:pairs.append(f"pos {left_name} {right_name} {adjustment};")
addOpenTypeFeaturesFromString(FONT.font,"feature kern { "+" ".join(pairs)+" } kern;")
FONT.font.flavor="woff2"
FONT.save(ROOT/"public/fonts/LadiesNightPinkPNG.woff2")
(OUT/"metrics.json").write_text(json.dumps({"family":"Ladies Night Pink PNG","source":str(SOURCE_PATH.relative_to(ROOT)),"sourceSha256":hashlib.sha256(SOURCE_PATH.read_bytes()).hexdigest(),"glyphs":REPORT,"kerningPairs":len(pairs)},indent=2)+"\n")
print(f"Built {len(REPORT)} supplied glyphs with {len(pairs)} kerning pairs.")
