from pathlib import Path
from fontTools.ttLib import TTFont
from PIL import Image
from io import BytesIO
import json,hashlib
root=Path(__file__).resolve().parent.parent
for key,file in [('arctic-metal','ArcticMetalPNG'),('gold-flourish','GoldFlourishPNG'),('gold-filigree','GoldFiligreePNG'),('africa-gold','AfricaGoldPNG'),('sunset-gold','SunsetGoldPNG')]:
 data=json.loads((root/f'public/generated-flyers/assets/png-glyphs/{key}/metrics.json').read_text());font=TTFont(root/f'public/fonts/{file}.woff2');cmap=font.getBestCmap();strike=font['sbix'].strikes[data.get('bitmapPpem',200)]
 if key=='africa-gold':
  assert len(data['glyphs'])==62 and data['version']==2 and data['bitmapPpem']==600
  for source in data['sources']:
   assert hashlib.sha256((root/source['path']).read_bytes()).hexdigest()==source['sha256']
  for ch,record in data['glyphs'].items():
   assert record['sourceScale']>=1,ch
   name=cmap[ord(ch)];g=strike.glyphs[name];im=Image.open(BytesIO(g.imageData));ink=im.getchannel('A').getbbox();outline=font['glyf'][name]
   assert im.mode=='RGBA' and ink,ch
   assert g.originOffsetX+ink[0]>=0,ch
   assert g.originOffsetY+im.height-ink[3]>=0,ch
   assert -400+(g.originOffsetY+im.height-ink[1])*1000/600<=1100,ch
   assert 20+(g.originOffsetX+ink[2])*1000/600<=outline.xMax,ch
   assert font['hmtx'][name][0]==record['advance'],ch
   if ch.isupper():assert cmap[ord(ch.lower())]!=name,ch
  for ch in 'ijO':assert data['glyphs'][ch]['componentCount']>=2,ch
  assert data['kerningPairs']>0 and 'GPOS' in font
  print(key,'PASS: four source hashes, 62 native glyphs, lowercase, dots, Africa motif, paint bounds, advances, GPOS')
  continue
 assert hashlib.sha256((root/data['source']).read_bytes()).hexdigest()==data['sourceSha256']
 assert len(data['glyphs'])==36 and data['kerningPairs']>0 and 'GPOS' in font
 for ch,record in data['glyphs'].items():
  name=cmap[ord(ch)];g=strike.glyphs[name];im=Image.open(BytesIO(g.imageData));assert im.mode=='RGBA';assert im.getchannel('A').getextrema()[0]==0;assert im.getchannel('A').getextrema()[1]>200
  assert 0<=g.originOffsetY and g.originOffsetY+im.height<=300
  outline=font['glyf'][name];assert g.originOffsetX+im.width<=(outline.xMax-outline.xMin)/5+1
  assert font['hmtx'][name][0]==record['advance']
  if ch.isalpha():assert cmap[ord(ch.lower())]==name
 print(key,'PASS: source hash, 36 glyphs, aliases, alpha, paint bounds, advances, GPOS')
