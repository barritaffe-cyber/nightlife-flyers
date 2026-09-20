"""Extract supplied material lettering sheets; reuse the established sbix/GPOS packaging pipeline.
No artwork is generated. Connected shapes retain overhangs; touching groups have
explicit source seams. Shared crossing pixels belong to both flourish/core crops.
"""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter
from io import BytesIO
import argparse,json,hashlib
from fontTools.fontBuilder import FontBuilder
from fontTools.pens.ttGlyphPen import TTGlyphPen
from fontTools.feaLib.builder import addOpenTypeFeaturesFromString
from fontTools.ttLib import newTable
from fontTools.ttLib.tables.sbixStrike import Strike
from fontTools.ttLib.tables.sbixGlyph import Glyph
root=Path(__file__).resolve().parent.parent
configs={
 'arctic-metal':('future-tech','Arctic Metal','ArcticMetalPNG',[]),
 'gold-flourish':('gold metal','Gold Flourish','GoldFlourishPNG',[
 ('AB C D E F G',0,235,220,171,{'AB':[300]}),
 ('H I J K L MN',235,435,413,167,{'MN':[1285]}),
 ('O P Q R S TU',435,631,611,170,{'TU':[1278]}),
 ('VW X Y Z',631,813,798,161,{'VW':[362]}),
 ('0 1 2 3 4 5 6 7 8 9',813,1024,977,159,{})]),
 'gold-filigree':('nordic','Gold Filigree','GoldFiligreePNG',[
 ('A B C D E F G H I',0,310,279,180,{}),
 ('J K L M N O P Q R',310,531,497,183,{}),
 ('S T U V W X Y Z',531,747,718,184,{}),
 ('0 1 2 3 4 5 6 7 8 9',747,1024,933,178,{})]),
 'africa-gold':('africa','Africa Gold','AfricaGoldPNG',[
 ('AB C D E F G H I',0,290,272,190,{'AB':[212]}),
 ('JKLM N O P Q R',290,545,508,190,{'JKLM':[149,307,439]}),
 ('S T UVWX Y Z',545,752,730,183,{'UVWX':[481,656,879]}),
 ('0 1 2 3 4 5 6 7 8 9',752,1024,954,190,{})]),
 'sunset-gold':('sunset','Sunset Gold','SunsetGoldPNG',[
 ('A B C D E F G H I',0,280,250,185,{}),
 ('J K L M N O P Q R',280,532,482,183,{}),
 ('S T U V W X Y Z',532,754,729,186,{}),
 ('0 1 2 3 4 5 6 7 8 9',754,1024,958,180,{})])}
parser=argparse.ArgumentParser();parser.add_argument('collection',choices=configs);key=parser.parse_args().collection
if key == 'africa-gold':
 import runpy
 runpy.run_path(str(root/'scripts/build-africa-gold-font.py'), run_name='__main__')
 raise SystemExit(0)
src,label,font_name,rows=configs[key];family=label+' PNG';path=root/f'public/generated-flyers/assets/png-glyphs/{src}.png';source=Image.open(path);alpha=source.mode=='RGBA';w,h=source.size
channel=source.getchannel('A') if alpha else source.getchannel('B' if key=='arctic-metal' else 'R')
remaining={(x,y) for y in range(h) for x in range(w) if channel.getpixel((x,y))>60};components=[]
while remaining:
 p=remaining.pop();queue=[p];points={p}
 while queue:
  x,y=queue.pop()
  for n in ((x-1,y),(x+1,y),(x,y-1),(x,y+1)):
   if n in remaining:remaining.remove(n);queue.append(n);points.add(n)
 if len(points)>300:components.append(points)
