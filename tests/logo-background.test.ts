import test from 'node:test';
import assert from 'node:assert/strict';
import sharp from 'sharp';
import { removeLogoBackgroundPixels } from '../lib/removeLogoBackground.ts';
import { parsePresenterLogo } from '../lib/coco/presenterLogo.ts';

const fixture = (bg: string) => Buffer.from(`<svg width="200" height="160" xmlns="http://www.w3.org/2000/svg"><rect width="200" height="160" fill="${bg}"/><rect x="35" y="25" width="130" height="110" rx="8" fill="#123968"/><path d="M60 55h20v50H60zm40 0h40v12h-25v10h20v12h-20v16h-15z" fill="white"/></svg>`);
const pixels = async (bytes: Buffer) => {
  const { data, info } = await sharp(bytes).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  return { width: info.width, height: info.height, data: new Uint8ClampedArray(data) };
};
const pixel = (image: ReturnType<typeof removeLogoBackgroundPixels>, x: number, y: number) => [...image.data.slice((y * image.width + x) * 4, (y * image.width + x) * 4 + 4)];

for (const format of ['png', 'jpeg'] as const) {
  for (const bg of ['white', '#19bb72']) {
    test(`${format} ${bg}: removes background, preserves enclosed white lettering and dimensions`, async () => {
      const input = await pixels(await sharp(fixture(bg))[format]().toBuffer());
      const original = new Uint8ClampedArray(input.data);
      const result = removeLogoBackgroundPixels(input);
      assert.equal(result.width, 200); assert.equal(result.height, 160);
      assert.equal(pixel(result, 0, 0)[3], 0);
      assert.equal(pixel(result, 190, 150)[3], 0);
      assert.deepEqual(pixel(result, 65, 65), pixel(input, 65, 65));
      assert.equal(pixel(result, 65, 65)[3], 255);
      assert.deepEqual(pixel(result, 45, 75), pixel(input, 45, 75));
      assert.deepEqual(input.data, original, 'Original pixels stay intact');
    });
  }
}

test('tolerance removes near-background patches without changing enclosed lettering', async () => {
  const input = await pixels(await sharp(fixture('white')).png().toBuffer());
  for (let y = 0; y < 20; y++) for (let x = 50; x < 90; x++) input.data.set([225,225,225,255], (y * 200 + x) * 4);
  assert.equal(pixel(removeLogoBackgroundPixels(input, 0), 60, 10)[3], 255);
  assert.equal(pixel(removeLogoBackgroundPixels(input, 40), 60, 10)[3], 0);
  assert.equal(pixel(removeLogoBackgroundPixels(input, 40), 65, 65)[3], 255);
});

test('refuses an already transparent logo or an image without a distinguishable logo', async () => {
  const transparent = await pixels(await sharp(fixture('none')).png().toBuffer());
  assert.throws(() => removeLogoBackgroundPixels(transparent), /already has a transparent/);
  const blank = { width: 20, height: 20, data: new Uint8ClampedArray(20 * 20 * 4).fill(255) };
  assert.throws(() => removeLogoBackgroundPixels(blank), /too similar/);
});

test('restore source and tolerance survive brief serialization and size changes', () => {
  const originalUrl = 'data:image/jpeg;base64,original', url = 'data:image/png;base64,cutout';
  const logo = parsePresenterLogo(JSON.stringify({url, originalUrl, backgroundTolerance:0, aspect:1.25, scale:.5}));
  assert.ok(logo);
  assert.equal(logo.originalUrl, originalUrl); assert.equal(logo.backgroundTolerance, 0);
  assert.equal(parsePresenterLogo(JSON.stringify({...logo,scale:.8}))?.originalUrl, originalUrl);
});

