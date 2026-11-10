import fs from 'fs';
import path from 'path';
import { mathjax } from 'mathjax-full/js/mathjax.js';
import { TeX } from 'mathjax-full/js/input/tex.js';
import { SVG } from 'mathjax-full/js/output/svg.js';
import { liteAdaptor } from 'mathjax-full/js/adaptors/liteAdaptor.js';
import { RegisterHTMLHandler } from 'mathjax-full/js/handlers/html.js';
import { AllPackages } from 'mathjax-full/js/input/tex/AllPackages.js';

const ROOT = process.cwd();
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
  },
});
const svg = new SVG({ fontCache: 'global' });
const doc = mathjax.document('', { InputJax: tex, OutputJax: svg });

const FIGW = {
  'figs__ch01_figs__wheel_roll.png': '100%',
  'figs__ch01_figs__pendulum.png': '250px',
  'figs__ch01_figs__unicycle.png': '460px',
  'figs__ch01_figs__diff_drive.png': '400px',
  'figs__ch01_figs__bicycle.png': '600px',
  'figs__ch02_figs__car.png': '600px',
  'figs__ch01_figs__integration_comparison.png': '600px',
  'figs__ch01_figs__nonholo_wheeled_robot.png': '460px',
};

const mathCache = new Map();
function renderMath(texSrc, display) {
  texSrc = texSrc.replace(/%[ \t]*\n/g, '');
  const key = (display ? 'D' : 'I') + texSrc;
  if (mathCache.has(key)) return mathCache.get(key);
  let out;
  try {
    const node = doc.convert(texSrc, { display, em: 16, ex: 8, containerWidth: 1000 });
    const html = adaptor.innerHTML(node);
    out = html;
  } catch (e) {
    out = '<code class="mathfail">' + escapeHtml(texSrc) + '</code>';
  }
  mathCache.set(key, out);
  return out;
}

function escapeHtml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// ---------- tokenize ----------
const raw = ['part1', 'part2', 'part3']
  .map((p) => fs.readFileSync(path.join(ROOT, 'content', p + '.md'), 'utf8'))
  .join('\n\n');

