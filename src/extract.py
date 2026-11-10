import re, html, sys
from bs4 import BeautifulSoup, NavigableString, Tag

src, dst = sys.argv[1], sys.argv[2]
s = open(src, encoding='utf-8', errors='ignore').read()
m = re.search(r'<article[^>]*>(.*?)</article>', s, flags=re.S)
if not m:
    print('no article', src); sys.exit(1)
soup = BeautifulSoup(m.group(1), 'html.parser')

def mtext(x): return html.unescape(x.get('alttext') or x.get_text())

def inline(node):
    out = []
    for c in node.children:
        if isinstance(c, NavigableString):
            out.append(re.sub(r'\s+', ' ', str(c)))
        elif isinstance(c, Tag):
            name, cls = c.name, ' '.join(c.get('class') or [])
            toks = cls.split()
            if name == 'math': out.append('$' + mtext(c) + '$')
            elif name in ('em','i'): out.append('*' + inline(c).strip() + '*')
            elif name in ('strong','b'): out.append('**' + inline(c).strip() + '**')
            elif name == 'code': out.append('`' + c.get_text() + '`')
            elif name == 'br': out.append('\n')
            elif 'ltx_tag' in toks or 'ltx_note_mark' in toks or 'ltx_note_type' in toks: continue
            elif 'ltx_note' in toks:
                from copy import copy as _c
                c2 = _c(c)
                for n in c2.find_all(class_='ltx_note'): n.decompose()
                t = inline(c2).strip()
                if t: out.append('［旁注：' + t + '］')
            elif name == 'img': continue
            else: out.append(inline(c))
    t = ''.join(out)
    t = re.sub(r'[ \t]+', ' ', t)
    return re.sub(r' *\n *', ' ', t)

def block(node):
    lines = []
    for c in node.children:
        if isinstance(c, NavigableString):
            t = re.sub(r'\s+', ' ', str(c)).strip()
            if t: lines.append(t)
            continue
        if not isinstance(c, Tag): continue
        name, cls = c.name, ' '.join(c.get('class') or [])
        toks = cls.split()
        if name == 'section': lines.extend(block(c))
        elif name in ('h1','h2','h3','h4','h5','h6'):
            lvl = max(2, int(name[1]))
            t = inline(c).strip()
            if lvl == 2: t = re.sub(r'^\d+(\.\d+)*\s*', '', t)
            if t: lines.append('\n' + '#'*lvl + ' ' + t + '\n')
        elif name == 'p':
            t = inline(c).strip()
            if t: lines.append(t)
        elif name == 'figure':
            imgs = c.find_all('img')
            cap = c.find('figcaption')
            cap_txt = inline(cap).strip() if cap else ''
            if cap_txt:
                tg = c.find(class_='ltx_tag')
                tgs = re.sub(r'\s+', ' ', tg.get_text()).strip().rstrip(':') if tg else ''
                cap_txt = re.sub(r'^(Figure|Algorithm)\s+[\d.]+\s*[:.]?\s*', '', cap_txt)
                if tgs: cap_txt = tgs + ': ' + cap_txt
            for im in imgs:
                lines.append('\n![%s](%s)\n' % (cap_txt if im is imgs[0] else '', im.get('src') or ''))
            # 图里还可能嵌着公式面板 / 文字面板
            for ch in c.children:
                if isinstance(ch, Tag) and ch.name in ('img', 'figcaption'):
                    continue
                if isinstance(ch, NavigableString):
                    t = re.sub(r'\s+', ' ', str(ch)).strip()
                    if t: lines.append(t)
                    continue
                lines.extend(block(ch))
        elif name == 'table' and 'ltx_equationgroup' in toks:
            tag = c.find(class_='ltx_tag_equationgroup')
            num = re.sub(r'[()\s]', '', tag.get_text()) if tag else ''
            if not num:
                # 每行各自编号的公式组：逐行输出
                for tr in c.find_all('tr', class_=re.compile('ltx_eqn_row')):
                    parts = [mtext(m) for m in tr.find_all('math')]
                    if not parts: continue
                    rt = tr.find(class_='ltx_tag_equation')
                    rn = re.sub(r'[()\s]', '', rt.get_text()) if rt else ''
                    lines.append('\n' + ('$${#eq%s}' % rn if rn else '$$') + '\n' + ' '.join(parts) + '\n$$\n')
                continue
            rows = []
            for tr in c.find_all('tr'):
                parts = [mtext(m) for m in tr.find_all('math')]
                if parts: rows.append(' '.join(parts))
            if rows:
                body = '\\begin{aligned}\n' + '\\\\\n'.join(rows) + '\n\\end{aligned}'
                opener = '$${#eq%s}' % num if num else '$$'
                lines.append('\n' + opener + '\n' + body + '\n$$\n')
        elif name == 'table' and 'ltx_equation' in toks:
            mm = c.find('math')
            tag = c.find(class_='ltx_tag_equation')
            num = re.sub(r'[()\s]', '', tag.get_text()) if tag else ''
            opener = '$${#eq%s}' % num if num else '$$'
            lines.append('\n' + opener + '\n' + (mtext(mm) if mm is not None else inline(c).strip()) + '\n$$\n')
        elif name == 'table': lines.append('\n' + str(c) + '\n')
        elif name in ('ul','ol'):
            for li in c.find_all('li', recursive=False):
                sub = block(li)
                if not sub: continue
                first = sub[0].strip()
                lines.append('- ' + first)
                lines.extend(sub[1:])
            lines.append('')
        elif 'ltx_theorem' in toks:
            kind = 'def'
            for t in toks:
                if t.startswith('ltx_theorem_'):
                    k = t[len('ltx_theorem_'):]
                    if k in ('example', 'problem'): kind = 'ex'
                    elif k in ('algorithm',): kind = 'algo'
                    elif k in ('theorem', 'lemma', 'proposition', 'corollary'): kind = 'thm'
                    elif k in ('remark', 'note', 'observation'): kind = 'note'
                    break
            title = c.find(class_='ltx_title')
            tt = inline(title).strip() if title else ''
            tag = c.find(class_='ltx_tag')
            if tag:
                tg = re.sub(r'\s+', ' ', tag.get_text()).strip().rstrip(':')
                if tg and not tt.startswith(tg):
                    tt = (tg + ' ' + tt).strip()
            body = []
            for ch in c.children:
                if isinstance(ch, Tag) and 'ltx_title' in (ch.get('class') or []):
                    continue
                if isinstance(ch, NavigableString):
                    t = re.sub(r'\s+', ' ', str(ch)).strip()
                    if t: body.append(t)
                    continue
                body.extend(block(ch))
            body = [b.strip() for b in body if b.strip()]
            lines.append('\n::: %s %s\n%s\n:::\n' % (kind, tt, '\n\n'.join(body)))
        elif 'ltx_listing' in toks or name == 'pre':
            lines.append('\n```\n' + c.get_text() + '\n```\n')
        else: lines.extend(block(c))
    return [l for l in lines if l.strip()]

md = re.sub(r'\n{3,}', '\n\n', '\n\n'.join(block(soup)))
# 去掉网页尾部站点组件（勘误按钮 / notebook 链接 / 上下章导航 / 内联脚本）
cut = len(md)
for pat in [r'^#*\s*Spotted an error\?', r'^#*\s*Practice · \d+ notebooks?', r'^Previous$', r'^Report erratum$']:
    m = re.search(pat, md, flags=re.M)
    if m: cut = min(cut, m.start())
md = md[:cut].rstrip()
open(dst, 'w', encoding='utf-8').write(md)
