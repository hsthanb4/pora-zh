import re, html
from bs4 import BeautifulSoup, NavigableString, Tag

s = open('page.html', encoding='utf-8', errors='ignore').read()
art = re.search(r'<article[^>]*>(.*?)</article>', s, flags=re.S).group(1)
soup = BeautifulSoup(art, 'html.parser')

def mtext(m):
    return html.unescape(m.get('alttext') or m.get_text())

def inline(node):
    out = []
    for c in node.children:
        if isinstance(c, NavigableString):
            out.append(re.sub(r'\s+', ' ', str(c)))
        elif isinstance(c, Tag):
            name, cls = c.name, ' '.join(c.get('class') or [])
            if name == 'math':
                out.append('$' + mtext(c) + '$')
            elif name in ('em', 'i'):
                out.append('*' + inline(c).strip() + '*')
            elif name in ('strong', 'b'):
                out.append('**' + inline(c).strip() + '**')
            elif name == 'code':
                out.append('`' + c.get_text() + '`')
            elif name == 'br':
                out.append('\n')
            elif cls.split() and ('ltx_tag' in cls.split() or 'ltx_note_mark' in cls.split() or 'ltx_note_type' in cls.split()):
                continue
            elif 'ltx_note' in cls.split():
                from copy import copy as _copy
                c2 = _copy(c)
                for n in c2.find_all(class_='ltx_note'):
                    n.decompose()
                txt = inline(c2).strip()
                if txt:
                    out.append('［旁注：' + txt + '］')
            elif name == 'img':
                continue
            else:
                out.append(inline(c))
    txt = ''.join(out)
    txt = re.sub(r'[ \t]+', ' ', txt)
    txt = re.sub(r' *\n *', ' ', txt)
    return txt

def block(node):
    lines = []
    for c in node.children:
        if isinstance(c, NavigableString):
            t = re.sub(r'\s+', ' ', str(c)).strip()
            if t: lines.append(t)
            continue
        if not isinstance(c, Tag):
            continue
        name, cls = c.name, ' '.join(c.get('class') or [])
        if name == 'section':
            lines.extend(block(c))
        elif name in ('h1','h2','h3','h4','h5','h6'):
            lvl = max(2, int(name[1]))
            t = inline(c).strip()
            if lvl == 2: t = re.sub(r'^\d+(\.\d+)*\s*', '', t)
            if t: lines.append('\n' + '#'*lvl + ' ' + t + '\n')
        elif name == 'p':
            t = inline(c).strip()
            if t: lines.append(t)
        elif name == 'figure':
            img = c.find('img'); cap = c.find('figcaption')
            cap = inline(cap).strip() if cap else ''
            cap = re.sub(r'^Figure\s+[\d.]+\s*:\s*', '', cap)
            lines.append('\n![%s](%s)\n' % (cap, img.get('src') if img else ''))
        elif name == 'table' and 'ltx_equation' in cls:
            mm = c.find('math')
            lines.append('\n$$\n' + (mtext(mm) if mm is not None else inline(c).strip()) + '\n$$\n')
        elif name == 'table':
            lines.append('\n' + str(c) + '\n')
        elif name in ('ul','ol'):
            for li in c.find_all('li', recursive=False):
                lines.append('- ' + inline(li).strip())
            lines.append('')
        elif 'ltx_theorem' in cls:
            title = c.find(class_='ltx_title')
            tt = inline(title).strip() if title else ''
            body = []
            for ch in c.children:
                if isinstance(ch, Tag) and 'ltx_title' in ' '.join(ch.get('class') or []):
                    continue
                if isinstance(ch, NavigableString):
                    t = re.sub(r'\s+', ' ', str(ch)).strip()
                    if t: body.append(t)
                    continue
                body.extend(block(ch))
            body = [b.strip() for b in body if b.strip()]
            lines.append('\n> **' + tt + '**\n>\n> ' + '\n>\n> '.join(body) + '\n')
        elif 'ltx_listing' in cls or name == 'pre':
            lines.append('\n```\n' + c.get_text() + '\n```\n')
        else:
            lines.extend(block(c))
    return [l for l in lines if l.strip()]

md = '\n\n'.join(block(soup))
md = re.sub(r'\n{3,}', '\n\n', md)
open('source.md','w',encoding='utf-8').write(md)
print(len(md), 'chars,', md.count('\n'), 'lines')
