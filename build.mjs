// 多章站点构建：content/chNN.md -> docs/chNN.html，另生成 docs/index.html
import fs from 'fs';
import path from 'path';
import { mathjax } from 'mathjax-full/js/mathjax.js';
import { TeX } from 'mathjax-full/js/input/tex.js';
import { SVG } from 'mathjax-full/js/output/svg.js';
import { liteAdaptor } from 'mathjax-full/js/adaptors/liteAdaptor.js';
import { RegisterHTMLHandler } from 'mathjax-full/js/handlers/html.js';
import { AllPackages } from 'mathjax-full/js/input/tex/AllPackages.js';

const ROOT = process.cwd();
const OUT = path.join(ROOT, 'docs');
const adaptor = liteAdaptor();
RegisterHTMLHandler(adaptor);
const tex = new TeX({
  packages: AllPackages,
  macros: {
    bm: ['\\boldsymbol{#1}', 1],
    coloneqq: '\\mathrel{:=}',
    qquad: '\\quad\\quad',
    implies: '\\;\\Longrightarrow\\;',
    dd: '\\mathrm{d}',
    allowbreak: '',
    textsc: ['\\text{#1}', 1],
  },
});
const svg = new SVG({ fontCache: 'global' });
const doc = mathjax.document('', { InputJax: tex, OutputJax: svg });

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const mathCache = new Map();
function renderMath(src, display) {
  src = src.replace(/%[ \t]*\n/g, '');
  const key = (display ? 'D' : 'I') + src;
  if (mathCache.has(key)) return mathCache.get(key);
  let out;
  try {
    out = adaptor.innerHTML(doc.convert(src, { display, em: 16, ex: 8, containerWidth: 1000 }));
  } catch (e) {
    out = '<code class="mathfail">' + esc(src) + '</code>';
  }
  mathCache.set(key, out);
  return out;
}

