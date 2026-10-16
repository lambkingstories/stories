"""
Measures the dotted gold path on the painted map tiles of Josef (public/images/abenteuer/josef/karte-1..5.webp) and writes
`src/data/adventures/josefPath.ts` plus the tile shifts that make the path run on across the seams.

The medallion middles come from Codex' list `Karten-Koordinaten.json` (stages + exam). The beads are found by their colour
(saturated light gold, small and round); beads inside a medallion are dropped; then the path is followed bead by bead from one
medallion to the next (missing beads are filled in at the usual spacing). A control picture per tile is written to the folder
given as second argument; the result is printed as the TypeScript for `josefPath.ts` and the shifts.

Usage: python scripts/measure-josef-path.py <Karten-Koordinaten.json> <control picture folder> [--write]
"""
import json
import math
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage

coords = json.loads(Path(sys.argv[1]).read_text(encoding='utf-8'))
out_dir = Path(sys.argv[2])
write = '--write' in sys.argv
out_dir.mkdir(parents=True, exist_ok=True)
root = Path(__file__).resolve().parent.parent
TILE_DIR = Path('D:/Claude/lambking-design/karten-ohne-zusatzrand')  # the tiles as delivered (1600 x 1856), see pad-josef-tiles.py
W = 1600
PAD = 128
SPACING = 26.0

# the fitted gold rings (scripts/fit-josef-medallions.py) are more exact than the rough values of the list
rings_file = Path('D:/Claude/lambking-design/ring-messung/rings.json')
if rings_file.exists():
    fitted = json.loads(rings_file.read_text())
    for i, s_ in enumerate(coords['stages']):
        s_['pixelCenter'] = [fitted[i]['cx'], fitted[i]['cy']]
        s_['diameterPx'] = fitted[i]['r'] * 2
    coords['exam']['pixelCenter'] = [fitted[12]['cx'], fitted[12]['cy']]
    coords['exam']['diameterPx'] = fitted[12]['r'] * 2

# all medallions in order: 12 stages, then the exam
nodes = [{'tile': s['tile'], 'c': np.array(s['pixelCenter'], float), 'r': s['diameterPx'] / 2} for s in coords['stages']]
nodes.append({'tile': 4, 'c': np.array(coords['exam']['pixelCenter'], float), 'r': coords['exam']['diameterPx'] / 2})


def beads_of(tile: int):
    im = Image.open(TILE_DIR / f'karte-{tile + 1}.webp').convert('RGB')
    hsv = np.array(im.convert('HSV')).astype(float)
    h, s, v = hsv[..., 0] * 360 / 255, hsv[..., 1] / 255, hsv[..., 2] / 255
    mask = (h > 38) & (h < 56) & (s > 0.55) & (v > 0.88)
    lab, _ = ndimage.label(mask)
    pts = []
    for i, sl in enumerate(ndimage.find_objects(lab), 1):
        area = int((lab[sl] == i).sum())
        hh, ww = sl[0].stop - sl[0].start, sl[1].stop - sl[1].start
        if 50 <= area <= 700 and 0.6 < hh / ww < 1.7 and area / (hh * ww) > 0.5:
            pts.append(np.array([(sl[1].start + sl[1].stop) / 2, (sl[0].start + sl[0].stop) / 2]))
    inside = [n for n in nodes if n['tile'] == tile]
    pts = [p for p in pts if all(np.linalg.norm(p - n['c']) > n['r'] * 1.04 for n in inside)]
    return im, pts


tiles = {}
for t in range(5):
    tiles[t] = beads_of(t)
used = {t: set() for t in range(5)}


def walk(tile, start_pt, goal_fn, toward, start_ok=None, rim_of=None):
    """Follow the beads of a tile from the one nearest to start_pt until goal_fn(point) is true; `toward` gives the direction."""
    pts = tiles[tile][1]
    free = [i for i in range(len(pts)) if i not in used[tile] and (start_ok is None or start_ok(pts[i]))]
    if not free:
        return []
    first = None
    if rim_of is not None:
        cand = min(free, key=lambda i: abs(np.linalg.norm(pts[i] - rim_of['c']) - rim_of['r']))
        if abs(np.linalg.norm(pts[cand] - rim_of['c']) - rim_of['r']) <= SPACING * 3:
            first = cand
    if first is None:
        first = min(free, key=lambda i: np.linalg.norm(pts[i] - start_pt))
        if np.linalg.norm(pts[first] - start_pt) > SPACING * 8:
            return []
    out = [pts[first]]
    used[tile].add(first)
    cur = pts[first]
    for _ in range(80):
        if goal_fn(cur):
            break
        d = toward(cur)
        best, bd = None, 1e9
        for i in range(len(pts)):
            if i in used[tile]:
                continue
            v = pts[i] - cur
            dist = np.linalg.norm(v)
            if dist > SPACING * 3.3 or dist < 4:
                continue
            if np.dot(v, d) <= 0:
                continue
            if dist < bd:
                best, bd = i, dist
        if best is None:
            break
        used[tile].add(best)
        cur = pts[best]
        out.append(cur)
    return out


