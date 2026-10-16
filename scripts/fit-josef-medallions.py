"""
Fits the gold ring of every round picture (medallion) on the painted tiles of Josef: for each stage and the exam it searches the circle
(middle and radius) whose edge lies on the most gold-coloured pixels, starting from the rough values of Codex' `Karten-Koordinaten.json`.
Prints the new values in the form used by `josef.ts` and writes a control picture per tile.

Usage: python scripts/fit-josef-medallions.py <Karten-Koordinaten.json> <control folder>
"""
import json
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw

coords = json.loads(Path(sys.argv[1]).read_text(encoding='utf-8'))
out_dir = Path(sys.argv[2])
out_dir.mkdir(parents=True, exist_ok=True)
TILES = Path('D:/Claude/lambking-design/karten-ohne-zusatzrand')
PAD, W = 128, 1600

items = [(s['tile'], s['pixelCenter'], s['diameterPx'] / 2, f'stage {i + 1}') for i, s in enumerate(coords['stages'])]
items.append((4, coords['exam']['pixelCenter'], coords['exam']['diameterPx'] / 2, 'exam'))

masks, images = {}, {}
for t in range(5):
    im = Image.open(TILES / f'karte-{t + 1}.webp').convert('RGB')
    images[t] = im
    hsv = np.array(im.convert('HSV')).astype(float)
    h, s, v = hsv[..., 0] * 360 / 255, hsv[..., 1] / 255, hsv[..., 2] / 255
    masks[t] = ((h > 36) & (h < 58) & (s > 0.35) & (v > 0.6)).astype(np.float32)

angles = np.linspace(0, 2 * np.pi, 120, endpoint=False)
ca, sa = np.cos(angles), np.sin(angles)


def score(mask, cx, cy, r):
    xs = np.clip((cx + r * ca).astype(int), 0, mask.shape[1] - 1)
    ys = np.clip((cy + r * sa).astype(int), 0, mask.shape[0] - 1)
    return mask[ys, xs].mean()


results = []
for tile, (cx0, cy0), r0, name in items:
    mask = masks[tile]
    best = (0, cx0, cy0, r0)
    # a coarse search, then a fine one
    for step, span_c, span_r in ((6, 150, (0.7, 1.7)), (2, 8, (0.95, 1.06))):
        _, bx, by, br = best
        rs = np.arange(max(60, br * span_r[0]), br * span_r[1], 2 if step > 2 else 1)
        for cx in np.arange(bx - span_c, bx + span_c + 1, step):
            for cy in np.arange(by - span_c, by + span_c + 1, step):
                for r in rs:
                    sc = score(mask, cx, cy, r)
                    if sc > best[0]:
                        best = (sc, cx, cy, r)
        # the fine search starts around the best of the coarse one
    sc, cx, cy, r = best
    results.append({'tile': tile, 'name': name, 'score': round(float(sc), 2), 'cx': float(cx), 'cy': float(cy), 'r': float(r)})
    print(name, 'tile', tile + 1, 'score', round(float(sc), 2), 'was', (cx0, cy0, round(r0)), 'now', (round(cx), round(cy), round(r)))

for t in range(5):
    im = images[t].copy()
    d = ImageDraw.Draw(im)
    for r in results:
        if r['tile'] == t:
            d.ellipse((r['cx'] - r['r'], r['cy'] - r['r'], r['cx'] + r['r'], r['cy'] + r['r']), outline=(255, 0, 0), width=4)
    im.resize((600, 696)).save(out_dir / f'ring-tile-{t + 1}.jpg', quality=88)

print('\n// stages')
for r in results[:12]:
    print("      { tile: %d, x: %.4f, y: %.4f, d: %.4f }," % (r['tile'], r['cx'] / W, (r['cy'] - PAD) / W, 2 * r['r'] / W))
e = results[12]
print('// exam')
print("    exam: { tile: 4, x: %.4f, y: %.4f, d: %.4f }," % (e['cx'] / W, (e['cy'] - PAD) / W, 2 * e['r'] / W))
json.dump(results, open(out_dir / 'rings.json', 'w'))
