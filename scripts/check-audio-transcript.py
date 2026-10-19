"""
Round-trip check of the recordings: transcribes each mp3 (OpenAI gpt-4o-transcribe, key from OPENAI_API_KEY) and compares the words with the source text.
Usage: python scripts/check-audio-transcript.py <stories.json> <folder with public/> [stage numbers]   (stories.json: see tts-gemini-en.py)
"""
import difflib
import json
import os
import re
import sys
import uuid
import urllib.request
from pathlib import Path


def transcribe(path: Path) -> str:
    key = os.environ['OPENAI_API_KEY']
    boundary = uuid.uuid4().hex
    parts = []
    def field(name, value):
        parts.append(f'--{boundary}\r\nContent-Disposition: form-data; name="{name}"\r\n\r\n{value}\r\n'.encode())
    field('model', 'gpt-4o-transcribe')
    field('language', 'en')
    field('response_format', 'text')
    parts.append(f'--{boundary}\r\nContent-Disposition: form-data; name="file"; filename="a.mp3"\r\nContent-Type: audio/mpeg\r\n\r\n'.encode() + path.read_bytes() + b'\r\n')
    parts.append(f'--{boundary}--\r\n'.encode())
    req = urllib.request.Request('https://api.openai.com/v1/audio/transcriptions', data=b''.join(parts),
                                 headers={'Authorization': f'Bearer {key}', 'Content-Type': f'multipart/form-data; boundary={boundary}'})
    return urllib.request.urlopen(req, timeout=180).read().decode('utf-8')


def words(t: str):
    return re.findall(r"[a-z0-9']+", t.lower().replace('’', "'"))


if __name__ == '__main__':
    stories = {s['n']: s for s in json.loads(Path(sys.argv[1]).read_text(encoding='utf-8'))}
    root = Path(sys.argv[2])
    for n in [int(a) for a in sys.argv[3:]] or sorted(stories):
        s = stories[n]
        got = transcribe(root / s['audio'])
        a, b = words(' '.join(s['text'])), words(got)
        sm = difflib.SequenceMatcher(None, a, b)
        diff = [(' '.join(a[i1:i2]), ' '.join(b[j1:j2])) for tag, i1, i2, j1, j2 in sm.get_opcodes() if tag != 'equal']
        print(f'stage {n}: match {sm.ratio() * 100:.1f} %  ({len(a)} words), differences: {diff[:6]}')
