"""Generate reviewed Marin audio for the 図鑑 vocabulary. Reruns reuse content-addressed MP3s.
Run: python3 scripts/generate-zukan-audio.py
The private key is read from OPENAI_API_KEY or the external local key file.
"""
import argparse
import concurrent.futures
import hashlib
import json
import os
import re
from pathlib import Path
import subprocess
import time
import urllib.error
import urllib.request

ROOT = Path(__file__).resolve().parent.parent
rows = json.loads(subprocess.check_output(['/usr/bin/osascript', '-l', 'JavaScript', str(ROOT/'scripts/export-zukan-audio.js'), str(ROOT)], text=True))
review = json.loads((ROOT/'scripts/zukan-marin-review.json').read_text())
if set(review['entries']) != {row['key'] for row in rows}:
    raise ValueError('Complete reviewed vocabulary coverage required')
for row in rows:
    if review['entries'][row['key']]['text'] != row['text']:
        raise ValueError('Reading changed since review: ' + row['key'])
    if not re.fullmatch(r'[ぁ-ゖー、。！？!?\s]+', row['text']):
        raise ValueError('Hiragana reading required for ' + row['key'])
if review['voice'] != 'marin' or review['model'] != 'gpt-4o-mini-tts' or review['speed'] != 1.0:
    raise ValueError('Expected Marin at normal generation speed 1.0')
parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--retry-key', action='append', default=[], help='Regenerate an exact lookup key, bypassing cached audio')
args = parser.parse_args()
known_keys = {row['key'] for row in rows}
if set(args.retry_key) - known_keys:
    parser.error('Unknown retry key')
retry_texts = {row['text'] for row in rows if row['key'] in args.retry_key}
key = os.environ.get('OPENAI_API_KEY') or (Path.home()/'.config/washoku-words/openai-api-key').read_text().strip()
folder = ROOT/'audio/zukan'
folder.mkdir(parents=True, exist_ok=True)
unique = {row['text'] for row in rows}

def generate(text):
    payload = dict(model=review['model'], voice=review['voice'], input=text, speed=review['speed'], response_format='mp3', instructions='Speak in standard Japanese. Read only the supplied vocabulary once, clearly and naturally, with native Japanese pronunciation. Do not add any introduction, translation, or explanation.')
    digest = hashlib.sha256(json.dumps(payload, ensure_ascii=False, sort_keys=True).encode()).hexdigest()[:20]
    name = 'marin-' + digest + '.mp3'
    path = folder/name
    if text not in retry_texts and path.exists() and path.stat().st_size:
        return text, str(path.relative_to(ROOT))
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
            return text, str(path.relative_to(ROOT))
        except urllib.error.HTTPError as exc:
            if exc.code not in (429,500,502,503,504) or attempt == 3:
                raise RuntimeError('OpenAI HTTP '+str(exc.code)) from None
            time.sleep(2 ** (attempt + 2))
        except urllib.error.URLError:
            raise RuntimeError('Network error; rerun to resume cached generation') from None

print('Unique clips:', len(unique), 'Input characters:', sum(map(len,unique)), flush=True)
paths = {}
with concurrent.futures.ThreadPoolExecutor(max_workers=8) as pool:
    jobs = [pool.submit(generate, text) for text in sorted(unique)]
    for job in concurrent.futures.as_completed(jobs):
        text, path = job.result()
        paths[text] = path
        if len(paths)%25 == 0 or len(paths)==len(unique):
            print('Completed',len(paths),'/',len(unique),flush=True)
manifest = {row['key']:paths[row['text']] for row in rows}
(folder/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
(ROOT/'zukan-audio-manifest.js').write_text('window.zukanAudioFiles = '+json.dumps(manifest,ensure_ascii=False)+';\n')
print('Complete. MP3 bytes:',sum((ROOT/p).stat().st_size for p in set(paths.values())),flush=True)
