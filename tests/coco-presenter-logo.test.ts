import test from 'node:test';
import assert from 'node:assert/strict';
import { withCocoPresenterLogo, COCO_PRESENTER_LOGO_ID } from '../lib/coco/presenterLogo.ts';

const url='data:image/png;base64,logo';
test('logo sizing preserves its centre in Square and Story, including moved logos',()=>{
  for(const format of ['square','story']){
    const source={format,cocoCompositionSystem:{compiledDocument:{objects:[{id:'presenter',kind:'text',bounds:{x:25,y:8,width:30,height:5},binding:{text:'presenter'}}]}},portraits:[]};
    const brief=(scale:number)=>({presenterName:'Club Woods',presenterLogo:JSON.stringify({url,aspect:2,scale})});
    const placed=withCocoPresenterLogo(source,brief(1));
    const asset=placed.portraits.find((a:{id:string})=>a.id===COCO_PRESENTER_LOGO_ID);
    asset.x=42;asset.y=23;asset.rotation=18;
    for(const scale of [.2,.5,2,1]){
      const result=withCocoPresenterLogo(placed,brief(scale));
      const image=result.portraits[0],box=image.cocoCssBounds;
      assert.equal(image.x,42);assert.equal(image.y,23);assert.equal(image.rotation,18);
      assert.equal(image.scale,scale);
      const left=image.x-box.width*scale/2,top=image.y-box.height*scale/2;
      assert.equal(left+box.width*scale/2,42);assert.equal(top+box.height*scale/2,23);
    }
    const cleared=withCocoPresenterLogo(placed,{presenterLogo:''});
    assert.equal(cleared.portraits.length,0);
    assert.ok(!cleared.cocoCompositionSystem.compiledDocument.objects.some((o:{id:string})=>o.id===COCO_PRESENTER_LOGO_ID));
  }
});
test('later detail edits preserve logo size adjusted in the editor',()=>{
  const source={format:'square',cocoCompositionSystem:{compiledDocument:{objects:[]}}};
  const brief={presenterLogo:JSON.stringify({url,aspect:1,scale:1})};
  const placed=withCocoPresenterLogo(source,brief);placed.portraits[0].scale=.7;
  assert.equal(withCocoPresenterLogo(placed,brief).portraits[0].scale,.7);
});

test('tiny presenter type does not make the logo tiny; physical size matches both formats',()=>{
  const brief={presenterLogo:JSON.stringify({url,aspect:1,scale:1})};
  const sizes=[];
  for(const format of ['square','story']){
    const source={format,cocoCompositionSystem:{compiledDocument:{objects:[
      {id:'presenter',kind:'text',bounds:{x:6,y:10,width:16,height:.8}},
      {id:'foreground',kind:'image',stacking:{effectiveZIndex:75}},
    ]}}};
    const placed=withCocoPresenterLogo(source,brief);
    const logo=placed.portraits[0];
    assert.ok(logo.cocoCssBounds.width>=12);
    assert.ok(logo.layerOffset>75,'Logo is above foreground artwork');
    sizes.push(logo.cocoCssBounds.height*(format==='story'?1920/1080:1));
  }
  assert.equal(sizes[0],sizes[1]);
});

test('existing undersized logo is upgraded once without changing its center or chosen size',()=>{
  const brief={presenterLogo:JSON.stringify({url,aspect:1,scale:.5})};
  const id=COCO_PRESENTER_LOGO_ID;
  const source={format:'square',cocoCompositionSystem:{compiledDocument:{objects:[{id,kind:'image',bounds:{x:40,y:30,width:3,height:3}}]}},
    portraits:[{id,x:42,y:32,scale:.5,cocoPresenterLogoScale:.5,layerOffset:30}]};
  const upgraded=withCocoPresenterLogo(source,brief),asset=upgraded.portraits[0];
  assert.equal(asset.x,42);assert.equal(asset.y,32);assert.equal(asset.scale,.5);
  assert.equal(asset.cocoCssBounds.width,12);
  assert.deepEqual(withCocoPresenterLogo(upgraded,brief),upgraded,'Subsequent edits do not grow it again');
});
