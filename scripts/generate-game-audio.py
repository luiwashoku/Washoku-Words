"""Generate Nova audio for the four game decks. Reruns reuse content-addressed MP3s.
Run: python3 scripts/generate-game-audio.py
The private key is read from OPENAI_API_KEY or the external local key file.
"""
import argparse
import concurrent.futures
import hashlib
import json
import os
from pathlib import Path
import shutil
import subprocess
import time
import urllib.error
import urllib.request

ROOT = Path(__file__).resolve().parent.parent
rows = json.loads(subprocess.check_output(['/usr/bin/osascript', '-l', 'JavaScript', str(ROOT/'scripts/export-game-audio.js'), str(ROOT)], text=True))
parser = argparse.ArgumentParser()
parser.add_argument('--key', action='append', help='Regenerate only these lookup keys, preserving other manifest entries.')
args = parser.parse_args()
if args.key:
    selected = set(args.key)
    rows = [row for row in rows if row['key'] in selected]
    if {row['key'] for row in rows} != selected:
        parser.error('Requested lookup key is missing from exported speech rows')
key = os.environ.get('OPENAI_API_KEY') or (Path.home()/'.config/washoku-words/openai-api-key').read_text().strip()
folder = ROOT/'audio/game-decks'
folder.mkdir(parents=True, exist_ok=True)
unique = {row['text'] for row in rows}

def generate(text):
    payload = dict(model='tts-1-hd', voice='nova', input=text, speed=1.0, response_format='mp3')
    digest = hashlib.sha256(json.dumps(payload, ensure_ascii=False, sort_keys=True).encode()).hexdigest()[:20]
    name = 'nova-' + digest + '.mp3'
    path = folder/name
    sample = ROOT/'audio/taste-words'/name
    if not sample.exists():
        sample = ROOT/'audio/tts-sample'/name
    if not path.exists() and sample.exists():
        shutil.copyfile(sample, path)
    if path.exists() and path.stat().st_size:
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
with concurrent.futures.ThreadPoolExecutor(max_workers=32) as pool:
    jobs = [pool.submit(generate, text) for text in sorted(unique)]
    for job in concurrent.futures.as_completed(jobs):
        text, path = job.result()
        paths[text] = path
        if len(paths)%25 == 0 or len(paths)==len(unique):
            print('Completed',len(paths),'/',len(unique),flush=True)
manifest = json.loads((folder/'manifest.json').read_text()) if args.key else {}
manifest.update({row['key']:paths[row['text']] for row in rows})
(folder/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
(ROOT/'game-audio-manifest.js').write_text('window.gameAudioFiles = '+json.dumps(manifest,ensure_ascii=False)+';\n')
print('Complete. MP3 bytes:',sum((ROOT/p).stat().st_size for p in set(paths.values())),flush=True)