// ---------- 轻量标记解析 ----------
function tokenize(raw) {
  const lines = raw.split('\n');
  const blocks = [];
  let i = 0;
  while (i < lines.length) {
    const t = lines[i].trim();
    if (!t) { i++; continue; }
    if (t.startsWith('```')) {
      const lang = t.slice(3).trim();
      const buf = []; i++;
      while (i < lines.length && !lines[i].trim().startsWith('```')) { buf.push(lines[i]); i++; }
      i++;
      blocks.push({ type: 'code', lang, text: buf.join('\n') });
      continue;
    }
    if (t.startsWith('$$')) {
      let head = t.slice(2), label = null;
      const m = head.match(/^\s*\{#([\w.\-]+)\}\s*$/);
      if (m) { label = m[1]; head = ''; }
      const buf = [];
      if (head.trim()) buf.push(head);
      i++;
      while (i < lines.length && !lines[i].trim().startsWith('$$')) { buf.push(lines[i]); i++; }
      i++;
      blocks.push({ type: 'eq', tex: buf.join('\n').trim(), label });
      continue;
    }
    if (t.startsWith(':::')) {
      const rest = t.slice(3).trim();
      if (!rest) { blocks.push({ type: 'close' }); i++; continue; }
      const kind = rest.split(/\s+/)[0];
      blocks.push({ type: 'open', kind, title: rest.slice(kind.length).trim() });
      i++;
      continue;
    }
    const h = t.match(/^(#{1,4})\s+(.*)$/);
    if (h) { blocks.push({ type: 'h', level: h[1].length + 1, text: h[2] }); i++; continue; }
    const img = t.match(/^!\[(.*)\]\((.*)\)$/);
    if (img) { blocks.push({ type: 'fig', alt: img[1], src: img[2] }); i++; continue; }
    if (/^[-*]\s+/.test(t)) {
      const items = [];
      while (i < lines.length && /^[-*]\s+/.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^[-*]\s+/, '')); i++;
      }
      blocks.push({ type: 'list', items });
      continue;
    }
    // table
    if (t.startsWith('|') && t.endsWith('|') && t.includes('|')) {
      const rows = [];
      while (i < lines.length && lines[i].trim().startsWith('|') && lines[i].trim().endsWith('|')) {
        const rowStr = lines[i].trim();
        if (!/^\|[\s\-:|]+\|$/.test(rowStr)) {
          const cells = rowStr.slice(1, -1).split('|').map((c) => c.trim());
          rows.push(cells);
        }
        i++;
      }
      if (rows.length > 0) {
        blocks.push({ type: 'table', header: rows[0], rows: rows.slice(1) });
        continue;
      }
    }
    const buf = [];
    while (i < lines.length) {
      const s = lines[i].trim();
      if (!s) break;
      if (s.startsWith('```') || s.startsWith('$$') || s.startsWith(':::') || /^#{1,4}\s/.test(s) ||
          /^!\[.*\]\(.*\)$/.test(s) || /^[-*]\s+/.test(s) || (s.startsWith('|') && s.endsWith('|'))) break;
      buf.push(s); i++;
    }
    blocks.push({ type: 'p', text: buf.join(' ') });
  }
  return blocks;
}

function makeInline() {
  return function inline(text) {
    const parts = [];
    let s = text.replace(/\$([^$]+)\$/g, (m0, g1) => {
      parts.push(g1);
      return `\u0000${parts.length - 1}\u0000`;
    });
    s = esc(s);
    s = s.replace(/［旁注：(.*?)］/g, (m0, g1) => `<span class="mnote"><span class="mn-k">注</span>${g1}</span>`);
    s = s.replace(/`([^`]+)`/g, (m0, g1) => `<code>${g1}</code>`);
    s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    s = s.replace(/(^|[^*])\*([^*]+)\*/g, '$1<em>$2</em>');
    s = s.replace(/\u0000(\d+)\u0000/g, (m0, n) => `<span class="m">${renderMath(parts[Number(n)], false)}</span>`);
    return s;
  };
}

const FIGW = {
  'figs__ch01_figs__pendulum.png': '250px',
  'figs__ch01_figs__unicycle.png': '460px',
  'figs__ch01_figs__diff_drive.png': '400px',
};

function buildChapter(ch, prev, next) {
  const mdPath = path.join(ROOT, 'content', `ch${ch.n}.md`);
  let raw;
  if (fs.existsSync(mdPath)) {
    raw = fs.readFileSync(mdPath, 'utf8');
  } else {
    // 分片合并：chNN.a.md + chNN.b.md
    const parts = ['a', 'b'].map((x) => path.join(ROOT, 'content', `ch${ch.n}.${x}.md`));
    raw = parts.filter((f) => fs.existsSync(f)).map((f) => fs.readFileSync(f, 'utf8')).join('\n\n');
  }
  const inline = makeInline();
  const blocks = tokenize(raw);
  const toc = [];
  const out = [];
  let secId = 0, openCard = null, cardBuf = null;

  const flushCard = () => {
    if (!openCard) return;
    const label = { def: '定义', ex: '示例', thm: '定理', algo: '算法', note: '提示' }[openCard.kind] || '提示';
    out.push(`<section class="card ${openCard.kind}"><div class="card-head"><span class="card-kind">${label}</span><span class="card-title">${inline(openCard.title)}</span></div><div class="card-body">${cardBuf.join('\n')}</div></section>`);
    openCard = null; cardBuf = null;
  };

  for (const b of blocks) {
    const tgt = () => (cardBuf || out);
    if (b.type === 'open') { flushCard(); openCard = { kind: b.kind, title: b.title }; cardBuf = []; continue; }
    if (b.type === 'close') { flushCard(); continue; }
    if (b.type === 'h') {
      flushCard();
      const id = 's' + (++secId);
      if (b.level === 2) { out.push(`<h2 id="${id}">${inline(b.text)}</h2>`); toc.push({ id, level: 2, text: b.text }); }
      else if (b.level === 3) { out.push(`<h3 id="${id}">${inline(b.text)}</h3>`); toc.push({ id, level: 3, text: b.text }); }
      else out.push(`<h4 id="${id}">${inline(b.text)}</h4>`);
      continue;
    }
    if (b.type === 'eq') {
      const num = b.label && /^eq\d/.test(b.label) ? b.label.slice(2) : null;
      const inner = renderMath(b.tex, true);
      tgt().push(`<div class="${num ? 'eq' : 'eq plain'}"${b.label ? ` id="eq-${b.label}"` : ''}><div class="eq-body">${inner}</div>${num ? `<span class="eq-num">(${num})</span>` : ''}</div>`);
      continue;
    }
    if (b.type === 'table') {
      const ths = b.header.map((c) => `<th>${inline(c)}</th>`).join('');
      const trs = b.rows.map((r) => `<tr>${r.map((c) => `<td>${inline(c)}</td>`).join('')}</tr>`).join('\n');
      tgt().push(`<div class="tbl-wrap"><table><thead><tr>${ths}</tr></thead><tbody>${trs}</tbody></table></div>`);
      continue;
    }
    if (b.type === 'code') { tgt().push(`<pre class="code"><code>${esc(b.text)}</code></pre>`); continue; }
    if (b.type === 'fig') {
      const base = path.basename(b.src);
      const isSvg = base.toLowerCase().endsWith('.svg');
      const imgRel = `assets/ch${ch.n}/${isSvg ? base : base.replace(/\.png$/i, '.webp')}`;
      const abs = path.join(ROOT, imgRel);
      if (!fs.existsSync(abs)) { console.warn('  ! 缺图', imgRel); continue; }
      const w = FIGW[base] || '100%';
      const caption = b.alt ? `<figcaption>${inline(b.alt)}</figcaption>` : '';
      tgt().push(`<figure><img style="max-width:${w}" src="${imgRel}" alt="${esc(b.alt)}" loading="lazy">${caption}</figure>`);
      continue;
    }
    if (b.type === 'list') { tgt().push('<ul>' + b.items.map((it) => `<li>${inline(it)}</li>`).join('') + '</ul>'); continue; }
    if (b.type === 'p') { tgt().push(`<p>${inline(b.text)}</p>`); continue; }
  }
  flushCard();

  const defs = adaptor.outerHTML(svg.fontCache.getCache());
  const tocHtml = toc.map((t) => `<li class="l${t.level}"><a href="#${t.id}">${inline(t.text)}</a></li>`).join('\n');
  const nav = [];
  if (prev) nav.push(`<a class="pg" href="ch${prev.n}.html">← 第 ${Number(prev.n)} 章 ${prev.zh}</a>`);
  if (next) nav.push(`<a class="pg" href="ch${next.n}.html">第 ${Number(next.n)} 章 ${next.zh} →</a>`);

  return `<!doctype html>
<html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>第 ${Number(ch.n)} 章 · ${ch.zh} | 机器人自主性原理 中文精译</title>
<link rel="stylesheet" href="course.css">
</head><body>
<svg class="mjx-defs" aria-hidden="true" style="position:absolute;width:0;height:0;overflow:hidden">${defs}</svg>
<header class="topbar"><div class="topbar-in">
<a class="brand" href="index.html">机器人自主性原理 <span class="dot">·</span> 中文精译课程</a>
<div class="topmeta">第 ${Number(ch.n)} 章 / ${ch.en}</div>
</div></header>
<div class="shell">
<aside class="side">
<div class="side-title">本章目录</div>
<nav><ul class="toc">
${tocHtml}
</ul></nav>
<div class="side-foot"><a href="index.html">← 全部章节</a></div>
</aside>
<main class="main" id="top">
<div class="crumb">第 ${Number(ch.n)} 章 · ${ch.en}</div>
<h1>${ch.zh}</h1>
${out.join('\n')}
<div class="pagenav">${nav.join('')}</div>
</main>
</div>
<script src="course.js"></script>
</body></html>`;
}

function buildIndex(chapters, built) {
  const rows = chapters.map((c) => {
    const ok = built.has(c.n);
    const ex = c.ex ? `<span class="exn">${c.ex} 练习</span>` : '';
    const tag = ok ? '' : '<span class="tag">待译</span>';
    const inner = `<span class="cn">${c.n}</span><span class="ct">${c.zh}</span><span class="ce">${c.en}</span><span class="rt">${ex}${tag}</span>`;
    return `<li class="${ok ? 'ok' : 'todo'}">${ok ? `<a href="ch${c.n}.html">${inner}</a>` : `<span class="dis">${inner}</span>`}</li>`;
  }).join('\n');
  const n = built.size;
  return `<!doctype html>
<html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>机器人自主性原理 · 中文精译课程</title>
<link rel="stylesheet" href="course.css">
</head><body class="home">
<header class="topbar"><div class="topbar-in">
<a class="brand" href="index.html">机器人自主性原理 <span class="dot">·</span> 中文精译课程</a>
<div class="topmeta">${n} / ${chapters.length} 章已译</div>
</div></header>
<div class="wrap">
<h1 class="homeh1">机器人自主性原理</h1>
<p class="homesub">Principles of Robot Autonomy · 中文精译课程</p>
<p class="homeled">全 19 章，从动力学建模、开环/闭环控制、运动规划，到感知、定位与 SLAM、决策与学习。每章保留原文的公式编号、插图与练习，公式离线渲染，可逐章顺序读。</p>
<ul class="chlist">
${rows}
</ul>
<div class="srcnote"><strong>来源与声明</strong>
<p>本课程是 <a href="https://porabook.com/" target="_blank" rel="noopener">porabook.com</a> 上 <em>Principles of Robot Autonomy</em>（Stanford ASL）的中文翻译，用于学习与研究。原文文字、公式与插图版权归原作者及出版方所有；如权利人提出要求，将立即下架。</p></div>
</div>
</body></html>`;
}

// ---------- main ----------
fs.mkdirSync(OUT, { recursive: true });
const chapters = JSON.parse(fs.readFileSync(path.join(ROOT, 'src', 'chapters.json'), 'utf8'));
const built = new Set();
const hasContent = (n) => ['', '.a'].some((x) => fs.existsSync(path.join(ROOT, 'content', `ch${n}${x}.md`)));
for (const c of chapters) if (hasContent(c.n)) built.add(c.n);

for (const f of ['course.css', 'course.js']) fs.copyFileSync(path.join(ROOT, f), path.join(OUT, f));
fs.mkdirSync(path.join(OUT, 'assets'), { recursive: true });
for (const c of chapters) {
  if (!built.has(c.n)) continue;
  const src = path.join(ROOT, 'assets', `ch${c.n}`);
  if (!fs.existsSync(src)) continue;
  const dst = path.join(OUT, 'assets', `ch${c.n}`);
  fs.mkdirSync(dst, { recursive: true });
  for (const f of fs.readdirSync(src)) {
    if (f.endsWith('.webp') || f.endsWith('.svg')) {
      fs.copyFileSync(path.join(src, f), path.join(dst, f));
    }
  }
}

let total = 0;
chapters.forEach((c, idx) => {
  if (!built.has(c.n)) return;
  const prev = chapters.slice(0, idx).reverse().find((x) => built.has(x.n)) || null;
  const next = chapters.slice(idx + 1).find((x) => built.has(x.n)) || null;
  const html = buildChapter(c, prev, next);
  fs.writeFileSync(path.join(OUT, `ch${c.n}.html`), html);
  total += html.length;
  console.log(`  ch${c.n}.html  ${(html.length / 1024).toFixed(0)}KB  ${c.zh}`);
});
fs.writeFileSync(path.join(OUT, 'index.html'), buildIndex(chapters, built));
console.log(`已构建 ${built.size}/${chapters.length} 章，HTML 合计 ${(total / 1048576).toFixed(2)}MB`);
