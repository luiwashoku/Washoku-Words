"""Run: python3 tests/cooking-reference-audio.test.py (no API calls)."""
import json
from pathlib import Path
import re
import subprocess

ROOT = Path(__file__).resolve().parent.parent


def load(path):
    return json.loads((ROOT / path).read_text())


review = load('scripts/lesson-audio-reviews/cooking-reference-cards.json')
manifest = load('audio/lessons/cooking-reference-cards/manifest.json')
rows = json.loads(subprocess.check_output([
    '/usr/bin/osascript', '-l', 'JavaScript',
    str(ROOT / 'scripts/export-lesson-audio.js'), str(ROOT), 'cooking-reference-cards',
], text=True))
entries = {entry['key']: entry for entry in review['entries']}
assert set(entries) == set(manifest) == {row['key'] for row in rows}
assert (review['voice'], review['model'], review['speed']) == ('marin', 'gpt-4o-mini-tts', 1.0)
assert review['reviewed'] and not review['audio_verification']['listening_verified']
for key, entry in entries.items():
    assert entry['hiragana_reviewed'] and entry['phrase_reviewed']
    assert entry['speed'] == 1.0 and re.fullmatch(r'[ぁ-ゖー、。！？!?\s]+', entry['input'])
    assert entry['reading_source'] and entry['pronunciation_guidance']
    assert entry['accent_status'] in ('dictionary', 'provisional')
    if entry['accent_status'] == 'dictionary':
        assert entry['accent'] in entry['accent_variants'] and entry['accent_source']
    else:
        assert 'accent' not in entry and 'provisional' in entry['pronunciation_guidance']
    assert all(component['source'] for component in entry['accent_components'])
    path = ROOT / manifest[key]
    assert 'marin-' in path.name and path.is_file() and path.stat().st_size > 100
    assert entry['audio'] == manifest[key]
    if entry.get('reuse_audio'):
        assert entry['reuse_source'] and manifest[key] == entry['reuse_audio']

# Same hiragana, distinct meanings and pitch: protect against text-only deduplication.
assert entries['やく']['input'] == entries['約']['input'] == 'やく'
assert entries['やく']['accent'] == 0 and entries['約']['accent'] == 1
assert manifest['やく'] != manifest['約']
assert entries['はんなま']['input'] == 'はんなま'
assert entries['はんなま']['accent_status'] == 'provisional'  # Never borrow はんせい.
assert entries['みずけをきる']['input'] == 'みずけおきる'
assert entries['ゴムてぶくろをはめてそうじします。']['input'] == 'ごむてぶくろおはめてそうじします。'
assert entries['とりにくは、なかまでしっかりひをとおします。']['input'] == 'とりにくわ、なかまでしっかりひおとおします。'

result = subprocess.check_output([
    'python3', str(ROOT / 'scripts/generate-lesson-audio.py'),
    '--lesson', 'cooking-reference-cards', '--dry-run',
], cwd=ROOT, text=True)
assert f'Distinct render targets: {len(entries)}' in result
catalog = load('data/catalog.json')
assert next(d for d in catalog if d['id'] == 'page07-08')['category'] == 'techniques'
assert not next(d for d in catalog if d['id'] == 'cooking-reference-cards').get('audioDisabled')
assert load('audio/lessons/manifest.json')['cooking-reference-cards'] == manifest
print(f'PASS: {len(entries)} reviewed Marin keys, reuse, pitch identities, contextual particles and category move')