def fill(points):
    """Fill gaps larger than 1.6 spacings with evenly spaced points."""
    if not points:
        return points
    res = [points[0]]
    for p in points[1:]:
        q = res[-1]
        dist = np.linalg.norm(p - q)
        if dist > SPACING * 1.6:
            n = int(round(dist / SPACING))
            for k in range(1, n):
                res.append(q + (p - q) * k / n)
        res.append(p)
    return res


def rim_goal(node, extra=SPACING * 1.8):
    return lambda p: np.linalg.norm(p - node['c']) - node['r'] <= extra


def toward_node(node):
    return lambda p: node['c'] - p


stretches = []  # each: list of (tile, np.array)
for k in range(12):
    a, b = nodes[k], nodes[k + 1]
    parts = []
    if a['tile'] == b['tile']:
        # start at the rim of A on the side of B
        dirn = (b['c'] - a['c']) / np.linalg.norm(b['c'] - a['c'])
        start = a['c'] + dirn * (a['r'] + SPACING)
        dab = np.linalg.norm(b['c'] - a['c'])
        pts = walk(a['tile'], start, rim_goal(b), toward_node(b), lambda p: np.linalg.norm(p - b['c']) < dab and np.linalg.norm(p - a['c']) < dab, a)
        parts.append((a['tile'], pts))
    else:
        right = np.array([1.0, 0.0])
        # leaves A to the right: start at the bead nearest to the rim of A on its right half
        start = a['c'] + right * (a['r'] + SPACING)
        pts = walk(a['tile'], start, lambda p: p[0] > W - 60, lambda p: right, lambda p: p[0] > a['c'][0] and np.linalg.norm(p - a['c']) < a['r'] + SPACING * 5, a)
        parts.append((a['tile'], pts))
        # enters B from the left edge: start at the bead with the smallest x (close to the left edge)
        pts_b = tiles[b['tile']][1]
        left_beads = [p for p in pts_b if p[0] < 120]
        left_start = min(left_beads, key=lambda p: p[0]) if left_beads else np.array([30.0, b['c'][1]])
        pts2 = walk(b['tile'], left_start, rim_goal(b), toward_node(b))
        parts.append((b['tile'], pts2))
    stretches.append(parts)
    print('stretch', k + 1, [(t, len(p)) for t, p in parts])

# shifts: the path leaves tile t on the right at y_exit and enters tile t+1 on the left at y_entry
shift = [0.0] * 5
for k in range(12):
    parts = stretches[k]
    if len(parts) == 2 and parts[0][1] and parts[1][1]:
        t = parts[0][0]
        e = parts[0][1][-3:]
        ex = np.polyfit([p[0] for p in e], [p[1] for p in e], 1) if len(e) >= 2 else None
        y_exit = ((ex[0] * W + ex[1]) if ex is not None else parts[0][1][-1][1]) - PAD
        n = parts[1][1][:3]
        en = np.polyfit([p[0] for p in n], [p[1] for p in n], 1) if len(n) >= 2 else None
        y_entry = ((en[1]) if en is not None else parts[1][1][0][1]) - PAD
        y_exit, y_entry = y_exit / W, y_entry / W
        shift[t + 1] = shift[t] + y_exit - y_entry
mid = (max(shift) + min(shift)) / 2
shift = [s - mid for s in shift]
print('shift', [round(s, 4) for s in shift], 'max abs', round(max(abs(s) for s in shift), 4), '(room: 0.08)')

# composite coordinates
path = []
for parts in stretches:
    seq = []
    for t, pts in parts:
        pts = fill(pts) if pts else pts
        for p in pts:
            seq.append([round(t + p[0] / W, 4), round((p[1] - PAD) / W + shift[t], 4)])
    path.append(seq)

# control pictures
for t in range(5):
    im = tiles[t][0].copy()
    dr = ImageDraw.Draw(im)
    for parts in stretches:
        for tt, pts in parts:
            if tt != t:
                continue
            for p in fill(pts):
                dr.ellipse((p[0] - 9, p[1] - 9, p[0] + 9, p[1] + 9), outline=(255, 0, 0), width=3)
    im.resize((800, 928)).save(out_dir / f'path-tile-{t + 1}.jpg', quality=85)

ts = ['/**', ' * The beads of the dotted path on the painted map of Josef: one list per stretch between two stages (the last one leads to the quiz).',
      ' * [x, y] is the middle of a bead; x in widths and y in heights of one tile, counted from the left edge of the first tile, with the',
      ' * shift of the tile already in it. Measured by `scripts/measure-josef-path.py` on the painted tiles (Codex, 16.10.2026).', ' */',
      'export const JOSEF_PATH: [number, number][][] = [']
for i, seq in enumerate(path):
    ts.append(f'  // stage {i + 1} to {i + 2 if i < 11 else "the quiz"}')
    ts.append('  ' + json.dumps(seq).replace('],[', '], [') + (',' if i < 11 else ''))
ts.append(']')
ts_text = '\n'.join(ts) + '\n'
(out_dir / 'josefPath.ts').write_text(ts_text, encoding='utf-8')
(out_dir / 'shift.json').write_text(json.dumps([round(s, 4) for s in shift]))
if write:
    (root / 'src' / 'data' / 'adventures' / 'josefPath.ts').write_text(ts_text, encoding='utf-8')
    print('josefPath.ts written')
