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
parser.add_argument('--card', help='Generate only one reading card; preserve previously generated cards')
args = parser.parse_args()
rows = json.loads(subprocess.check_output(['/usr/bin/osascript', '-l', 'JavaScript', str(ROOT/'scripts/export-lesson-audio.js'), str(ROOT), args.lesson] + ([args.card] if args.card else []), text=True))
if not rows:
    parser.error('No speech keys found for the requested lesson/card')
review_file = ROOT/'scripts/lesson-audio-reviews'/(args.lesson+'.json')
if not review_file.exists():
    parser.error('Review the hiragana readings and particles before generating this lesson')
review = json.loads(review_file.read_text())
if not review.get('reviewed') or review.get('lesson') != args.lesson:
    parser.error('A completed reading review is required')
speed = review.get('speed', 1.0)
if not isinstance(speed, (int, float)) or not 0.25 <= speed <= 4:
    parser.error('Reviewed speech speed must be a number between 0.25 and 4')
model = review.get('model', 'tts-1-hd')
voice = review.get('voice', 'nova')
if (model, voice) not in [('tts-1-hd', 'nova'), ('gpt-4o-mini-tts', 'marin')]:
    parser.error('Unsupported reviewed model and voice')
inputs = {entry['key']:entry['input'] for entry in review['entries']}
speeds = {entry['key']:entry.get('speed', speed) for entry in review['entries']}
if any(not isinstance(value, (int, float)) or not 0.25 <= value <= 4 for value in speeds.values()):
    parser.error('Reviewed entry speech speeds must be numbers between 0.25 and 4')
known_keys = {row['key'] for row in rows}
if args.card:
    inputs = {k:v for k,v in inputs.items() if k in known_keys}
if set(inputs) != known_keys:
    parser.error('Reading review must cover exactly every current speech key')
for row in rows:
    row['text'] = inputs[row['key']]
    row['speed'] = speeds[row['key']]
    entry = next(item for item in review['entries'] if item['key'] == row['key'])
    authorized_kanji = (
        voice == 'marin' and entry.get('allow_kanji_input') is True
        and bool(entry.get('kanji_input_authorization'))
        and bool(entry.get('reviewed_hiragana'))
        and not re.search(r'[\u3400-\u9fff々\u30a1-\u30faA-Za-z]', entry['reviewed_hiragana'])
        and bool(entry.get('pronunciation_guidance'))
    )
    if not row['text'] or (re.search(r'[\u3400-\u9fff々\u30a1-\u30faA-Za-z]', row['text']) and not authorized_kanji):
        parser.error('Checked hiragana input required for '+row['key'])
if set(args.retry_key) - known_keys:
    parser.error('Unknown retry key')
retry_inputs = {(row['text'], row['speed']) for row in rows if row['key'] in args.retry_key}
key = os.environ.get('OPENAI_API_KEY') or (Path.home()/'.config/washoku-words/openai-api-key').read_text().strip()
folder = ROOT/'audio/lessons'/args.lesson
folder.mkdir(parents=True, exist_ok=True)
unique = {(row['text'], row['speed']) for row in rows}

def generate(text, speed):
    payload = dict(model=model, voice=voice, input=text, speed=speed, response_format='mp3')
    if voice == 'marin':
        entry = next(item for item in review['entries'] if item['input'] == text)
        guidance = 'Speak standard Tokyo Japanese. Read only the supplied hiragana once, clearly and naturally. Preserve vowel length and doubled consonants. Do not add an introduction, translation, explanation, or other words.'
        if entry.get('allow_kanji_input'):
            guidance = 'Speak standard Tokyo Japanese. Read only the supplied Japanese term once, clearly and naturally, using its explicitly reviewed reading: ' + entry['reviewed_hiragana'] + '. Preserve vowel length and doubled consonants. Do not add an introduction, translation, explanation, or other words.'
        if entry.get('pronunciation_guidance'):
            guidance += ' ' + entry['pronunciation_guidance']
        if entry.get('accent') == 0:
            guidance += ' Use heiban pitch accent: begin low, rise on the second mora and keep high, without a lexical pitch drop.'
        elif isinstance(entry.get('accent'), int) and entry['accent'] > 0:
            guidance += f" Use Tokyo pitch accent type {entry['accent']}: drop immediately after mora {entry['accent']}, without exaggerated stress."
        payload['instructions'] = guidance
    digest = hashlib.sha256(json.dumps(payload, ensure_ascii=False, sort_keys=True).encode()).hexdigest()[:20]
    name = voice + '-' + digest + '.mp3'
    path = folder/name
    sample = ROOT/'audio/zukan'/name
    if not sample.exists():
        sample = ROOT/'audio/game-decks'/name
    if not sample.exists():
        sample = ROOT/'audio/taste-words'/name
    if not sample.exists():
        sample = ROOT/'audio/tts-sample'/name
    if (text, speed) not in retry_inputs and not path.exists() and sample.exists():
        shutil.copyfile(sample, path)
    if (text, speed) not in retry_inputs and path.exists() and path.stat().st_size:
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
with concurrent.futures.ThreadPoolExecutor(max_workers=32) as pool:
    jobs = [pool.submit(generate, text, speed) for text, speed in sorted(unique)]
    for job in concurrent.futures.as_completed(jobs):
        text, path = job.result()
        paths[text] = path
        if len(paths)%25 == 0 or len(paths)==len(unique):
            print('Completed',len(paths),'/',len(unique),flush=True)
manifest_path = folder/'manifest.json'
manifest = json.loads(manifest_path.read_text()) if args.card and manifest_path.exists() else {}
manifest.update({row['key']:paths[(row['text'], row['speed'])] for row in rows})
(folder/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
combined_path = ROOT/'audio/lessons/manifest.json'
combined = json.loads(combined_path.read_text()) if combined_path.exists() else {}
combined[args.lesson] = manifest
combined_path.write_text(json.dumps(combined,ensure_ascii=False,indent=2)+'\n')
(ROOT/'lesson-audio-manifest.js').write_text('window.lessonAudioFiles = '+json.dumps(combined,ensure_ascii=False)+';\n')
print('Complete. MP3 bytes:',sum((ROOT/p).stat().st_size for p in set(paths.values())),flush=True)
