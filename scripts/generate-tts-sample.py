"""Generate only the first food card with two voices. Run: python3 scripts/generate-tts-sample.py
Uses macOS's JS runner for the existing shared text cleaner; no extra packages.
Keys stay outside the website. Existing audio is reused by text/model/voice/speed hash.
"""
import hashlib
import html
import json
import os
from pathlib import Path
import subprocess
import time
import urllib.request
import urllib.error

ROOT = Path(__file__).resolve().parent.parent
samples = json.loads(subprocess.check_output([
    '/usr/bin/osascript', '-l', 'JavaScript',
    str(ROOT / 'scripts/export-tts-sample.js'), str(ROOT)
], text=True))
samples.insert(1, dict(label='名前 · Hiragana comparison', text='こしひかり', voices=['nova']))
key = os.environ.get('OPENAI_API_KEY') or (Path.home() / '.config/washoku-words/openai-api-key').read_text().strip()
folder = ROOT / 'audio/tts-sample'
folder.mkdir(parents=True, exist_ok=True)
manifest = []
for sample in samples:
    for voice in sample.get('voices', ['nova', 'shimmer']):
        payload = dict(model='tts-1-hd', voice=voice, input=sample['text'], speed=1.0, response_format='mp3')
        digest = hashlib.sha256(json.dumps(payload, ensure_ascii=False, sort_keys=True).encode()).hexdigest()[:20]
        path = folder / (voice + '-' + digest + '.mp3')
        if not path.exists() or path.stat().st_size == 0:
            request = urllib.request.Request('https://api.openai.com/v1/audio/speech',
                data=json.dumps(payload).encode(),
                headers={'Authorization': 'Bearer ' + key, 'Content-Type': 'application/json'})
            try:
                with urllib.request.urlopen(request, timeout=120) as response:
                    data = response.read()
                    if not response.headers.get('Content-Type', '').startswith('audio/') or len(data) < 100:
                        raise SystemExit('Unexpected audio response; stopped.')
            except urllib.error.HTTPError as exc:
                raise SystemExit('OpenAI returned HTTP %s; stopped without retrying.' % exc.code)
            except urllib.error.URLError:
                raise SystemExit('Cannot connect to OpenAI; stopped without retrying.')
            temporary = path.with_suffix('.tmp')
            temporary.write_bytes(data)
            temporary.replace(path)
            print('Saved', sample['label'], voice, len(data), 'bytes', flush=True)
            time.sleep(0.5)
        else:
            print('Cached', sample['label'], voice, flush=True)
        manifest.append(dict(sample, voice=voice, model='tts-1-hd', rate=1.0, file=str(path.relative_to(ROOT))))
(folder / 'manifest.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n')
rows = []
for sample in samples:
    clips = [m for m in manifest if m['label'] == sample['label']]
    rows.append('<section><h2>' + html.escape(sample['label']) + '</h2><p lang="ja">' + html.escape(sample['text']) + '</p>' + ''.join(
        '<div><label>' + m['voice'].title() + '</label><audio controls preload="none" src="./' + m['file'] + '"></audio></div>' for m in clips) + '</section>')
(ROOT / 'tts-sample.html').write_text('''<!doctype html>
<html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>コシヒカリ · Audio comparison</title><link rel="stylesheet" href="styles.css">
<style>main{max-width:760px;margin:auto;padding:28px}h1{font-size:30px}section{border-top:1px solid;padding:20px 0}section p{font-size:22px;line-height:1.8}section div{display:flex;align-items:center;gap:18px;margin:14px 0;flex-wrap:wrap}label{width:80px}audio{max-width:100%}</style>
<main><a href="./index.html">← Back to decks</a><h1 lang="ja">コシヒカリ</h1><p>Koshihikari rice · AI-generated voice samples</p>
<p>Nova and Shimmer · tts-1-hd · Speed 1.0</p><p>Each recording reads the text shown above it. Compare Nova's original コシヒカリ with the new こしひかり recording. Replaying uses saved MP3s.</p>
''' + ''.join(rows) + '''<p id="status" role="status"></p></main>
<script>
const players = [...document.querySelectorAll('audio')];
players.forEach(player => {
  player.addEventListener('play', () => {
    players.forEach(other => { if(other !== player) { other.pause(); other.currentTime = 0; } });
    document.getElementById('status').textContent = '';
  });
  player.addEventListener('error', () => { document.getElementById('status').textContent = 'Could not load this audio file. Please reload and try again.'; });
});
</script></html>''')
print('Ready: tts-sample.html')
