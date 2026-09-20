"""Package supplied black-backed or transparent sheets as editable bitmap fonts.
Run with Python + Pillow/fonttools/brotli. Components isolate overlapping crop boxes.
"""
from pathlib import Path
from io import BytesIO
import json
import argparse
from PIL import Image
from fontTools.fontBuilder import FontBuilder
from fontTools.pens.ttGlyphPen import TTGlyphPen
from fontTools.feaLib.builder import addOpenTypeFeaturesFromString
from fontTools.ttLib import newTable
from fontTools.ttLib.tables.sbixStrike import Strike
from fontTools.ttLib.tables.sbixGlyph import Glyph
root=Path(__file__).resolve().parent.parent
parser=argparse.ArgumentParser()
parser.add_argument('collection',choices=['rainbow','gold-whimsical','fur','afro01','grunge01','future01','future02','chrome'])
collection=parser.parse_args().collection
family,font_name={'future02':('Future 02 PNG','Future02PNG'),'chrome':('Chrome PNG','ChromePNG'),'future01':('Future PNG','FuturePNG'),'grunge01':('Grunge PNG','GrungePNG'),'afro01':('Afro PNG','AfroPNG'),'rainbow':('Rainbow PNG','RainbowPNG'),'gold-whimsical':('Gold Whimsical PNG','GoldWhimsicalPNG'),'fur':('Pink Fur PNG','PinkFurPNG')}[collection]
source=Image.open(root/f'public/generated-flyers/assets/png-glyphs/{collection}.png').convert('RGBA' if collection in ('afro01','grunge01','future01') else 'RGB')
w,h=source.size
remaining={(x,y) for y in range(h) for x in range(w) if (source.getpixel((x,y))[3]>40 if collection in ('afro01','grunge01','future01') else max(source.getpixel((x,y)))>(150 if collection=='fur' else 65))}
components=[]
while remaining:
 p=remaining.pop();stack=[p];points=set()
 while stack:
  x,y=stack.pop();points.add((x,y))
  for n in ((x-1,y),(x+1,y),(x,y-1),(x,y+1)):
   if n in remaining:remaining.remove(n);stack.append(n)
 if len(points)>40:components.append(points)
def bounds(points):return (min(x for x,y in points),min(y for x,y in points),max(x for x,y in points)+1,max(y for x,y in points)+1)
# Source-row cap heights and baselines preserve lowercase proportions.
if collection=='chrome':
 rows=[('ABCDEFGHI',0,160,140,107),('JKLMNOPQR',160,300,278,109),('STUVWXYZ',300,440,420,109),('abcdefghi',440,580,568,115),('jklmnopqr',580,720,705,114),('stuvwxyz',720,870,837,114),('0123456789',870,1024,990,114)]
elif collection in ('future01','future02'):
 rows=[] # Disconnected strokes are grouped using explicit source cells below.
elif collection=='grunge01':
 rows=[('ABCDEGHIJKLM',0,240,219,178),('NOPQRSTUVWXYZ',240,453,422,170),('abcdefghijklm',453,640,610,157),('nopqrstuvwxyz',640,820,783,157),('0123456789',820,1024,994,169)]
elif collection=='afro01':
 rows=[('ABCDEFGHI',0,290,278,250),('JKLMNOPQR',290,560,535,231),('STUVWXYZ',560,800,783,222),('0123456789',800,1024,994,187)]
elif collection=='rainbow':
 rows=[('ABCDEFGHI',0,280,256,157),('JKLMNOPQR',280,490,455,150),('STUVWXYZ',490,700,658,150),('0123456789',700,1024,891,158)]
elif collection=='gold-whimsical':
 rows=[('ABCDEFGHIJKLM',0,260,205,145),('NOPQRSTUVWXYZ',260,454,421,145),('abcdefghijklm',454,650,604,140),('nopqrstuvwxyz',650,825,769,140),('0123456789',825,1024,974,143)]
 # K and L touch at the baseline in this sheet; split their shared component.
 merged=next(c for c in components if bounds(c)[0]==1151 and bounds(c)[1]==20)
 components.remove(merged)
 components.extend([{(x,y) for x,y in merged if x<1257},{(x,y) for x,y in merged if x>=1257}])
else:
 rows=[('ABCDEFGHIJKLM',0,240,228,170),('NOPQRSTUVWXYZ',240,430,409,156),('abcdefghijklm',430,609,600,162),('nopqrstuvwxyz',609,782,751,162),('0123456789',782,1024,963,178)]