test('unmattes a three-pixel compressed fringe without eroding solid logo color', () => {
  const width=40,height=40,data=new Uint8ClampedArray(width*height*4).fill(255);
  const foreground=[20,50,90];
  for(let y=8;y<32;y++)for(let x=8;x<32;x++){
    const inset=Math.min(x-8,31-x,y-8,31-y);
    const alpha=[.25,.5,.75,1][Math.min(3,inset)];
    data.set([...foreground.map(c=>Math.round(255*(1-alpha)+c*alpha)),255],(y*width+x)*4);
  }
  const result=removeLogoBackgroundPixels({width,height,data});
  for(const [x,alpha] of [[8,.25],[9,.5],[10,.75]] as const){
    const edge=pixel(result,x,20);
    assert.ok(Math.abs(edge[3]-255*alpha)<3,`fringe alpha at ${x}: ${edge}`);
    for(let c=0;c<3;c++)assert.ok(Math.abs(edge[c]-foreground[c])<4,`unmatted color at ${x}`);
  }
  assert.deepEqual(pixel(result,15,20),[...foreground,255]);
});

test('removes tiny pale exterior specks but keeps punctuation and enclosed white', () => {
  const width=60,height=60,data=new Uint8ClampedArray(width*height*4).fill(255);
  const put=(x:number,y:number,c:number[])=>data.set(c,(y*width+x)*4);
  for(let y=18;y<42;y++)for(let x=18;x<42;x++)put(x,y,[20,40,80,255]);
  // White lettering only two pixels inside a solid outline must survive.
  for(let y=20;y<40;y++)for(let x=20;x<40;x++)put(x,y,[255,255,255,255]);
  put(5,5,[211,211,211,255]);put(6,5,[210,210,210,255]);
  put(50,50,[20,40,80,255]);
  const result=removeLogoBackgroundPixels({width,height,data});
  assert.equal(pixel(result,5,5)[3],0);assert.equal(pixel(result,6,5)[3],0);
  assert.deepEqual(pixel(result,50,50),[20,40,80,255]);
  assert.deepEqual(pixel(result,20,25),[255,255,255,255]);
});

test('diagonal openings between touching strokes connect to the background', () => {
  const width=9,height=9,data=new Uint8ClampedArray(width*height*4).fill(255);
  for(let y=2;y<=6;y++)for(let x=2;x<=6;x++)data.set([20,40,80,255],(y*width+x)*4);
  // A diagonal white corridor reaches the exterior only through corner contacts.
  for(let p=2;p<=4;p++)data.set([255,255,255,255],(p*width+p)*4);
  const result=removeLogoBackgroundPixels({width,height,data});
  assert.equal(pixel(result,4,4)[3],0);
  assert.deepEqual(pixel(result,6,4),[20,40,80,255]);
});

test('enclosed-gap option clears trapped background and its antialiased inner rim', () => {
  const width=40,height=40,data=new Uint8ClampedArray(width*height*4).fill(255);
  for(let y=5;y<35;y++)for(let x=5;x<35;x++)data.set([0,0,0,255],(y*width+x)*4);
  for(let y=13;y<27;y++)for(let x=13;x<27;x++){
    const c=Math.min(x-13,26-x,y-13,26-y)===0?128:255;
    data.set([c,c,c,255],(y*width+x)*4);
  }
  const input={width,height,data};
  assert.equal(pixel(removeLogoBackgroundPixels(input),20,20)[3],255);
  const clean=removeLogoBackgroundPixels(input,20,{clearEnclosedGaps:true});
  assert.equal(pixel(clean,20,20)[3],0);
  assert.ok(Math.abs(pixel(clean,13,20)[3]-127)<=1);
  assert.deepEqual(pixel(clean,13,20).slice(0,3),[0,0,0]);
  assert.deepEqual(pixel(clean,8,20),[0,0,0,255]);
  assert.equal(pixel(removeLogoBackgroundPixels(input),20,20)[3],255,'Turning off recalculates from original');
});

test('enclosed-gap setting survives serialization and resizing', () => {
  const source={url:'data:image/png;base64,cutout',originalUrl:'data:image/jpeg;base64,original',aspect:1,scale:.5,backgroundTolerance:20,clearEnclosedGaps:true};
  const parsed=parsePresenterLogo(JSON.stringify(source));
  assert.equal(parsed?.clearEnclosedGaps,true);
  assert.equal(parsePresenterLogo(JSON.stringify({...parsed,scale:.8}))?.clearEnclosedGaps,true);
  assert.equal(parsePresenterLogo(JSON.stringify({...source,clearEnclosedGaps:false}))?.clearEnclosedGaps,false);
});
