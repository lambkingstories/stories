"""
Gives the painted tiles of Josef (as delivered: 1600 x 1856, i.e. the square plus 128 px above and below) a wider margin of picture,
because the tiles have to be moved up or down by different amounts to make the dotted path run on across the seams.
The extra margin is the picture itself, mirrored at its upper and lower edge (the same trick as before); nothing is drawn.

Usage: python scripts/pad-josef-tiles.py [extra px, default 128]
"""
import sys
from pathlib import Path

import numpy as np
from PIL import Image

EXTRA = int(sys.argv[1]) if len(sys.argv) > 1 else 128
src_dir = Path('D:/Claude/lambking-design/karten-ohne-zusatzrand')
dst_dir = Path(__file__).resolve().parent.parent / 'public' / 'images' / 'abenteuer' / 'josef'

for n in range(1, 6):
    im = Image.open(src_dir / f'karte-{n}.webp').convert('RGB')
    a = np.array(im)
    h = a.shape[0]
    top = a[:EXTRA][::-1]            # the first rows, mirrored upwards
    bottom = a[h - EXTRA:][::-1]     # the last rows, mirrored downwards
    out = np.concatenate([top, a, bottom], axis=0)
    Image.fromarray(out).save(dst_dir / f'karte-{n}.webp', 'WEBP', quality=72, method=6)
    print(n, im.size, '->', (out.shape[1], out.shape[0]))
print('pad = %.4f of the tile width' % ((128 + EXTRA) / 1600))