def bounds(p):return min(x for x,y in p),min(y for x,y in p),max(x for x,y in p)+1,max(y for x,y in p)+1
assigned={};metadata={};shared={}
for groups,top,bottom,baseline,cap,seams in rows:
 cs=sorted([c for c in components if top<=bounds(c)[1]<bottom],key=lambda c:bounds(c)[0]);groups=groups.split();assert len(cs)==len(groups),(key,groups,[bounds(c) for c in cs])
 for group,c in zip(groups,cs):
  edges=[-1]+seams.get(group,[])+[w+1]
  assert len(edges)==len(group)+1
  for i,ch in enumerate(group):assigned[ch]={(x,y) for x,y in c if edges[i]<=x<edges[i+1]};metadata[ch]=(baseline,150/cap)
  if len(group)>1:shared[group]=c
if key=='arctic-metal':
 # B and D have disconnected left strokes; group by explicit source cells.
 cells=[('ABCDEFG',[30,293,490,687,918,1090,1279,1510],40,235,214,148),
 ('HIJKLMN',[40,250,325,530,740,930,1272,1510],235,417,399,151),
 ('OPQRSTU',[30,249,453,677,884,1080,1290,1510],417,595,580,149),
 ('VWXYZ',[120,370,680,930,1175,1410],595,789,769,158),
 ('0123456789',[30,178,254,408,556,715,858,1021,1180,1340,1510],789,985,953,145)]
 for chars,edges,top,bottom,baseline,cap in cells:
  for i,ch in enumerate(chars):
   assigned[ch]={(x,y) for y in range(top,bottom) for x in range(edges[i],edges[i+1]) if channel.getpixel((x,y))>60}
   metadata[ch]=(baseline,150/cap)
core_bounds={ch:bounds(points) for ch,points in assigned.items()}
# Keep entire sweeping strokes where the sheet connects neighboring glyphs.
if key=='gold-flourish':
 sweeps=[('A','AB',[(74,185),(116,163),(160,150),(210,147),(256,155),(313,173),(363,183),(412,179)]),('M','MN',[(1030,362),(1075,343),(1120,333),(1170,338),(1230,367),(1280,400),(1320,410)]),('T','TU',[(1083,533),(1140,511),(1190,494),(1240,490),(1285,509),(1340,544),(1390,564),(1455,571)]),('V','VW',[(108,748),(155,726),(200,709),(252,702),(310,709),(365,723),(430,737),(477,738),(521,729)])]
 for ch,group,line in sweeps:
  # Follow the original bright stroke near the authored path, preserving its
  # antialiasing without importing a rectangular strip of the neighboring stem.
  for (x0,y0),(x1,y1) in zip(line,line[1:]):
   for x in range(x0,x1+1):
    expected=y0+(y1-y0)*(x-x0)/max(1,x1-x0)
    candidates=[y for y in range(round(expected)-12,round(expected)+13) if (x,y) in shared[group]]
    if not candidates:continue
    y=max(candidates,key=lambda yy:source.getpixel((x,yy))[0]-abs(yy-expected)*5)
    assigned[ch]|={(x,yy) for yy in range(y-1,y+2) if (x,yy) in shared[group]}

assert set(assigned)==set('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789')
out=root/f'public/generated-flyers/assets/png-glyphs/{key}';out.mkdir(exist_ok=True)
f=FontBuilder(1000,isTTF=True);glyf={};metrics={};cmap={32:'space'};report={};profiles={};strike=Strike(ppem=200,resolution=72)
for name in ['.notdef','space']:
 glyf[name]=TTGlyphPen(None).glyph();metrics[name]=(300,0);strike.glyphs[name]=Glyph(glyphName=name)
