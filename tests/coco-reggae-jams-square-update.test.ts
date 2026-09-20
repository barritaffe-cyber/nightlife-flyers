import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import test from 'node:test';

const project=JSON.parse(readFileSync('public/generated-flyers/reggae-jams.nflyer','utf8'));
const hash=(value:any)=>createHash('sha256').update(JSON.stringify(value)).digest('hex');

test('latest Reggae Jams format updates preserve accepted Square and promote Story',()=>{
 assert.equal(hash(project.state.session.square),'f9aa2a9a0eee0bf9cffbc8ca13055287d71641c07b0de75c7cc2b3de3efae86b');
 assert.equal(hash(project.state.session.story),'fe904befb5ffe5c43b30a82fc8fbbfce971fc11111feb3fccbd6fc3c0ece6b37');
 assert.notEqual(hash(project.state.session.story),'7033fbe29dee013a147a683d1093d3957ea292e003074e0451de89c165293318');
 assert.equal(project.state.format,'square');
});
