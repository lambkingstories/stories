"""
Copies the pictures that Codex delivered into the app (`public/images/...`) and makes the big ones small enough for the app:
large photos / scenes -> lossy WebP, sprites keep their alpha, the one-colour symbols (icons/ui) are copied untouched.
The old pictures are saved first (once) to D:/Claude/lambking-design/alt-bilder-vor-codex-2026-10-16.

Usage: python scripts/import-codex-images.py <folder with public/images>
"""
import os
import shutil
import sys
from pathlib import Path

from PIL import Image

src_root = Path(sys.argv[1]) / 'public' / 'images'
app_root = Path(__file__).resolve().parent.parent / 'public' / 'images'
backup = Path('D:/Claude/lambking-design/alt-bilder-vor-codex-2026-10-16')

total_before = total_after = 0
report = []

for src in sorted(src_root.rglob('*')):
    if not src.is_file():
        continue
    rel = src.relative_to(src_root)
    dst = app_root / rel
    # save the old one once
    if dst.exists() and not (backup / rel).exists():
        (backup / rel).parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(dst, backup / rel)
    dst.parent.mkdir(parents=True, exist_ok=True)
    size = src.stat().st_size
    total_before += size
    parts = rel.parts
    if parts[:2] == ('icons', 'ui') or src.suffix.lower() != '.webp':
        shutil.copy2(src, dst)
        total_after += dst.stat().st_size
        continue
    im = Image.open(src)
    has_alpha = im.mode in ('RGBA', 'LA') or 'A' in im.getbands()
    # lossless is only kept for small files (sprites, medals); everything else becomes lossy
    if size < 100 * 1024:
        shutil.copy2(src, dst)
    elif has_alpha:
        im.save(dst, 'WEBP', quality=86, alpha_quality=92, method=6)
    else:
        q = 80 if max(im.size) >= 1000 else 84
        im.convert('RGB').save(dst, 'WEBP', quality=q, method=6)
    total_after += dst.stat().st_size
    if size > 500 * 1024:
        report.append((str(rel), size // 1024, dst.stat().st_size // 1024))

print('files copied; before %.1f MB, after %.1f MB' % (total_before / 1e6, total_after / 1e6))
for r in report:
    print('%-50s %5d KB -> %5d KB' % r)
