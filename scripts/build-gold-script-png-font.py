"""Package gold03.png as case-sensitive bitmap lettering, preserving script overhangs.
Run with Python + Pillow/fonttools/brotli. Components isolate overlapping crop boxes.
"""
from pathlib import Path
from io import BytesIO
import json
from PIL import Image
from fontTools.fontBuilder import FontBuilder
from fontTools.pens.ttGlyphPen import TTGlyphPen
from fontTools.feaLib.builder import addOpenTypeFeaturesFromString
from fontTools.ttLib import newTable
from fontTools.ttLib.tables.sbixStrike import Strike
from fontTools.ttLib.tables.sbixGlyph import Glyph
root=Path(__file__).resolve().parent.parent
source=Image.open(root/'public/generated-flyers/assets/png-glyphs/gold03.png').convert('RGB')
w,h=source.size
remaining={(x,y) for y in range(h) for x in range(w) if (lambda p:p[0]-p[2]>35 and p[1]-p[2]>15)(source.getpixel((x,y)))}
components=[]
while remaining:
 p=remaining.pop();stack=[p];points=set()
 while stack:
  x,y=stack.pop();points.add((x,y))
  for n in ((x-1,y),(x+1,y),(x,y-1),(x,y+1)):
   if n in remaining:remaining.remove(n);stack.append(n)
 if len(points)>40:components.append(points)
def bounds(points):return (min(x for x,y in points),min(y for x,y in points),max(x for x,y in points)+1,max(y for x,y in points)+1)
# Source rows share baseline and scale; lowercase retains x-height and descenders.
rows=[('ABCDEFGHI',0,195,181,160),('JKLMNOPQR',195,400,380,160),('STUVWXYZ',400,570,563,160),('abcdefghijklm',570,724,695,140),('nopqrstuvwxyz',724,876,825,140),('0123456789',876,1024,1008,128)]
assigned={};metadata={}
for chars,top,bottom,baseline,cap in rows:
 parts=sorted([c for c in components if top<=bounds(c)[1]<bottom and len(c)>500],key=lambda c:bounds(c)[0])
 assert len(parts)==len(chars),(chars,len(parts))
 for ch,points in zip(chars,parts):assigned[ch]=points;metadata[ch]=(baseline,150/cap)
# Detached dots belong to their lowercase stems.
for ch,xmin,xmax in [('i',980,1010),('j',1070,1105)]:
 for c in components:
  x,y,_,_=bounds(c)
  if xmin<=x<xmax and 600<y<645 and len(c)<500:assigned[ch]|=c
out=root/'public/generated-flyers/assets/png-glyphs/gold03';out.mkdir(exist_ok=True)
f=FontBuilder(1000,isTTF=True);glyf={};metrics={};cmap={32:'space'};report={};profiles={};strike=Strike(ppem=200,resolution=72)
for name in ['.notdef','space']:
 glyf[name]=TTGlyphPen(None).glyph();metrics[name]=(300,0);strike.glyphs[name]=Glyph(glyphName=name)
for ch,points in assigned.items():
 baseline,scale=metadata[ch];l,t,r,b=bounds(points);l-=3;t-=3;r+=3;b+=3
 im=Image.new('RGBA',(r-l,b-t));pixels=im.load()
 fringe={(x+dx,y+dy) for x,y in points for dx in range(-2,3) for dy in range(-2,3)}
 for x,y in fringe:
  if not(0<=x<w and 0<=y<h):continue
  rgb=source.getpixel((x,y));a=min(1,max(0,(max(rgb)-min(rgb)-3)/32))
  if a: pixels[x-l,y-t]=tuple(round(max(0,min(255,(v-255*(1-a))/a))) for v in rgb)+(round(a*255),)
 # Ink bounds include swashes; contour kerning permits safe optical overlap.
 advance=round((r-l-6)*scale*5)+40
 im=im.resize((round((r-l)*scale),round((b-t)*scale)),Image.Resampling.LANCZOS)
 # Codepoint filenames stay distinct on case-insensitive macOS filesystems.
 im.save(out/f'u{ord(ch):04X}.png');buf=BytesIO();im.save(buf,format='PNG')
 # sbix positioning is relative to the outline box. Reserve descent space and
 # compensate its -400-unit bottom with +80 bitmap pixels at ppem 200.
 name=f'uni{ord(ch):04X}';cmap[ord(ch)]=name
 pen=TTGlyphPen(None);pen.moveTo((20,-400));pen.lineTo((advance-20,-400));pen.lineTo((advance-20,950));pen.lineTo((20,950));pen.closePath()
 glyf[name]=pen.glyph();metrics[name]=(advance,20)
 ox=round(4-3*scale);oy=round((baseline-b)*scale)+80
 assert oy>=0 and oy+im.height<=270, f'{ch}: bitmap exceeds vertical paint bounds'
 strike.glyphs[name]=Glyph(glyphName=name,originOffsetX=ox,originOffsetY=oy,graphicType='png ',imageData=buf.getvalue())
 profile={}
 for x,y in points:
  row=round((baseline-y)*scale*5/10)
  left=(x-l-3)*scale*5;right=(r-4-x)*scale*5
  if row in profile:profile[row]=(min(profile[row][0],left),min(profile[row][1],right))
  else:profile[row]=(left,right)
 profiles[name]=profile
 report[ch]={'advance':advance,'sourceScale':scale,'sourceBaseline':baseline,'bitmapOffsetX':ox,'bitmapOffsetY':oy}
f.setupGlyphOrder(list(glyf));f.setupCharacterMap(cmap);f.setupGlyf(glyf);f.setupHorizontalMetrics(metrics);f.setupHorizontalHeader(ascent=950,descent=-400)
f.setupNameTable({'familyName':'Gold Script PNG','styleName':'Regular','uniqueFontIdentifier':'GoldScriptPNG-1','fullName':'Gold Script PNG','psName':'GoldScriptPNG','version':'Version 1.000'})
f.setupOS2(sTypoAscender=950,sTypoDescender=-400,usWinAscent=950,usWinDescent=400);f.setupPost();f.setupMaxp()
sbix=newTable('sbix');sbix.version=1;sbix.flags=1;sbix.strikes={200:strike};f.font['sbix']=sbix
pairs=[]
for a,pa in profiles.items():
 for b,pb in profiles.items():
  gaps=sorted(pa[y][1]+pb[y][0]+40 for y in pa.keys() & pb.keys())
  if gaps:
   adjustment=round(max(-240,30-gaps[len(gaps)//4],15-gaps[0]))
   if adjustment:pairs.append(f'pos {a} {b} {adjustment};')
addOpenTypeFeaturesFromString(f.font,'feature kern { '+' '.join(pairs)+' } kern;')
f.font.flavor='woff2';f.save(root/'public/fonts/GoldScriptPNG.woff2')
(out/'metrics.json').write_text(json.dumps({'glyphs':report,'kerningPairs':len(pairs)},indent=2)+'\n')
print('Built 62 distinct Gold Script PNG glyphs.')
