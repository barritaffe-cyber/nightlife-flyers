import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {GLASS_HEADLINE_EFFECT, GLASS_HEADLINE_FILL, glassHeadlineStyles} from '../lib/coco/glassHeadline.ts';

test('glass keeps translucent reflections and scales edge widths with headline size',()=>{
 const layers=glassHeadlineStyles();
 assert.equal(layers.face.backgroundImage,GLASS_HEADLINE_FILL);
 assert.match(String(layers.face.WebkitTextFillColor),/\.08/);
 const stroke=String(layers.depth.WebkitTextStroke);
 assert.match(stroke,/em /);
 assert.ok(Math.abs(parseFloat(stroke)*330-7)<.0001);
 assert.ok(Math.abs(parseFloat(stroke)*165-3.5)<.0001);
 assert.equal(layers.bevel.transform,'scale(.985)');
 assert.equal(layers.rim.pointerEvents,'none');
});
test('solid fill and edited gradients replace only the glass face',()=>{
 const original=glassHeadlineStyles();
 const solid=glassHeadlineStyles({solidColor:'#ff0055'});
 assert.equal(solid.face.backgroundImage,'none');
 assert.equal(solid.face.WebkitTextFillColor,'#ff0055');
 assert.deepEqual(solid.depth,original.depth);
 assert.deepEqual(solid.rim,original.rim);
 const gradient='linear-gradient(180deg,red,blue)';
 assert.equal(glassHeadlineStyles({gradient}).face.backgroundImage,gradient);
});
test('accepted R&B recipe preserves the saved glass effect and every user edit',()=>{
 const source=readFileSync('public/generated-flyers/rnb-thursdays.nflyer');
 const registered=readFileSync('public/generated-flyers/rnb-thursdays-updated.nflyer');
 assert.deepEqual(registered,source);
 const project=JSON.parse(registered.toString());
 for(const format of ['square','story']){
   const object=project.state.session[format].cocoCompositionSystem.compiledDocument.objects.find((o:any)=>o.id==='headline');
   assert.equal(object.paint.textEffect,GLASS_HEADLINE_EFFECT);
   assert.equal(object.editable,true);
 }
});