assigned={};metadata={}
for chars,top,bottom,baseline,cap in rows:
 parts=sorted([c for c in components if top<=bounds(c)[1]<bottom and len(c)>(3000 if collection=='fur' else 1000)],key=lambda c:bounds(c)[0])
 assert len(parts)==len(chars),(collection,chars,len(parts))
 for ch,points in zip(chars,parts):assigned[ch]=points;metadata[ch]=(baseline,150/cap)
# Future's letters have disconnected parallel strokes and dots. Preserve all
# alpha-bearing pieces in each cell instead of selecting one connected shape.
if collection=='future01':
 cells=[
  ('ABCDEFGHI',[30,220,402,595,784,949,1105,1286,1462,1520],15,186,168,141),
  ('JKLMNOPQR',[20,163,321,480,680,832,1018,1168,1353,1512],187,358,341,142),
  ('STUVWXYZ',[40,206,372,543,728,964,1152,1334,1501],359,532,513,141),
  ('abcdefghijklm',[25,146,272,395,526,655,750,883,1007,1055,1152,1280,1343,1510],536,708,674,124),
  ('nopqrstuvwxyz',[24,138,266,396,520,614,718,810,922,1036,1203,1312,1419,1514],710,849,813,124),
  ('0123456789',[30,198,292,451,601,765,921,1060,1207,1357,1510],850,1010,986,126),
 ]
 for chars,xs,top,bottom,baseline,cap in cells:
  for i,ch in enumerate(chars):
   points={(x,y) for y in range(top,bottom) for x in range(xs[i],xs[i+1]) if source.getpixel((x,y))[3]>40}
   assert points,(collection,ch)
   assigned[ch]=points;metadata[ch]=(baseline,150/cap)
# Future 02 uses a black matte and disconnected white outline strokes.
if collection=='future02':
 cells=[
  ('ABCDEFGHIJKLM',[62,193,300,438,562,661,758,900,1015,1058,1150,1267,1362,1510],58,224,210,142),
  ('NOPQRSTUVWXYZ',[50,165,304,407,541,648,750,846,952,1066,1210,1318,1430,1540],255,416,404,137),
  ('0123456789',[240,355,430,548,660,780,893,1008,1114,1230,1345],450,610,596,136),
 ]
 for chars,xs,top,bottom,baseline,cap in cells:
  for i,ch in enumerate(chars):
   points={(x,y) for y in range(top,bottom) for x in range(xs[i],xs[i+1]) if max(source.getpixel((x,y)))>65}
   assert points,(collection,ch)
   assigned[ch]=points;metadata[ch]=(baseline,150/cap)
# The supplied Grunge sheet omits F. User requested deriving it from E.
if collection=='grunge01':
 assigned['F']={(x,y) for x,y in assigned['E'] if y<148 or x<597}
 metadata['F']=metadata['E']
if collection in ('gold-whimsical','fur'):
 for ch,xmin,xmax in [('i',980,1040),('j',1050,1120)]:
  for c in components:
   x,y,_,_=bounds(c)
   if xmin<=x<xmax and (430 if collection=='fur' else 470)<y<515 and len(c)<(3000 if collection=='fur' else 1000):assigned[ch]|=c
if collection=='chrome':
 for ch,xmin,xmax,top,bottom in [('i',900,950,440,483),('j',80,125,580,620)]:
  for c in components:
   x,y,_,_=bounds(c)
   if xmin<=x<xmax and top<=y<bottom and len(c)<1000:assigned[ch]|=c
out=root/f'public/generated-flyers/assets/png-glyphs/{collection}';out.mkdir(exist_ok=True)
f=FontBuilder(1000,isTTF=True);glyf={};metrics={};cmap={32:'space'};report={};profiles={};strike=Strike(ppem=200,resolution=72)
for name in ['.notdef','space']:
 glyf[name]=TTGlyphPen(None).glyph();metrics[name]=(300,0);strike.glyphs[name]=Glyph(glyphName=name)
