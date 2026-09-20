"""Package the supplied gold sheet as a bitmap font; no AI rendering at runtime.
Requires fonttools, brotli and pillow. Source PNG remains unchanged.
"""
from pathlib import Path
from io import BytesIO
from collections import deque
from PIL import Image
import json
import argparse
from fontTools.feaLib.builder import addOpenTypeFeaturesFromString
from fontTools.fontBuilder import FontBuilder
from fontTools.pens.ttGlyphPen import TTGlyphPen
from fontTools.ttLib import newTable
from fontTools.ttLib.tables.sbixStrike import Strike
from fontTools.ttLib.tables.sbixGlyph import Glyph
root=Path(__file__).resolve().parent.parent
parser=argparse.ArgumentParser()
parser.add_argument('--collection',choices=['gold01','neon01','gold02'],default='gold01')
collection=parser.parse_args().collection
family={'gold01':'Gold PNG','neon01':'Red Neon PNG','gold02':'Gold Serif PNG'}[collection]
font_name={'gold01':'GoldPNG','neon01':'RedNeonPNG','gold02':'GoldSerifPNG'}[collection]
sheet=Image.open(root/f'public/generated-flyers/assets/png-glyphs/{collection}.png').convert('RGB')
out=root/f'public/generated-flyers/assets/png-glyphs/{collection}';out.mkdir(exist_ok=True)
rows=[('ABCDEFGHIJ',[58,212,361,514,652,800,945,1095,1241,1325,1472],310,490),('KLMNOPQRS',[61,198,350,508,687,818,990,1148,1323,1467],492,669),('TUWXYZ',[151,292,466,670,842,1015,1200,1350],670,835),('0123456789',[40,180,285,429,571,728,876,1020,1173,1327,1480],837,1007)]
# Third row contains T U V W X Y Z; crop boundaries match the supplied sheet.
rows[2]=('TUVWXYZ',[150,285,443,620,827,1020,1210,1360],670,835)
caps={310:(323,480),492:(503,656),670:(674,827),837:(850,990)}
if collection=='neon01':
 rows=[('ABCDEFGHI',[85,257,411,562,715,857,985,1145,1320,1410],30,282),('JKLMNOPQR',[35,188,347,480,682,854,1011,1167,1333,1500],284,529),('STUVWXYZ',[80,230,382,536,706,948,1115,1280,1440],530,759),('0123456789',[30,184,293,439,586,747,898,1052,1193,1340,1500],759,995)]
 caps={30:(53,270),284:(300,510),530:(539,745),759:(775,962)}
if collection=='gold02':
 rows=[('ABCDEFGHI',[35,230,392,553,732,895,1033,1211,1400,1500],60,290),('JKLMNOPQR',[24,158,336,479,684,837,1000,1152,1327,1510],300,531),('STUVWXYZ',[30,186,349,507,710,944,1137,1314,1490],532,732),('0123456789',[25,196,299,438,580,737,876,1038,1191,1340,1505],735,956)]
 caps={60:(87,277),300:(316,497),532:(537,713),735:(754,932)}
f=FontBuilder(1000,isTTF=True);glyf={};metrics={};cmap={};profiles={};report={};strike=Strike(ppem=200,resolution=72)
for name in ['.notdef','space']:
 p=TTGlyphPen(None);glyf[name]=p.glyph();metrics[name]=(300,0);strike.glyphs[name]=Glyph(glyphName=name)
