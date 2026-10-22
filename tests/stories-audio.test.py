"""Run: python3 tests/stories-audio.test.py. No generation or network calls."""
import hashlib
import json
from pathlib import Path
import re
import subprocess
ROOT = Path(__file__).resolve().parent.parent
data = json.loads((ROOT/'data/stories-cards.json').read_text())
review = json.loads((ROOT/'scripts/lesson-audio-reviews/stories-cards.json').read_text())
manifest = json.loads((ROOT/'audio/lessons/stories-cards/manifest.json').read_text())
audit = json.loads((ROOT/'docs/stories-audio-audit.json').read_text())['entries']
assert (review['voice'], review['model'], review['speed']) == ('marin', 'gpt-4o-mini-tts', 1.0)
entries = {entry['key']:entry for entry in review['entries']}
rows = json.loads(subprocess.check_output(['/usr/bin/osascript','-l','JavaScript',str(ROOT/'scripts/export-lesson-audio.js'),str(ROOT),'stories-cards'],text=True))
keys = {(row['card'], row['field']):row['key'] for row in rows}
ready = 0
for story in data['entries']:
    for message in story['messages']:
        if message.get('audioPending'):
            continue
        ready += 1
        key = keys[(story['id'], message['id'])]
        entry = entries[key]
        assert entry['display'] == message['japanese'] and entry['card'] == story['id']
        assert entry['speed'] == 1.0 and entry['voice'] == 'marin'
        assert entry['hiragana_reviewed'] and entry['phrase_reviewed'] and entry['context_review']
        assert entry['accent_status'] == 'provisional' and entry['accent_source']
        assert not re.search(r'[一-龯ァ-ヶA-Za-z0-9]', entry['input'])
        assert entry['listening_verified'] is False and entry['audible_pitch_verified'] is False
        path = ROOT/manifest[key]
        assert path.is_file() and path.stat().st_size > 100 and path.name.startswith('marin-')
        assert entry['audio'] == manifest[key] == audit[key]['audio']
        assert audit[key]['sha256'] == hashlib.sha256(path.read_bytes()).hexdigest()
        assert audit[key]['rms'] > 20 and audit[key]['clipped_sample_fraction'] == 0
        assert audit[key].get('transcript') and entry.get('automated_transcript_review')
assert ready == 238
assert all(not message.get('audioPending') for story in data['entries'] for message in story['messages'])
assert len(data['entries'][5]['messages']) == 23
assert all(not message.get('audioPending') for message in data['entries'][5]['messages'])
assert len(data['entries'][6]['messages']) == 20
assert all(not message.get('audioPending') for message in data['entries'][6]['messages'])
assert len(data['entries'][7]['messages']) == 22
assert all(not message.get('audioPending') for message in data['entries'][7]['messages'])
assert len(data['entries'][8]['messages']) == 26
assert all(not message.get('audioPending') for message in data['entries'][8]['messages'])
assert len(data['entries'][9]['messages']) == 24
assert all(not message.get('audioPending') for message in data['entries'][9]['messages'])
assert len(data['entries'][10]['messages']) == 26
assert all(not message.get('audioPending') for message in data['entries'][10]['messages'])
assert len(manifest) == len(entries) == ready
print('PASS: 238 reviewed Marin 1.0 Story 1–11 recordings, matching files/audits and unchanged display text; all eleven stories enabled.')
