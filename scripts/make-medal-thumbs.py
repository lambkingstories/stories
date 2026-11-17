# -*- coding: utf-8 -*-
"""Verkleinert jede Abenteuer-Medaille (journey.medal in src/data/adventures/*.ts) auf 256 px Hoehe und legt sie als `<name>-klein.webp`
daneben (die App ruft die Vorschau ueber src/utils/medalThumb.ts ab; fehlt sie, laedt sie das grosse Bild). Kein Malen, nur Verkleinern.
Aufruf (im Repo-Ordner):  python scripts/make-medal-thumbs.py          (nur fehlende)
                          python scripts/make-medal-thumbs.py --force  (alle neu)
"""
import glob
import os
import re
import sys

from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
HEIGHT = 256
force = '--force' in sys.argv
made = skipped = 0
for f in sorted(glob.glob(os.path.join(ROOT, 'src/data/adventures/*.ts'))):
    t = open(f, encoding='utf8').read()
    m = re.search(r"^\s*medal:\s*(['\"`])(.*?)\1", t, re.M)
    if not m:
        continue
    path = m.group(2)
    for name, val in re.findall(r"const\s+(\w+)\s*=\s*['\"`]([^'\"`]*)['\"`]", t):
        path = path.replace('${' + name + '}', val)
    src = os.path.join(ROOT, 'public', path)
    dst = src.replace('.webp', '-klein.webp')
    if not os.path.exists(src):
        print('FEHLT das grosse Bild:', path)
        continue
    if os.path.exists(dst) and not force:
        skipped += 1
        continue
    im = Image.open(src).convert('RGBA')
    w = round(im.width * HEIGHT / im.height)
    small = im.resize((w, HEIGHT), Image.LANCZOS)
    small.save(dst, 'WEBP', quality=88, method=6)
    made += 1
    print(f'{os.path.relpath(dst, os.path.join(ROOT, "public"))}  {w}x{HEIGHT}  {os.path.getsize(dst) // 1024} KB')
print(f'neu: {made}, schon da: {skipped}')
