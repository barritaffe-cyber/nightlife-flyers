import {readFileSync,writeFileSync} from 'node:fs';
import {layoutWhimsicalWord} from '../lib/whimsicalWordLayout.ts';
const data=JSON.parse(readFileSync('lib/whimsicalSvgData.json','utf8'));
const l=layoutWhimsicalWord('Brunch',data,0),[,,w,h]=l.viewBox;
// Mirror the shared runtime SVG wrapper in the construction preview. The hidden
// source word remains a text owner for compilation, never a flattened headline.
const paths=l.letters.map(o=>`<path d="${o.glyph.path}" transform="${o.transform}"/>`).join('')+l.ornaments.map(o=>`<path d="${o.path}" transform="${o.transform}"/>`).join('');
const word=`<span style="position:absolute;opacity:0">Brunch</span><span style="display:inline-block;vertical-align:middle"><span style="display:block;line-height:inherit"><svg xmlns="http://www.w3.org/2000/svg" viewBox="${l.viewBox.join(' ')}" width="${w/1000}em" height="${h/1000}em" style="display:inline-block;vertical-align:${-(l.viewBox[1]+h)/1000}em;overflow:visible;filter:drop-shadow(2px 3px 0 #14a7a7);text-shadow:none"><g fill="currentColor">${paths}</g></svg></span></span>`;
const file='public/generated-flyers/brunch-sundays-master.html';
const html=readFileSync(file,'utf8').replace(/(<div class="text headline"[^>]*>)[\s\S]*?(<\/div>)/,`$1${word}$2`);
writeFileSync(file,html);