cmap[32]='space'
for chars,xs,y0,y1 in rows:
 for i,ch in enumerate(chars):
  im=sheet.crop((xs[i],y0,xs[i+1],y1)).convert('RGBA');w,h=im.size;px=im.load()
  seen=set();q=deque([(x,0) for x in range(w)]+[(x,h-1) for x in range(w)]+[(0,y) for y in range(h)]+[(w-1,y) for y in range(h)])
  q.extend((x,y) for y in range(h) for x in range(w) if max(px[x,y][:3])<=8)
  while q:
   x,y=q.popleft()
   if (x,y) in seen or not(0<=x<w and 0<=y<h):continue
   r,g,b,_=px[x,y]
   if max(r,g,b)>70:continue
   seen.add((x,y));a=max(r,g,b)/70
   px[x,y]=(round(r/a) if a else 0,round(g/a) if a else 0,round(b/a) if a else 0,round(255*a))
   q.extend(((x-1,y),(x+1,y),(x,y-1),(x,y+1)))
  # Set near-black exterior fully transparent; preserve enclosed material shadows.
  for x,y in seen:
   r,g,b,a=px[x,y]
   if a<12:px[x,y]=(0,0,0,0)
  # Measure solid letter ink, never the glow, for horizontal advances.
  cap_top,baseline=caps[y0]
  scale=150/(baseline-cap_top)
  ink=[]
  for y in range(max(0,cap_top-y0),min(h,baseline-y0+1)):
   ink.append([x for x in range(w) if max(sheet.getpixel((xs[i]+x,y0+y)))>115])
  counts=[sum(x in line for line in ink) for x in range(w)]
  solid=[x for x,n in enumerate(counts) if n>=max(4,len(ink)*.06)]
  left,right=min(solid),max(solid)+1
  advance=round((right-left)*scale*5)+40
  # All letters in a source row share one scale and baseline. Q retains its tail.
  im=im.resize((round(w*scale),round(h*scale)),Image.Resampling.LANCZOS)
  im.save(out/(ch+'.png'));buf=BytesIO();im.save(buf,format='PNG')
  # sbix paint is clipped to the fallback glyph outline in Chromium. Keep
  # advances, bearings and baseline intact; allow the full right overhang.
  paint_right=max(advance-20,(round(4-left*scale)+im.width)*5+10) if collection=='gold02' else advance-20
  p=TTGlyphPen(None);p.moveTo((20,0));p.lineTo((paint_right,0));p.lineTo((paint_right,750));p.lineTo((20,750));p.closePath()
  glyf[ch]=p.glyph();metrics[ch]=(advance,20)
  profile=[]
  for row in ink:
   if len(row)>=3:profile.append(((min(row)-left)*scale*5,(right-1-max(row))*scale*5))
   else:profile.append(None)
  profiles[ch]=[profile[min(len(profile)-1,round(t*(len(profile)-1)/99))] for t in range(100)]
  report[ch]={'advance':advance,'sideBearing':20,'capHeight':750,'sourceScale':scale,'bitmapOffsetX':round(4-left*scale),'bitmapOffsetY':round((baseline-y1)*scale)}
  cmap[ord(ch)]=ch
  if ch.isalpha():cmap[ord(ch.lower())]=ch
  strike.glyphs[ch]=Glyph(glyphName=ch,originOffsetX=round(4-left*scale),originOffsetY=round((baseline-y1)*scale),graphicType='png ',imageData=buf.getvalue())
rename=lambda n: 'glyph_'+n if len(n)==1 else n
glyf={rename(k):v for k,v in glyf.items()};metrics={rename(k):v for k,v in metrics.items()};cmap={k:rename(v) for k,v in cmap.items()}
for glyph in strike.glyphs.values():glyph.glyphName=rename(glyph.glyphName)
strike.glyphs={rename(k):v for k,v in strike.glyphs.items()}
f.setupGlyphOrder(list(glyf));f.setupCharacterMap(cmap);f.setupGlyf(glyf);f.setupHorizontalMetrics(metrics);f.setupHorizontalHeader(ascent=850,descent=-150)
f.setupNameTable({'familyName':family,'styleName':'Regular','uniqueFontIdentifier':font_name+'-2','fullName':family,'psName':font_name,'version':'Version 2.000'})
f.setupOS2(sTypoAscender=850,sTypoDescender=-150,usWinAscent=850,usWinDescent=150);f.setupPost();f.setupMaxp();sbix=newTable('sbix');sbix.version=1;sbix.flags=1;sbix.strikes={200:strike};f.font['sbix']=sbix
pairs=[]
for a,pa in profiles.items():
 for b,pb in profiles.items():
  gaps=sorted(x[1]+y[0]+40 for x,y in zip(pa,pb) if x and y)
  if not gaps:continue
  # Optical tightening bounded by a minimum solid-ink clearance.
  adjustment=round(max(-80,40-gaps[len(gaps)//4],12-gaps[0]))
  if adjustment: pairs.append(f'pos glyph_{a} glyph_{b} {adjustment};')
addOpenTypeFeaturesFromString(f.font,'feature kern { '+' '.join(pairs)+' } kern;')
(out/'metrics.json').write_text(json.dumps({'glyphs':report,'kerningPairs':len(pairs)},indent=2)+'\n')
f.font.flavor='woff2';f.save(root/f'public/fonts/{font_name}.woff2')
print(f'Built {family} bitmap glyphs; punctuation not supplied.')
