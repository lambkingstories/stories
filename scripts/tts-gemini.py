"""
Reads a story aloud with Google's Gemini speech model and saves it as a small MP3.
The key is taken from the environment variable GEMINI_API_KEY (it is never written anywhere).

Usage:
  python scripts/tts-gemini.py sample <voice> <out.mp3>        one test paragraph of stage 1
  python scripts/tts-gemini.py stage <voice> <n> [<out folder>] the story text of stage n (1..12) -> geschichte-NN.mp3
"""
import base64
import io
import json
import os
import re
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path

import numpy as np
import soundfile as sf

PARA_BREAK = chr(10) * 2
MODEL = os.environ.get('LK_TTS_MODEL', 'gemini-3.8-flash-tts')
TEXTS = Path('D:/Claude/Abenteuer-Josef/Josef_Alle_Texte_Vertonung.md')
# Nothing but the story is sent: the model reads out every word it is given, so an instruction in front of the text would be spoken.
STYLE = ''


def stage_text(n: int) -> list[str]:
    md = TEXTS.read_text(encoding='utf-8')
    block = re.split(r'\n## Etappe ', md)[n]
    a = block.split('### A.')[1].split('### B.')[0]
    paras = [re.sub(r'^\(\d+\)\s*', '', p.strip()) for p in a.split('\n\n')[1:] if p.strip() and not p.strip().startswith('[')]
    return [p for p in paras if p]


def synth(text: str, voice: str) -> np.ndarray:
    key = os.environ['GEMINI_API_KEY']
    body = {
        'contents': [{'parts': [{'text': STYLE + text}]}],
        'generationConfig': {
            'responseModalities': ['AUDIO'],
            'speechConfig': {'voiceConfig': {'prebuiltVoiceConfig': {'voiceName': voice}}},
        },
    }
    req = urllib.request.Request(
        f'https://generativelanguage.googleapis.com/v1beta/models/{MODEL}:generateContent',
        data=json.dumps(body).encode(),
        headers={'x-goog-api-key': key, 'Content-Type': 'application/json'},
    )
    for attempt in range(4):
        try:
            data = json.load(urllib.request.urlopen(req, timeout=180))
            part = data['candidates'][0]['content']['parts'][0]['inlineData']
            pcm = base64.b64decode(part['data'])
            return np.frombuffer(pcm, dtype=np.int16)
        except urllib.error.HTTPError as e:
            msg = e.read()[:300]
            print('HTTP', e.code, msg, file=sys.stderr)
            if e.code in (429, 500, 503) and attempt < 3:
                time.sleep(6 * (attempt + 1))
                continue
            raise
    raise RuntimeError('no audio')


def clean(pcm: np.ndarray, rate: int = 24000) -> np.ndarray:
    """
    The model leaves small flaws that are heard in a quiet room: a pop in the first few milliseconds, little ticks in the pauses between
    paragraphs, and a short loud burst after the last word. This removes them: the first 10 ms go and the start is faded in, every
    tiny sound (up to 60 ms) that lies alone in a pause is wiped out, everything after the last speech goes (a burst is loud and shorter
    than half a second), a little silence is kept, and the end is faded out.
    """
    x = pcm.astype(np.float64) / 32768
    fr = int(rate * 0.01)  # 10 ms
    n = len(x) // fr
    rms = np.array([np.sqrt(np.mean(x[i * fr:(i + 1) * fr] ** 2)) for i in range(n)])
    quiet = rms < 0.012
    loud = rms > 0.02

    # 1. the end: a short loud piece after a silence is not speech
    end = n
    i = n - 1
    while i >= 0 and not quiet[i]:
        i -= 1
    tail_loud = n - 1 - i
    if tail_loud * 0.01 < 0.5:
        j = i
        while j >= 0 and quiet[j]:
            j -= 1
        if i - j >= 8 and j >= 0:
            end = j + 1
    x = x[: min(len(x), (end + 12) * fr)]

    # 2. tiny sounds alone in a pause (a tick, a breath of the model): runs of up to 60 ms with 80 ms of quiet on both sides
    runs, k = [], 0
    while k < end:
        if loud[k]:
            m = k
            while m < end and loud[m]:
                m += 1
            if runs and k - runs[-1][1] < 12:
                runs[-1] = (runs[-1][0], m)
            else:
                runs.append((k, m))
            k = m
        else:
            k += 1
    for a, b in runs:
        if b - a <= 6 and a >= 8 and b + 8 <= n and quiet[a - 8:a].all() and quiet[b:b + 8].all():
            x[max(0, a - 2) * fr:(b + 2) * fr] = 0

    # 3. the start: no pop
    x[: int(rate * 0.01)] = 0
    f = int(rate * 0.012)
    x[int(rate * 0.01):int(rate * 0.01) + f] *= np.linspace(0, 1, f)
    # 4. the end fades out
    k = int(rate * 0.04)
    x[-k:] *= np.linspace(1, 0, k)
    return (np.clip(x, -1, 1) * 32767).astype(np.int16)


def save_mp3(pcm: np.ndarray, out: Path, rate: int = 24000):
    out.parent.mkdir(parents=True, exist_ok=True)
    # speech at 24 kHz mono: about 42 kbit/s is plenty and keeps the download of a journey small
    sf.write(str(out), pcm, rate, format='MP3', subtype='MPEG_LAYER_III', bitrate_mode='VARIABLE', compression_level=0.7)
    print(out, round(len(pcm) / rate, 1), 's', out.stat().st_size // 1024, 'KB')


if __name__ == '__main__':
    mode, voice = sys.argv[1], sys.argv[2]
    if mode == 'sample':
        text = ' '.join(stage_text(1)[:2])
        save_mp3(clean(synth(text, voice)), Path(sys.argv[3]))
    elif mode == 'stage':
        n = int(sys.argv[3])
        folder = Path(sys.argv[4]) if len(sys.argv) > 4 else Path('public/audio/abenteuer/josef')
        # the whole text in one piece: no joins between paragraphs, so nothing can click or hiss in the middle of a story
        pcm = clean(synth(PARA_BREAK.join(stage_text(n)), voice))
        save_mp3(pcm, folder / f'geschichte-{n:02d}.mp3')
