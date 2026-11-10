from PIL import Image
import glob, os, sys
MAXW = 1600
for f in sorted(glob.glob('assets/ch*/*.png')):
    out = f[:-4] + '.webp'
    if os.path.exists(out): continue
    im = Image.open(f).convert('RGBA')
    w, h = im.size
    if w > MAXW:
        im = im.resize((MAXW, round(h * MAXW / w)), Image.LANCZOS)
    im.save(out, 'WEBP', quality=90, method=6)
    print(f'{os.path.basename(f)[:44]:46s} {os.path.getsize(f)//1024:6d}KB -> {os.path.getsize(out)//1024:5d}KB')
