import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { layoutWhimsicalWord } from '../lib/whimsicalWordLayout.ts';

const data=JSON.parse(readFileSync(new URL('../lib/whimsicalSvgData.json',import.meta.url),'utf8'));
test('closing letter spacing removes a swash instead of shrinking it',()=>{
  const wide=layoutWhimsicalWord('Brunch',data,0);
  const tight=layoutWhimsicalWord('Brunch',data,-.25);
  assert.ok(wide.ornaments.some(o=>o.name==='bottom'));
  assert.ok(!tight.ornaments.some(o=>o.name==='bottom'));
  assert.ok(tight.ornaments.every(o=>wide.ornaments.some(original=>original.name===o.name)), 'tightening does not introduce new ornaments');
  const wider=layoutWhimsicalWord('Brunch',data,.1);
  assert.equal(wide.ornaments.find(o=>o.name==='top')?.width,wider.ornaments.find(o=>o.name==='top')?.width);
  assert.deepEqual(layoutWhimsicalWord('Brunch',data,0).ornaments,wide.ornaments);
});
test('ornaments never adjust letters or change the frame when shown/hidden',()=>{
  const plain=layoutWhimsicalWord('Brunch',data,0,0), decorated=layoutWhimsicalWord('Brunch',data);
  assert.deepEqual(plain.letters,decorated.letters);
  assert.deepEqual(plain.viewBox,decorated.viewBox);
  assert.equal(plain.ornaments.length,0);
  assert.ok(decorated.ornaments.length>0);
});
test('short words remain clean and unknown characters reserve space',()=>{
  for(const text of ['', 'B', 'Br', 'hi'])assert.equal(layoutWhimsicalWord(text,data).ornaments.length,0);
  for(const text of ['♥Brunch','Brunch♥']){
    const l=layoutWhimsicalWord(text,data);
    assert.equal(l.ornaments.length,0,'do not decorate unmeasured fallback ink');
    const fallback=l.letters.find(letter=>!letter.glyph)!;
    assert.ok(l.viewBox[0]<=fallback.box.x && l.viewBox[0]+l.viewBox[2]>=fallback.box.x+fallback.box.width);
  }
});