for ch,points in assigned.items():
 baseline,scale=metadata[ch];l,t,r,b=bounds(points);pad=12 if alpha or key=='arctic-metal' else 4;l=max(0,l-pad);t=max(0,t-pad);r=min(w,r+pad);b=min(h,b+pad)
 mask=Image.new('L',(r-l,b-t));mp=mask.load()
 for x,y in points:mp[x-l,y-t]=255
 mask=mask.filter(ImageFilter.MaxFilter(2*pad+1));im=Image.new('RGBA',mask.size);px=im.load()
 for y in range(t,b):
  for x in range(l,r):
   if not mask.getpixel((x-l,y-t)):continue
   value=source.getpixel((x,y))
   if channel.getpixel((x,y))>60 and (x,y) not in points:continue
   if alpha:px[x-l,y-t]=value
   else:
    a=min(1,max(0,(max(value)-2)/20))
    if a:px[x-l,y-t]=tuple(round(min(255,v/a)) for v in value)+(round(a*255),)
 # Source-row normalization preserves the relationship between capitals/digits.
 im=im.resize((round((r-l)*scale),round((b-t)*scale)),Image.Resampling.LANCZOS)
 advance=round((core_bounds[ch][2]-core_bounds[ch][0])*scale*5)+45
 name=f'uni{ord(ch):04X}';cmap[ord(ch)]=name
 if ch.isalpha():cmap[ord(ch.lower())]=name
 pen=TTGlyphPen(None);pen.moveTo((20,-400));pen.lineTo((max(21,advance-20,im.width*5+20),-400));pen.lineTo((max(21,advance-20,im.width*5+20),1100));pen.lineTo((20,1100));pen.closePath();glyf[name]=pen.glyph();metrics[name]=(advance,20)
 ox=round(4-pad*scale);oy=round((baseline-b)*scale)+80
 assert oy>=0 and oy+im.height<=300,(ch,oy,im.size)
 im.save(out/f'u{ord(ch):04X}.png');buf=BytesIO();im.save(buf,format='PNG');strike.glyphs[name]=Glyph(glyphName=name,originOffsetX=ox,originOffsetY=oy,graphicType='png ',imageData=buf.getvalue())
 profile={}
 for x,y in points:
  row=round((baseline-y)*scale/2);left=(x-l-pad)*scale*5;right=(core_bounds[ch][2]-1-x)*scale*5
  if row in profile:profile[row]=(min(profile[row][0],left),min(profile[row][1],right))
  else:profile[row]=(left,right)
 profiles[name]=profile;report[ch]=dict(advance=advance,sourceBounds=[l,t,r,b],sourceScale=scale,sourceBaseline=baseline,bitmapOffsetX=ox,bitmapOffsetY=oy,bitmapSize=im.size)
f.setupGlyphOrder(list(glyf));f.setupCharacterMap(cmap);f.setupGlyf(glyf);f.setupHorizontalMetrics(metrics);f.setupHorizontalHeader(ascent=1100,descent=-400)
f.setupNameTable(dict(familyName=family,styleName='Regular',uniqueFontIdentifier=font_name+'-1',fullName=family,psName=font_name,version='Version 1.000'));f.setupOS2(sTypoAscender=1100,sTypoDescender=-400,usWinAscent=1100,usWinDescent=400);f.setupPost();f.setupMaxp();sbix=newTable('sbix');sbix.version=1;sbix.flags=1;sbix.strikes={200:strike};f.font['sbix']=sbix
pairs=[]
for a,pa in profiles.items():
 for b,pb in profiles.items():
  gaps=sorted(pa[y][1]+pb[y][0]+45 for y in pa.keys()&pb.keys())
  if gaps:
   adjust=round(min(0,max(-240,30-gaps[len(gaps)//4],15-gaps[0])))
   if adjust:pairs.append(f'pos {a} {b} {adjust};')
addOpenTypeFeaturesFromString(f.font,'feature kern { '+' '.join(pairs)+' } kern;');f.font.flavor='woff2';f.save(root/f'public/fonts/{font_name}.woff2')
(out/'metrics.json').write_text(json.dumps(dict(family=family,source=str(path.relative_to(root)),sourceSha256=hashlib.sha256(path.read_bytes()).hexdigest(),sourceAlpha=alpha,glyphs=report,kerningPairs=len(pairs),touchingGroups=list(shared)),indent=2)+'\n')
print(f'Built {family}: {len(assigned)} glyphs, {len(pairs)} kerning pairs')
