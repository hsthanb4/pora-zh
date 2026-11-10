// 公式自检：node check.mjs [content/chNN.md ...]
import fs from 'fs';
import { mathjax } from 'mathjax-full/js/mathjax.js';
import { TeX } from 'mathjax-full/js/input/tex.js';
import { SVG } from 'mathjax-full/js/output/svg.js';
import { liteAdaptor } from 'mathjax-full/js/adaptors/liteAdaptor.js';
import { RegisterHTMLHandler } from 'mathjax-full/js/handlers/html.js';
import { AllPackages } from 'mathjax-full/js/input/tex/AllPackages.js';

const adaptor = liteAdaptor();
RegisterHTMLHandler(adaptor);
const tex = new TeX({
  packages: AllPackages,
  macros: { bm: ['\\boldsymbol{#1}', 1], coloneqq: '\\mathrel{:=}' },
});
const svg = new SVG({ fontCache: 'global' });
const doc = mathjax.document('', { InputJax: tex, OutputJax: svg });

const files = process.argv.slice(2).length
  ? process.argv.slice(2)
  : fs.readdirSync('content').filter((f) => f.endsWith('.md')).map((f) => 'content/' + f);

let bad = 0, n = 0;
for (const f of files) {
  const raw = fs.readFileSync(f, 'utf8').replace(/```[\s\S]*?```/g, '');
  const fails = [];
  for (const m of raw.matchAll(/\$\$(\{#[\w.\-]+\})?([\s\S]*?)\$\$/g)) {
    n++;
    const src = m[2].trim().replace(/%[ \t]*\n/g, '');
    if (adaptor.innerHTML(doc.convert(src, { display: true })).includes('merror')) fails.push('display: ' + src.slice(0, 90).replace(/\n/g, '⏎'));
  }
  const noDisplay = raw.replace(/\$\$[\s\S]*?\$\$/g, '');
  for (const m of noDisplay.matchAll(/\$([^$\n]+)\$/g)) {
    n++;
    const src = m[1].replace(/%[ \t]*\n/g, '');
    if (adaptor.innerHTML(doc.convert(src, { display: false })).includes('merror')) fails.push('inline: ' + src.slice(0, 90));
  }
  if (fails.length) { bad += fails.length; console.log(`✗ ${f}  ${fails.length} 处失败`); fails.slice(0, 5).forEach((x) => console.log('   ', x)); }
  else console.log(`✓ ${f}`);
}
console.log(`公式 ${n} 个，失败 ${bad} 处`);
process.exit(bad ? 1 : 0);
