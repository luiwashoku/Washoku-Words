"""Run: python3 tests/topic-vocabulary-cards.test.py (no audio rendering)."""
import hashlib
import json
from pathlib import Path
import subprocess

ROOT = Path(__file__).resolve().parent.parent
source = json.loads(subprocess.check_output([
    '/usr/bin/osascript', '-l', 'JavaScript',
    str(ROOT / 'scripts/export-topic-vocabulary.js'), str(ROOT),
], text=True))
by_key = {word['key']: word for word in source}
data = json.loads((ROOT / 'data/topic-vocabulary-cards.json').read_text())
catalog = json.loads((ROOT / 'data/catalog.json').read_text())
lesson = next(entry for entry in catalog if entry['id'] == 'topic-vocabulary-cards')
assert len(data['topics']) == 23 and data['wordCount'] == len(source) == 1111
assert data['sourceVocabularySha256'] == hashlib.sha256((ROOT / 'word explosion.txt').read_bytes()).hexdigest()
assert lesson['questionCount'] == len(data['entries']) == 116
assert lesson['homeOnly'] and lesson['ordered'] and lesson['titleAudioDisabled']
assert lesson['recordedAudioOnly'] and lesson['topicCards']
assert len({card['id'] for card in data['entries']}) == len(data['entries'])
assert [card['step'] for card in data['entries']] == list(range(1, len(data['entries']) + 1))
seen, memberships = set(), {}
for card in data['entries']:
    pairs = [pair for block in card['blocks'] for pair in block['pairs']]
    assert 1 <= len(pairs) <= 12
    for pair in pairs:
        key = pair['sourceKey']
        assert key not in seen
        seen.add(key)
        memberships[key] = card['topicId']
        original = by_key[key]
        assert pair['vocabulary']['english'] == original['english']
        assert pair['vocabulary']['speech'] == original['wordSpeech']
        assert pair['example'] == original['example']
        for path in [original['wordAudio'], original['exampleAudio']]:
            assert (ROOT / path).is_file() and (ROOT / path).stat().st_size > 100
assert seen == set(by_key)
for topic in data['topics']:
    cards = [card for card in data['entries'] if card['topicId'] == topic['id']]
    assert len(cards) == topic['pageCount'] > 0
    assert sum(len(block['pairs']) for card in cards for block in card['blocks']) == topic['wordCount'] > 0
for key, topic in {
    'ざいこ|在庫': 'shopping', 'わりびき|割引': 'shopping',
    'かーどばらい|カード払い': 'payment', 'ふぁすなー|ファスナー': 'clothing',
    'せんたく|洗濯': 'cleaning', 'やく|焼く': 'cooking', 'しょっかん|食感': 'taste',
    'あし|脚': 'health', 'あし|足': 'health', 'した|舌': 'health', 'した|下': 'travel',
}.items():
    assert memberships[key] == topic
assert sum(bool(row.get('contextOverride')) for row in source) == 3
finance = json.loads((ROOT / 'data/household-finance-cards.json').read_text())
for card in finance['entries']:
    for block in card['blocks']:
        for pair in block['pairs']:
            assert memberships[pair['sourceKey']] == 'shopping'
print('PASS: 1111 entries, 23 topics, 116 pages, financial vocabulary and comparisons with recorded examples')
