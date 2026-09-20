"""Trace supplied brush sheet into real SVG paths and an editable outline WOFF2.
Pure Pillow boundary tracing: no raster payloads or substituted letterforms.
"""
from pathlib import Path
from collections import defaultdict
import json, hashlib
from PIL import Image
from fontTools.fontBuilder import FontBuilder
from fontTools.pens.ttGlyphPen import TTGlyphPen
from fontTools.pens.transformPen import TransformPen
from fontTools.svgLib.path import parse_path
ROOT=Path(__file__).resolve().parent.parent
src=ROOT/'public/generated-flyers/assets/png-glyphs/paint01.png'
out=ROOT/'public/generated-flyers/assets/drift-brush-svg';out.mkdir(exist_ok=True)
im=Image.open(src).convert('L');w,h=im.size
pixels={(x,y) for y in range(h) for x in range(w) if im.getpixel((x,y))>=140}
components=[]
while pixels:
 seed=pixels.pop();c={seed};q=[seed]
 while q:
  x,y=q.pop()
  for z in ((x+1,y),(x-1,y),(x,y+1),(x,y-1)):
   if z in pixels:pixels.remove(z);c.add(z);q.append(z)
 components.append(c)
def bounds(c):return min(x for x,y in c),min(y for x,y in c),max(x for x,y in c)+1,max(y for x,y in c)+1
big=[c for c in components if len(c)>1000]
# R/S meet at their trailing dry-brush tips. Separate this shared tail seam.
rs=next(c for c in big if len(c)>25000);big.remove(rs)
r={p for p in rs if p[0] < (875 if p[1]<590 else 834+(p[1]-590)*.57)}
big.extend([r,rs-r])
big.sort(key=lambda c:(round(bounds(c)[1]/200),bounds(c)[0]))
assert len(big)==36
chars='ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
boxes=[bounds(c) for c in big]
# Retain detached brush marks by nearest actual stroke, not rectangular crops.
for c in components:
 if len(c)>1000:continue
 if len(c)<2:continue
 cx=sum(x for x,y in c)/len(c);cy=sum(y for x,y in c)/len(c)
 candidates=sorted(range(36),key=lambda i:max(boxes[i][0]-cx,0,cx-boxes[i][2])**2+max(boxes[i][1]-cy,0,cy-boxes[i][3])**2)[:3]
 i=min(candidates,key=lambda i:min((x-cx)**2+(y-cy)**2 for x,y in big[i]))
 big[i].update(c)

def trace(c):
 edges=defaultdict(list)
 for x,y in sorted(c):
  for neighbor,a,b in [((x,y-1),(x,y),(x+1,y)),((x+1,y),(x+1,y),(x+1,y+1)),((x,y+1),(x+1,y+1),(x,y+1)),((x-1,y),(x,y+1),(x,y))]:
   if neighbor not in c:edges[a].append(b)
 paths=[]
 while edges:
  start=next(iter(edges));p=start;loop=[]
  while True:
   loop.append(p);n=edges[p].pop()
   if not edges[p]:del edges[p]
   p=n
   if p==start:break
  # Keep corners only: exact source silhouette, including holes and flecks.
  pts=[b for a,b,c in zip(loop[-1:]+loop[:-1],loop,loop[1:]+loop[:1]) if (b[0]-a[0])*(c[1]-b[1])!=(b[1]-a[1])*(c[0]-b[0])]
  if len(pts)>2:paths.append('M'+' L'.join(f'{x} {y}' for x,y in pts)+' Z')
 return ' '.join(paths)
font=FontBuilder(1000,isTTF=True);glyphs={};metrics={};cmap={32:'space'};manifest=[]
for name in ['.notdef','space']:
 glyphs[name]=TTGlyphPen(None).glyph();metrics[name]=(320,0)
for char,c in zip(chars,big):
 x0,y0,x1,y1=bounds(c);path=trace(c)
 (out/f'{char}.svg').write_text(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{x0} {y0} {x1-x0} {y1-y0}"><path fill="currentColor" d="{path}"/></svg>\n')
 scale=720/(y1-y0);pen=TTGlyphPen(None)
 parse_path(path,TransformPen(pen,(scale,0,0,-scale,14-x0*scale,y1*scale)))
 glyphs[char]=pen.glyph();metrics[char]=(round((x1-x0)*scale+28),14);cmap[ord(char)]=char
 if char.isalpha():cmap[ord(char.lower())]=char
 manifest.append({'character':char,'sourceBounds':[x0,y0,x1,y1],'pixels':len(c),'advance':metrics[char][0]})
font.setupGlyphOrder(list(glyphs));font.setupCharacterMap(cmap);font.setupGlyf(glyphs);font.setupHorizontalMetrics(metrics);font.setupHorizontalHeader(ascent=850,descent=-150)
font.setupNameTable({'familyName':'Drift Brush SVG','styleName':'Regular','uniqueFontIdentifier':'DriftBrushSVG-Regular-1','fullName':'Drift Brush SVG Regular','psName':'DriftBrushSVG-Regular','version':'Version 1.000'})
font.setupOS2(sTypoAscender=850,sTypoDescender=-150,usWinAscent=850,usWinDescent=150,sCapHeight=720,sxHeight=720);font.setupPost();font.setupMaxp();font.font.flavor='woff2';font.save(ROOT/'public/fonts/DriftBrushSVG.woff2')
(out/'manifest.json').write_text(json.dumps({'family':'Drift Brush SVG','source':str(src.relative_to(ROOT)),'sha256':hashlib.sha256(src.read_bytes()).hexdigest(),'threshold':140,'glyphs':manifest},indent=2)+'\n')
print('Built 36 true SVG glyphs + Drift Brush SVG outline WOFF2')
