"""
Cuts Anton's logo (transparent PNG/WebP, lamb + word mark) into the parts the app needs, and makes the night version of the
word mark. Nothing is redrawn: the pixels of the original are only split and (for the night word mark) the dark navy of the
letters is changed to the cream of the night theme; the gold of "King" stays.

Usage: python scripts/make-logo-assets.py <logo.webp|png>
Output: public/images/logo/lk-*.webp
"""
import sys
from pathlib import Path

import numpy as np
from PIL import Image
from scipy import ndimage

src = Path(sys.argv[1])
out = Path(__file__).resolve().parent.parent / 'public' / 'images' / 'logo'
im = Image.open(src).convert('RGBA')
a = np.array(im)
alpha = a[..., 3] > 24

lab, n = ndimage.label(ndimage.binary_dilation(alpha, iterations=2))
word = np.zeros_like(alpha)
for i in range(1, n + 1):
    ys, xs = np.where(lab == i)
    # everything whose body lies below the hooves belongs to the word mark
    if (ys.min() > 880 and ys.max() > 1000) or ys.mean() > 925:
        word |= lab == i
word &= alpha | ndimage.binary_dilation(alpha, iterations=2)
lamb = (lab > 0) & ~word

def crop(mask: np.ndarray, pad: int = 6) -> Image.Image:
    arr = a.copy()
    arr[..., 3] = np.where(mask, arr[..., 3], 0)
    ys, xs = np.where(arr[..., 3] > 0)
    box = (max(xs.min() - pad, 0), max(ys.min() - pad, 0), min(xs.max() + pad, a.shape[1]), min(ys.max() + pad, a.shape[0]))
    return Image.fromarray(arr).crop(box)

def night(img: Image.Image) -> Image.Image:
    arr = np.array(img).copy()
    r, b = arr[..., 0].astype(int), arr[..., 2].astype(int)
    notgold = (r - b) < 70          # gold has a lot more red than blue; the navy does not
    cream = np.array([244, 244, 238], dtype=np.uint8)
    arr[notgold, 0:3] = cream
    return Image.fromarray(arr)

def save(img: Image.Image, name: str, width: int):
    h = round(img.height * width / img.width)
    img.resize((width, h), Image.LANCZOS).save(out / name, 'WEBP', quality=92, method=6)
    print(name, width, h)

lamb_img = crop(lamb)
word_img = crop(word)
save(lamb_img, 'lk-lamm.webp', 420)
save(word_img, 'lk-wort-tag.webp', 520)
save(night(word_img), 'lk-wort-nacht.webp', 520)
save(Image.fromarray(a).crop(Image.fromarray(a).getbbox()), 'lk-logo-tag.webp', 720)
full = Image.fromarray(a)
# the lamb stays as it is; only the word mark gets the cream
full_night = np.array(full).copy()
wm = np.array(night(Image.fromarray(a)))
full_night[word] = wm[word]
fn = Image.fromarray(full_night)
save(fn.crop(fn.getbbox()), 'lk-logo-nacht.webp', 720)
