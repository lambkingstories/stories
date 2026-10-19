"""
Reads the English stories of an adventure aloud with Google's Gemini speech model (the same way as the German stories, see tts-gemini.py:
only the text is sent, the whole story in ONE call, small flaws removed, small MP3). The key comes from the environment variable
GEMINI_API_KEY (it is never written anywhere).

Usage:
  python scripts/tts-gemini-en.py <stories.json> <voice> <stage numbers, e.g. 1 2 3 or all> [--out public] [--force]

<stories.json> is a list of {"n": 1, "text": ["paragraph", ...], "audio": "audio/abenteuer/noah/geschichte-01-en-v1.mp3"} made from the
English data (`src/data/adventures/en/*.en.ts`); the file is written to <out>/<audio>. A file that exists is skipped without --force.
"""
import importlib.util
import json
import sys
import time
from pathlib import Path

spec = importlib.util.spec_from_file_location('tts_gemini', Path(__file__).with_name('tts-gemini.py'))
tts = importlib.util.module_from_spec(spec)
spec.loader.exec_module(tts)


def main():
    args = sys.argv[1:]
    force = '--force' in args
    out_root = Path('public')
    if '--out' in args:
        i = args.index('--out')
        out_root = Path(args[i + 1])
        del args[i:i + 2]
    args = [a for a in args if a != '--force']
    stories = {s['n']: s for s in json.loads(Path(args[0]).read_text(encoding='utf-8'))}
    voice = args[1]
    wanted = sorted(stories) if args[2] == 'all' else [int(a) for a in args[2:]]
    for n in wanted:
        s = stories[n]
        target = out_root / s['audio']
        if target.exists() and not force:
            print('exists, skipped:', target)
            continue
        # the whole story in one piece, paragraphs separated by an empty line
        pcm = tts.clean(tts.synth(tts.PARA_BREAK.join(s['text']), voice))
        tts.save_mp3(pcm, target)
        time.sleep(3)


if __name__ == '__main__':
    main()
