"""Generate reviewed Marin vocabulary audio for Word Explosion only.
Run: python3 scripts/generate-word-explosion-marin.py
The private key is read from OPENAI_API_KEY or the external local key file.
"""
import argparse
import concurrent.futures
import hashlib
import json
import os
from pathlib import Path
import re
import subprocess
import time
import urllib.error
import urllib.request

ROOT = Path(__file__).resolve().parent.parent
rows = json.loads(subprocess.check_output(['/usr/bin/osascript', '-l', 'JavaScript', str(ROOT/'scripts/export-game-audio.js'), str(ROOT), '--vocab-only'], text=True))
parser = argparse.ArgumentParser()
parser.add_argument('--workers', type=int, default=8)
parser.add_argument('--key', action='append', help='Regenerate only these lookup keys, preserving other manifest entries.')
args = parser.parse_args()
review = json.loads((ROOT/'scripts/word-explosion-marin-review.json').read_text())
if set(review['entries']) != {row['key'] for row in rows}:
    parser.error('Complete reviewed vocabulary key coverage is required')
for row in rows:
    entry = review['entries'][row['key']]
    if not re.fullmatch(r'[ぁ-ゖー、。！？!?\s]+', entry['text']):
        parser.error('Reviewed speech must contain only hiragana and punctuation')
    if {'english': row['english'], 'kanji': row['kanji']} not in entry['vocabulary']:
        parser.error('Vocabulary changed since the reading review')
    row['text'] = entry['text']
speeds = {k: v.get('speed', review['speed']) for k, v in review['entries'].items()}
if any(not isinstance(speed, (int, float)) or not 0.25 <= speed <= 4 for speed in speeds.values()):
    parser.error('Invalid reviewed speech speed')
if not 1 <= args.workers <= 32:
    parser.error('Workers must be between 1 and 32')
if args.key:
    selected = set(args.key)
    rows = [row for row in rows if row['key'] in selected]
    if {row['key'] for row in rows} != selected:
        parser.error('Requested lookup key is missing from exported speech rows')
key = os.environ.get('OPENAI_API_KEY') or (Path.home()/'.config/washoku-words/openai-api-key').read_text().strip()
folder = ROOT/'audio/word-explosion-marin'
folder.mkdir(parents=True, exist_ok=True)
unique = {(row['text'], speeds.get(row['key'], 1.0)) for row in rows}

def generate(text, speed):
    payload = dict(model=review['model'], voice=review['voice'], input=text, speed=speed, response_format='mp3', instructions='Speak in standard Japanese. Read only the supplied vocabulary once, clearly and naturally, with native Japanese pronunciation. Do not add any introduction, translation, or explanation.')
    digest = hashlib.sha256(json.dumps(payload, ensure_ascii=False, sort_keys=True).encode()).hexdigest()[:20]
    name = 'marin-' + digest + '.mp3'
    path = folder/name
    if path.exists() and path.stat().st_size:
        return (text, speed), str(path.relative_to(ROOT))
    for attempt in range(4):
        request = urllib.request.Request('https://api.openai.com/v1/audio/speech', data=json.dumps(payload).encode(), headers={'Authorization':'Bearer '+key, 'Content-Type':'application/json'})
        try:
            with urllib.request.urlopen(request, timeout=120) as response:
                data = response.read()
                if not response.headers.get('Content-Type','').startswith('audio/') or len(data)<100:
                    raise RuntimeError('Unexpected audio response')
            temporary = path.with_suffix('.tmp')
            temporary.write_bytes(data)
            temporary.replace(path)
            time.sleep(0.5)
            return (text, speed), str(path.relative_to(ROOT))
        except urllib.error.HTTPError as exc:
            if exc.code not in (429,500,502,503,504) or attempt == 3:
                raise RuntimeError('OpenAI HTTP '+str(exc.code)) from None
            time.sleep(2 ** (attempt + 2))
        except urllib.error.URLError:
            raise RuntimeError('Network error; rerun to resume cached generation') from None

print('Unique clips:', len(unique), 'Input characters:', sum(len(text) for text, speed in unique), flush=True)
paths = {}
with concurrent.futures.ThreadPoolExecutor(max_workers=args.workers) as pool:
    jobs = [pool.submit(generate, text, speed) for text, speed in sorted(unique)]
    for job in concurrent.futures.as_completed(jobs):
        text, path = job.result()
        paths[text] = path
        if len(paths)%25 == 0 or len(paths)==len(unique):
            print('Completed',len(paths),'/',len(unique),flush=True)
manifest = json.loads((folder/'manifest.json').read_text()) if args.key else {}
manifest.update({row['key']:paths[(row['text'], speeds.get(row['key'], 1.0))] for row in rows})
(folder/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
(ROOT/'word-explosion-audio-manifest.js').write_text('window.wordExplosionAudioFiles = '+json.dumps(manifest,ensure_ascii=False)+';\n')
print('Complete. MP3 bytes:',sum((ROOT/p).stat().st_size for p in set(paths.values())),flush=True)
