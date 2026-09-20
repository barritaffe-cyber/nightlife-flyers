import test from 'node:test';
import assert from 'node:assert/strict';
import {tokenizeCssResources} from '../lib/coco/cssResources.ts';
test('large assets round-trip and duplicate resources reuse tokens',()=>{
  const asset='data:image/png;base64,'+'A'.repeat(12_000_000);
  const source=`<img src="${asset}"><style>.a{background:url('${asset}')}</style>`;
  const resources:string[]=[];
  const tokenized=tokenizeCssResources(source,resources);
  assert.equal(resources.length,1);
  assert.equal(tokenized.replaceAll('__EXISTING_RESOURCE_0__',resources[0]),source);
  assert.equal(tokenizeCssResources(source,resources),tokenized);
  assert.equal(resources.length,1);
});
test('preserves non-base64 data and tokenizes font and image separately',()=>{
  const resources:string[]=[];
  const result=tokenizeCssResources('data:unknown x data:image/svg+xml,hi url(data:font/otf;base64,AAAA=) data:image/png;base64,BBBB=',resources);
  assert.equal(result,'data:unknown x data:image/svg+xml,hi url(__EXISTING_RESOURCE_0__) __EXISTING_RESOURCE_1__');
});
