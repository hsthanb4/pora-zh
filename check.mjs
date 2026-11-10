import fs from 'fs';
import { mathjax } from 'mathjax-full/js/mathjax.js';
import { TeX } from 'mathjax-full/js/input/tex.js';
import { SVG } from 'mathjax-full/js/output/svg.js';
import { liteAdaptor } from 'mathjax-full/js/adaptors/liteAdaptor.js';
import { RegisterHTMLHandler } from 'mathjax-full/js/handlers/html.js';
import { AllPackages } from 'mathjax-full/js/input/tex/AllPackages.js';
const adaptor = liteAdaptor(); RegisterHTMLHandler(adaptor);
const tex = new TeX({ packages: AllPackages, macros: { bm: ['\\boldsymbol{#1}', 1], coloneqq: '\\mathrel{:=}' } });
const svg = new SVG({ fontCache: 'global' });
const doc = mathjax.document('', { InputJax: tex, OutputJax: svg });
const raw = ['part1','part2','part3'].map(p=>fs.readFileSync('content/'+p+'.md','utf8')).join('\n');
// display math blocks
const re = /\$\$(\{#[\w.\-]+\})?([\s\S]*?)\$\$/g;
let m, n=0, bad=0;
while ((m = re.exec(raw))) {
  const src = m[2].trim().replace(/%[ \t]*\n/g,''); n++;
  const out = adaptor.innerHTML(doc.convert(src, {display:true}));
  if (out.includes('merror')) { bad++; console.log('--- DISPLAY FAIL', m[1]||'', '\n', src.slice(0,200).replace(/\n/g,'⏎')); }
}
// inline math
const re2 = /\$([^$\n]+)\$/g;
while ((m = re2.exec(raw))) {
  const src = m[1].replace(/%[ \t]*\n/g,'');
  if (src.startsWith('$')) continue;
  const out = adaptor.innerHTML(doc.convert(src, {display:false}));
  if (out.includes('merror')) { bad++; console.log('--- INLINE FAIL:', src.slice(0,120)); }
}
console.log('display blocks:', n, 'failures:', bad);