const lines = raw.split('\n');
const blocks = [];
let i = 0;
while (i < lines.length) {
  const line = lines[i];
  const t = line.trim();
  if (!t) { i++; continue; }

  // code fence
  if (t.startsWith('```')) {
    const lang = t.slice(3).trim();
    const buf = [];
    i++;
    while (i < lines.length && !lines[i].trim().startsWith('```')) { buf.push(lines[i]); i++; }
    i++;
    blocks.push({ type: 'code', lang, text: buf.join('\n') });
    continue;
  }
  // display math
  if (t.startsWith('$$')) {
    let head = t.slice(2);
    let label = null;
    const m = head.match(/^\s*\{#([\w.\-]+)\}\s*$/);
    if (m) { label = m[1]; head = ''; }
    const buf = [];
    if (head.trim()) buf.push(head);
    if (!(m || head.trim())) { i++; } else { i++; }
    while (i < lines.length && !lines[i].trim().startsWith('$$')) { buf.push(lines[i]); i++; }
    i++;
    blocks.push({ type: 'eq', tex: buf.join('\n').trim(), label });
    continue;
  }
  // card open / close
  if (t.startsWith(':::')) {
    const rest = t.slice(3).trim();
    if (!rest) { blocks.push({ type: 'close' }); i++; continue; }
    const kind = rest.split(/\s+/)[0];
    const title = rest.slice(kind.length).trim();
    blocks.push({ type: 'open', kind, title });
    i++;
    continue;
  }
  // heading
  const h = t.match(/^(#{1,4})\s+(.*)$/);
  if (h) { blocks.push({ type: 'h', level: h[1].length + 1, text: h[2] }); i++; continue; }
  // image
  const img = t.match(/^!\[(.*)\]\((.*)\)$/);
  if (img) { blocks.push({ type: 'fig', alt: img[1], src: img[2] }); i++; continue; }
  // list
  if (/^[-*]\s+/.test(t)) {
    const items = [];
    while (i < lines.length && /^[-*]\s+/.test(lines[i].trim())) {
      items.push(lines[i].trim().replace(/^[-*]\s+/, ''));
      i++;
    }
    blocks.push({ type: 'list', items });
    continue;
  }
  // paragraph
  const buf = [];
  while (i < lines.length) {
    const s = lines[i].trim();
    if (!s) break;
    if (s.startsWith('```') || s.startsWith('$$') || s.startsWith(':::') || /^#{1,4}\s/.test(s) ||
        /^!\[.*\]\(.*\)$/.test(s) || /^[-*]\s+/.test(s)) break;
    buf.push(s);
    i++;
  }
  blocks.push({ type: 'p', text: buf.join(' ') });
}

// ---------- inline renderer ----------
function inline(text, collect) {
  const parts = [];
  // protect math
  let s = text.replace(/\$([^$]+)\$/g, (m0, g1) => {
    const idx = parts.length;
    parts.push({ type: 'math', tex: g1 });
    return `\u0000${idx}\u0000`;
  });
  s = escapeHtml(s);
  // notes
  s = s.replace(/［旁注：(.*?)］/g, (m0, g1) => `<span class="mnote"><span class="mn-k">注</span>${g1}</span>`);
  // code
  s = s.replace(/`([^`]+)`/g, (m0, g1) => `<code>${g1}</code>`);
  // bold / italic
  s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  s = s.replace(/(^|[^*])\*([^*]+)\*/g, '$1<em>$2</em>');
  s = s.replace(/\u0000(\d+)\u0000/g, (m0, n) => {
    const p = parts[Number(n)];
    return `<span class="m">${renderMath(p.tex, false)}</span>`;
  });
  return s;
}

// ---------- build body ----------
const toc = [];
const out = [];
let card = null;
let openCard = null;
let secId = 0;
let h1Seen = false;

function slug(s) {
  return 's' + (++secId);
}

function pushCard(kind, title, body) {
  const label = kind === 'def' ? '定义' : kind === 'ex' ? '示例' : kind === 'algo' ? '算法' : '提示';
  return `<section class="card ${kind}"><div class="card-head"><span class="card-kind">${label}</span><span class="card-title">${inline(title)}</span></div><div class="card-body">${body.join('\n')}</div></section>`;
}

let cardBuf = null;

function flushCard() {
  if (!openCard) return;
  out.push(pushCard(openCard.kind, openCard.title, cardBuf));
  openCard = null;
  cardBuf = null;
}

for (const b of blocks) {
  const target = () => (cardBuf ? cardBuf : out);
  if (b.type === 'open') {
    flushCard();
    openCard = { kind: b.kind, title: b.title };
    cardBuf = [];
    continue;
  }
  if (b.type === 'close') { flushCard(); continue; }

  if (b.type === 'h') {
    if (openCard) { flushCard(); }
    const id = slug(b.text);
    if (b.level === 2) {
      out.push(`<h2 id="${id}">${inline(b.text)}</h2>`);
      toc.push({ id, level: 2, text: b.text });
    } else if (b.level === 3) {
      out.push(`<h3 id="${id}">${inline(b.text)}</h3>`);
      toc.push({ id, level: 3, text: b.text });
    } else {
      out.push(`<h4 id="${id}">${inline(b.text)}</h4>`);
    }
    continue;
  }
  if (b.type === 'eq') {
    const num = b.label && /^eq\d/.test(b.label) ? b.label.slice(2) : null;
    const inner = renderMath(b.tex, true);
    const idAttr = b.label ? ` id="eq-${b.label}"` : '';
    const cls = num ? 'eq' : 'eq plain';
    target().push(
      `<div class="${cls}"${idAttr}><div class="eq-body">${inner}</div>${num ? `<span class="eq-num">(${num})</span>` : ''}</div>`
    );
    continue;
  }
  if (b.type === 'code') {
    target().push(`<pre class="code"><code>${escapeHtml(b.text)}</code></pre>`);
    continue;
  }
  if (b.type === 'fig') {
    const abs = path.join(ROOT, b.src);
    const b64 = fs.readFileSync(abs).toString('base64');
    const w = FIGW[path.basename(b.src)] || '100%';
    target().push(`<figure><img style="max-width:${w}" src="data:image/png;base64,${b64}" alt="${escapeHtml(b.alt)}"><figcaption>${inline(b.alt)}</figcaption></figure>`);
    continue;
  }
  if (b.type === 'list') {
    target().push('<ul>' + b.items.map((it) => `<li>${inline(it)}</li>`).join('') + '</ul>');
    continue;
  }
  if (b.type === 'p') {
    target().push(`<p>${inline(b.text)}</p>`);
    continue;
  }
}
flushCard();

// ---------- font cache ----------
const defs = adaptor.outerHTML(svg.fontCache.getCache());

// ---------- TOC ----------
const tocHtml = toc
  .map((t) => `<li class="l${t.level}"><a href="#${t.id}">${inline(t.text)}</a></li>`)
  .join('\n');

const css = fs.readFileSync(path.join(ROOT, 'course.css'), 'utf8');
const js = fs.readFileSync(path.join(ROOT, 'course.js'), 'utf8');

const html = `<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>第 1 章 · 机器人动力学建模 | 机器人自主性原理（中文精译）</title>
<style>${css}</style>
</head>
<body>
<svg class="mjx-defs" aria-hidden="true" style="position:absolute;width:0;height:0;overflow:hidden">${defs}</svg>

<header class="topbar">
  <div class="topbar-in">
    <a class="brand" href="#top">机器人自主性原理 <span class="dot">·</span> 中文精译课程</a>
    <div class="topmeta">第 1 章 / 6 节 / 35 式 / 8 图 / 4 段代码</div>
  </div>
</header>

<div class="shell">
  <aside class="side">
    <div class="side-title">本章目录</div>
    <nav><ul class="toc">
${tocHtml}
    </ul></nav>
    <div class="side-foot">
      译文对应 <em>Principles of Robot Autonomy</em> 第 1 章<br>
      Modeling Robot Dynamics
    </div>
  </aside>

  <main class="main" id="top">
    <div class="crumb">第 1 章 · 机器人动力学建模</div>
    <h1>机器人动力学建模</h1>
    <p class="lede">从状态空间模型出发，用运动学与动力学把机器人的物理运动写成可仿真的微分方程：广义坐标、普法夫约束、完整与非完整约束、独轮车与差速驱动模型，最后落到欧拉法、中点法与 RK4 的数值积分实现。</p>
    <div class="meta">
      <span>预计阅读 35 分钟</span><span>公式 35 个</span><span>图 8 幅</span><span>代码 4 段</span>
    </div>

${out.join('\n')}

    <div class="srcnote">
      <strong>译文说明</strong>
      <p>本页是 <a href="https://porabook.com/book/modeling-robot-dynamics/" target="_blank" rel="noopener">porabook.com/book/modeling-robot-dynamics</a>（<em>Principles of Robot Autonomy</em> 第 1 章，Stanford ASL）的中文翻译课程版。正文、公式、图与代码均对应原文，公式编号沿用原文（1.1–1.35）；原文的边注（margin note）以浅色小字随文标出；原文中的习题 notebook 仓库链接保持原样。译文用于学习与内部阅读，版权归原作者。</p>
    </div>
  </main>
</div>
<script>${js}</script>
</body>
</html>`;

fs.writeFileSync(path.join(ROOT, '机器人动力学建模-中文课程.html'), html);
const size = fs.statSync(path.join(ROOT, '机器人动力学建模-中文课程.html')).size;
console.log('blocks:', blocks.length, 'toc:', toc.length, 'math:', mathCache.size, 'size:', (size / 1048576).toFixed(2), 'MB');