for ch,points in assigned.items():
 baseline,scale=metadata[ch];l,t,r,b=bounds(points);l-=3;t-=3;r+=3;b+=3
 im=Image.new('RGBA',(r-l,b-t));pixels=im.load()
 fringe={(x+dx,y+dy) for x,y in points for dx in range(-2,3) for dy in range(-2,3)}
 if collection=='chrome':
  # Preserve low-luminance metal within the glyph bounds, not just bright edges.
  fringe={(x,y) for y in range(t,b) for x in range(l,r)}
 for x,y in fringe:
  if not(0<=x<w and 0<=y<h):continue
  if collection=='grunge01' and ch=='F' and y>=148:
   if x>=597:continue
   if 595<=x<597 and y<=219:
    pixels[x-l,y-t]=(0,0,0,254)
    continue
  if collection in ('afro01','grunge01','future01'):
   pixels[x-l,y-t]=source.getpixel((x,y))
   continue
  rgb=source.getpixel((x,y));a=min(1,max(0,(max(rgb)-2)/10)) if collection=='chrome' else min(1,max(0,(max(rgb)-8)/62))
  if collection=='future02':a=max(rgb)/255
  if a: pixels[x-l,y-t]=tuple(round(max(0,min(255,v/a))) for v in rgb)+(round(a*255),)
 # Ink bounds include swashes; contour kerning permits safe optical overlap.
 advance=round((r-l-6)*scale*5)+40
 im=im.resize((round((r-l)*scale),round((b-t)*scale)),Image.Resampling.LANCZOS)
 # Codepoint filenames stay distinct on case-insensitive macOS filesystems.
 im.save(out/f'u{ord(ch):04X}.png');buf=BytesIO();im.save(buf,format='PNG')
 # sbix positioning is relative to the outline box. Reserve descent space and
 # compensate its -400-unit bottom with +80 bitmap pixels at ppem 200.
 name=f'uni{ord(ch):04X}';cmap[ord(ch)]=name
 if collection in ('rainbow','afro01','future02') and ch.isalpha():cmap[ord(ch.lower())]=name
 pen=TTGlyphPen(None);pen.moveTo((20,-400));pen.lineTo((advance-20,-400));pen.lineTo((advance-20,1100));pen.lineTo((20,1100));pen.closePath()
 glyf[name]=pen.glyph();metrics[name]=(advance,20)
 ox=round(4-3*scale);oy=round((baseline-b)*scale)+80
 assert oy>=0 and oy+im.height<=300, f'{ch}: bitmap exceeds vertical paint bounds'
 strike.glyphs[name]=Glyph(glyphName=name,originOffsetX=ox,originOffsetY=oy,graphicType='png ',imageData=buf.getvalue())
 profile={}
 for x,y in points:
  row=round((baseline-y)*scale*5/10)
  left=(x-l-3)*scale*5;right=(r-4-x)*scale*5
  if row in profile:profile[row]=(min(profile[row][0],left),min(profile[row][1],right))
  else:profile[row]=(left,right)
 profiles[name]=profile
 report[ch]={'advance':advance,'sourceScale':scale,'sourceBaseline':baseline,'bitmapOffsetX':ox,'bitmapOffsetY':oy}
f.setupGlyphOrder(list(glyf));f.setupCharacterMap(cmap);f.setupGlyf(glyf);f.setupHorizontalMetrics(metrics);f.setupHorizontalHeader(ascent=1100,descent=-400)
f.setupNameTable({'familyName':family,'styleName':'Regular','uniqueFontIdentifier':font_name+'-1','fullName':family,'psName':font_name,'version':'Version 1.000'})
f.setupOS2(sTypoAscender=1100,sTypoDescender=-400,usWinAscent=1100,usWinDescent=400);f.setupPost();f.setupMaxp()
sbix=newTable('sbix');sbix.version=1;sbix.flags=1;sbix.strikes={200:strike};f.font['sbix']=sbix
pairs=[]
for a,pa in profiles.items():
 for b,pb in profiles.items():
  gaps=sorted(pa[y][1]+pb[y][0]+40 for y in pa.keys() & pb.keys())
  if gaps:
   adjustment=round(max(-240,30-gaps[len(gaps)//4],15-gaps[0]))
   if adjustment:pairs.append(f'pos {a} {b} {adjustment};')
addOpenTypeFeaturesFromString(f.font,'feature kern { '+' '.join(pairs)+' } kern;')
f.font.flavor='woff2';f.save(root/f'public/fonts/{font_name}.woff2')
(out/'metrics.json').write_text(json.dumps({'glyphs':report,'kerningPairs':len(pairs)},indent=2)+'\n')
print(f'Built {len(assigned)} distinct {family} glyphs.')
