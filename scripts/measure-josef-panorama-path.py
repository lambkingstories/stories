"""
Finds the way between the round pictures on the one-piece map of Josef (`karte-gesamt.webp`): the ground that looks like a road (light,
dusty, not green, not a roof) is cheap, everything else is expensive, so the cheapest way from one station to the next follows the roads
of the painting. The way is smoothed and written as points (x, y in shares of the whole picture) for `josefPath.ts`.

Usage: python scripts/measure-josef-panorama-path.py <karte-gesamt.webp> <Josef-Panoramakarte-Koordinaten.json> <control folder> [--write]
"""
import heapq
import json
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw

img_path, coord_path, out_dir = Path(sys.argv[1]), Path(sys.argv[2]), Path(sys.argv[3])
out_dir.mkdir(parents=True, exist_ok=True)
Image.MAX_IMAGE_PIXELS = None
im = Image.open(img_path).convert('RGB')
W, H = im.size
coords = json.loads(coord_path.read_text(encoding='utf-8'))
if isinstance(coords, list):
    # the list of the finished panorama: middle of every station (x, y in pixels); every ring has the same size (380 px)
    nodes = [(n['x'], n['y'], n.get('r', 168)) for n in coords]
    direct = {i for i, n in enumerate(coords) if n.get('direct')}  # the stretch that ends at this station is a straight line
else:
    direct = set()
    nodes = [(n['pixelCenter'][0], n['pixelCenter'][1], n.get('radiusPx', n['diameterPx'] / 2)) for n in coords['nodes']]

# a grid of half the picture's size
S = max(2, W // 1600)  # the cost grid is about 1600 px wide
gw, gh = W // S, H // S
small = im.resize((gw, gh), Image.LANCZOS)
hsv = np.array(small.convert('HSV')).astype(float)
h, s, v = hsv[..., 0] * 360 / 255, hsv[..., 1] / 255, hsv[..., 2] / 255
rgb = np.array(small).astype(float)

# road colour: light and dusty (sand, beige), little saturation; green plants, water, dark rock and strong red/brown roofs are not roads
dusty = (v > 0.62) & (s < 0.52) & (h > 18) & (h < 55)
green = (h > 60) & (h < 170) & (s > 0.18)
water = (h > 170) & (h < 260)
dark = v < 0.42
# smooth: a road is a stretch, not a single pixel
from scipy.ndimage import uniform_filter

road = uniform_filter(dusty.astype(float), size=5)
cost = 1.0 + 9.0 * (1 - road)
cost[green] += 6
cost[water] += 25
cost[dark] += 6

# nothing may lead through another station's picture
yy, xx = np.mgrid[0:gh, 0:gw]
for cx, cy, r in nodes:
    inside = (xx - cx / S) ** 2 + (yy - cy / S) ** 2 < (r / S * 1.15) ** 2
    cost[inside] += 40


def route(a, b):
    """Cheapest way (Dijkstra, 8 neighbours) between two grid points; the start and the end lie in the stations' pictures."""
    sx, sy = int(a[0] / S), int(a[1] / S)
    tx, ty = int(b[0] / S), int(b[1] / S)
    dist = np.full((gh, gw), np.inf)
    prev = {}
    dist[sy, sx] = 0
    pq = [(0.0, sx, sy)]
    while pq:
        d, x, y = heapq.heappop(pq)
        if (x, y) == (tx, ty):
            break
        if d > dist[y, x]:
            continue
        for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1), (1, 1), (1, -1), (-1, 1), (-1, -1)):
            nx, ny = x + dx, y + dy
            if 0 <= nx < gw and 0 <= ny < gh:
                step = 1.414 if dx and dy else 1.0
                nd = d + step * (cost[ny, nx] + cost[y, x]) / 2
                if nd < dist[ny, nx]:
                    dist[ny, nx] = nd
                    prev[(nx, ny)] = (x, y)
                    heapq.heappush(pq, (nd, nx, ny))
    pts = [(tx, ty)]
    while pts[-1] != (sx, sy):
        pts.append(prev[pts[-1]])
    return [(x * S, y * S) for x, y in reversed(pts)]


def smooth(pts, k=7):
    a = np.array(pts, float)
    pad = np.vstack([np.repeat(a[:1], k, 0), a, np.repeat(a[-1:], k, 0)])
    kernel = np.ones(2 * k + 1) / (2 * k + 1)
    return np.stack([np.convolve(pad[:, i], kernel, mode='same')[k:-k] for i in range(2)], axis=1)


def resample(pts, step):
    """Points a fixed distance apart along the way."""
    a = np.array(pts, float)
    seg = np.hypot(*np.diff(a, axis=0).T)
    t = np.concatenate([[0], np.cumsum(seg)])
    n = max(2, int(t[-1] / step))
    u = np.linspace(0, t[-1], n)
    return np.stack([np.interp(u, t, a[:, 0]), np.interp(u, t, a[:, 1])], axis=1)


STEP = W * 0.0045  # pixels between two beads
ways = []
for i in range(len(nodes) - 1):
    a, b = nodes[i], nodes[i + 1]
    raw = [(a[0] + (b[0] - a[0]) * t / 40, a[1] + (b[1] - a[1]) * t / 40) for t in range(41)] if (i + 1) in direct else route(a, b)
    way = raw if (i + 1) in direct else smooth(raw)
    # the beads start and stop at the rim of the pictures, not in their middle
    way = resample(way, STEP)
    keep = [p for p in way if np.hypot(p[0] - a[0], p[1] - a[1]) > a[2] * 1.06 and np.hypot(p[0] - b[0], p[1] - b[1]) > b[2] * 1.06]
    # the beads keep clear of the number coin (top left of a ring) and of the check mark (top right)
    def clear(p):
        return all(np.hypot(p[0] - (n[0] + dx), p[1] - (n[1] - 151)) > 78 for n in nodes for dx in (-151, 151))
    keep = [p for p in keep if clear(p)]
    ways.append(keep)
    print('stretch', i + 1, 'beads', len(keep))

control = im.copy()
d = ImageDraw.Draw(control)
for way in ways:
    for x, y in way:
        d.ellipse((x - 4, y - 4, x + 4, y + 4), fill=(255, 40, 40))
control.save(out_dir / 'weg.png')
control.crop((0, 0, 1100, H)).save(out_dir / 'weg-links.png')
control.crop((1070, 0, W, H)).save(out_dir / 'weg-rechts.png')
out = [[[round(float(x) / W, 4), round(float(y) / H, 4)] for x, y in way] for way in ways]
(out_dir / 'weg.json').write_text(json.dumps(out))
if '--write' in sys.argv:
    lines = ['/**', ' * The beads of the dotted way on the one-piece map of Josef: one list per stretch between two stations (the last one leads to the exam).',
             ' * [x, y] is the middle of a bead as a share of the whole picture (width, height), counted from the top left.',
             ' * Found by `scripts/measure-josef-panorama-path.py`: the cheapest way over the road-like ground of the painting.', ' */',
             'export const JOSEF_PATH: [number, number][][] = [']
    for i, way in enumerate(out):
        lines.append(f'  // station {i + 1} to {i + 2 if i < 11 else "the exam"}')
        lines.append('  [' + ', '.join(f'[{x}, {y}]' for x, y in way) + ']' + (',' if i < len(out) - 1 else ''))
    lines.append(']')
    Path('src/data/adventures/josefPath.ts').write_text('\n'.join(lines) + '\n', encoding='utf-8')
    print('written')
