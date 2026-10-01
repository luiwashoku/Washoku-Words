"""Generate reviewed Nova lesson audio in batches. Reruns reuse content-addressed MP3s.
Run: python3 scripts/generate-lesson-audio.py --lesson page01-02
The private key is read from OPENAI_API_KEY or the external local key file.
"""
import argparse
import concurrent.futures
import hashlib
import json
import os
import re
from pathlib import Path
import shutil
import subprocess
import time
import urllib.error
import urllib.request

ROOT = Path(__file__).resolve().parent.parent
parser = argparse.ArgumentParser(description='Generate one reviewed Nova lesson batch.')
parser.add_argument('--lesson', required=True)
parser.add_argument('--retry-key', action='append', default=[])
args = parser.parse_args()
rows = json.loads(subprocess.check_output(['/usr/bin/osascript', '-l', 'JavaScript', str(ROOT/'scripts/export-lesson-audio.js'), str(ROOT), args.lesson], text=True))
review_file = ROOT/'scripts/lesson-audio-reviews'/(args.lesson+'.json')
if not review_file.exists():
    parser.error('Review the hiragana readings and particles before generating this lesson')
review = json.loads(review_file.read_text())
if not review.get('reviewed') or review.get('lesson') != args.lesson:
    parser.error('A completed reading review is required')
inputs = {entry['key']:entry['input'] for entry in review['entries']}
known_keys = {row['key'] for row in rows}
if set(inputs) != known_keys:
    parser.error('Reading review must cover exactly every current speech key')
for row in rows:
    row['text'] = inputs[row['key']]
    if not row['text'] or re.search(r'[\u3400-\u9fff々\u30a1-\u30faA-Za-z]', row['text']):
        parser.error('Checked hiragana input required for '+row['key'])
if set(args.retry_key) - known_keys:
    parser.error('Unknown retry key')
retry_texts = {row['text'] for row in rows if row['key'] in args.retry_key}
key = os.environ.get('OPENAI_API_KEY') or (Path.home()/'.config/washoku-words/openai-api-key').read_text().strip()
folder = ROOT/'audio/lessons'/args.lesson
folder.mkdir(parents=True, exist_ok=True)
unique = {row['text'] for row in rows}

def generate(text):
    payload = dict(model='tts-1-hd', voice='nova', input=text, speed=1.0, response_format='mp3')
    digest = hashlib.sha256(json.dumps(payload, ensure_ascii=False, sort_keys=True).encode()).hexdigest()[:20]
    name = 'nova-' + digest + '.mp3'
    path = folder/name
    sample = ROOT/'audio/zukan'/name
    if not sample.exists():
        sample = ROOT/'audio/game-decks'/name
    if not sample.exists():
        sample = ROOT/'audio/taste-words'/name
    if not sample.exists():
        sample = ROOT/'audio/tts-sample'/name
    if text not in retry_texts and not path.exists() and sample.exists():
        shutil.copyfile(sample, path)
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
with concurrent.futures.ThreadPoolExecutor(max_workers=32) as pool:
    jobs = [pool.submit(generate, text) for text in sorted(unique)]
    for job in concurrent.futures.as_completed(jobs):
        text, path = job.result()
        paths[text] = path
        if len(paths)%25 == 0 or len(paths)==len(unique):
            print('Completed',len(paths),'/',len(unique),flush=True)
manifest = {row['key']:paths[row['text']] for row in rows}
(folder/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
combined_path = ROOT/'audio/lessons/manifest.json'
combined = json.loads(combined_path.read_text()) if combined_path.exists() else {}
combined[args.lesson] = manifest
combined_path.write_text(json.dumps(combined,ensure_ascii=False,indent=2)+'\n')
(ROOT/'lesson-audio-manifest.js').write_text('window.lessonAudioFiles = '+json.dumps(combined,ensure_ascii=False)+';\n')
print('Complete. MP3 bytes:',sum((ROOT/p).stat().st_size for p in set(paths.values())),flush=True)
