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
supplement = json.loads((ROOT / 'data/topic-vocabulary-additions.json').read_text())
additions = supplement['topics']
updates = supplement.get('meaningUpdates', {})
extra = {word['sourceKey']: word for topic in additions for word in topic['vocabulary']}
assert len(extra) == 519 and not set(extra) & set(by_key)
manifest = json.loads((ROOT / 'audio/lessons/topic-vocabulary-cards/manifest.json').read_text())
review = json.loads((ROOT / 'scripts/lesson-audio-reviews/topic-vocabulary-cards.json').read_text())
reviewed = {entry['key']: entry for entry in review['entries']}
assert review['voice'] == 'marin' and review['model'] == 'gpt-4o-mini-tts' and review['speed'] == 1.0
data = json.loads((ROOT / 'data/topic-vocabulary-cards.json').read_text())
catalog = json.loads((ROOT / 'data/catalog.json').read_text())
lesson = next(entry for entry in catalog if entry['id'] == 'topic-vocabulary-cards')
assert len(data['topics']) == 25 and len(source) == 1111 and data['wordCount'] == len(source) + len(extra) == 1630
assert data['sourceVocabularySha256'] == hashlib.sha256((ROOT / 'data/word-explosion.txt').read_bytes()).hexdigest()
assert lesson['questionCount'] == len(data['entries']) == 171
assert lesson['homeOnly'] and lesson['ordered'] and lesson['titleAudioDisabled']
assert lesson['recordedAudioOnly'] and lesson['topicCards']
assert len({card['id'] for card in data['entries']}) == len(data['entries'])
assert [card['step'] for card in data['entries']] == list(range(1, len(data['entries']) + 1))
seen, memberships = set(), {}
for card in data['entries']:
    pairs = [pair for block in card['blocks'] for pair in block.get('pairs', block.get('items', []))]
    assert 1 <= len(pairs) <= (20 if card['topicId'] == 'material-manipulation' else 12)
    for pair in pairs:
        key = pair['sourceKey']
        assert key not in seen
        seen.add(key)
        memberships[key] = card['topicId']
        if key in extra:
            word = extra[key]
            vocabulary = pair.get('vocabulary', pair)
            assert vocabulary['japanese'] == word['japanese']
            assert vocabulary['english'] == word['english'] and vocabulary['speech'] == word['speech']
            if word.get('audioPending'):
                assert vocabulary['audioPending'] and pair['example'] == word['example']
                assert pair['example']['audioPending']
                assert key not in manifest and key not in reviewed
                continue
            if word.get('example'):
                assert pair['example'] == word['example']
                example = reviewed[word['example']['speech']]
                assert example['kind'] == 'supplemental-example'
                assert example['hiragana_reviewed'] and example['phrase_reviewed']
                assert example['speed'] == 1.0 and example['accent_status'] == 'provisional'
                sentence_audio = ROOT / manifest[word['example']['speech']]
                assert sentence_audio.is_file() and sentence_audio.name.startswith('marin-')
            assert reviewed[key]['input'].rstrip('。') == ('ちからおぬく' if word['display'] == '力を抜く' else word['reading']) and reviewed[key]['speed'] == 1.0
            assert reviewed[key]['accent_status'] in ['dictionary', 'provisional']
            audio = ROOT / manifest[key]
            assert audio.is_file() and audio.stat().st_size > 100 and audio.name.startswith('marin-')
            assert manifest[key] == reviewed[key]['audio'], 'Existing word recordings must be preserved'
            continue
        original = by_key[key]
        assert pair['vocabulary']['english'] == updates.get(key, {}).get('english', original['english'])
        assert pair['vocabulary']['speech'] == original['wordSpeech']
        expected_example = dict(original['example'])
        if updates.get(key, {}).get('additionalExample'):
            expected_example['explanation'] = updates[key]['additionalExample']
        assert pair['example'] == expected_example
        for path in [original['wordAudio'], original['exampleAudio']]:
            assert (ROOT / path).is_file() and (ROOT / path).stat().st_size > 100
assert seen == set(by_key) | set(extra)
for topic in data['topics']:
    cards = [card for card in data['entries'] if card['topicId'] == topic['id']]
    assert len(cards) == topic['pageCount'] > 0
    assert sum(len(block.get('pairs', block.get('items', []))) for card in cards for block in card['blocks']) == topic['wordCount'] > 0
for key, topic in {
    'ざいこ|在庫': 'shopping', 'わりびき|割引': 'shopping',
    'かーどばらい|カード払い': 'shopping', 'ふぁすなー|ファスナー': 'clothing',
    'せんたく|洗濯': 'home', 'やく|焼く': 'cooking', 'しょっかん|食感': 'food-taste',
    'あし|脚': 'health', 'あし|足': 'health', 'した|舌': 'health', 'した|下': 'travel',
}.items():
    assert memberships[key] == topic
assert sum(bool(row.get('contextOverride')) for row in source) == 3
finance = json.loads((ROOT / 'data/household-finance-cards.json').read_text())
for card in finance['entries']:
    for block in card['blocks']:
        for pair in block['pairs']:
            assert memberships[pair['sourceKey']] == 'shopping'
organization = json.loads((ROOT / 'data/vocabulary-topic-organization.json').read_text())
source_destinations = {source: topic['id'] for topic in organization['topics'] for source in topic['sources']}
word_destinations = {move['sourceKey']: move['topicId'] for move in organization['wordMoves']}
for topic in additions:
    assert all(memberships[word['sourceKey']] == word_destinations.get(word['sourceKey'], source_destinations[topic['id']]) for word in topic['vocabulary'])
for key, destination in word_destinations.items():
    assert memberships[key] == destination
assert [topic['id'] for topic in data['topics']] == [topic['id'] for topic in organization['topics']]
assert [topic['id'] for topic in data['topics'][:5]] == ['restaurants', 'travel', 'shopping', 'cooking', 'clothing']
assert memberships['こんだて|献立'] == memberships['よやく|予約'] == memberships['とりざら|取り皿'] == 'restaurants'
assert data['topics'][-2]['id'] == 'work'
assert data['topics'][-1]['id'] == 'material-manipulation'
example_keys = {word['example']['speech'] for word in extra.values() if word.get('example') and not word.get('audioPending')}
assert len(example_keys) == sum(bool(word.get('example')) and not word.get('audioPending', False) for word in extra.values())
additional_keys = {update['additionalExample']['speech'] for update in updates.values() if update.get('additionalExample')}
assert {key for key, word in extra.items() if not word.get('audioPending')} | example_keys | additional_keys == set(manifest) == set(reviewed)
assert len(additional_keys) == 1
for key in additional_keys:
    assert (ROOT / manifest[key]).is_file() and reviewed[key]['speed'] == 1.0
assert reviewed[extra['よわび|弱火']['example']['speech']]['input'].startswith('ふたおして')
assert reviewed[extra['はいそう|配送']['example']['speech']]['input'].startswith('かいがいえの')
assert reviewed[extra['はさみ|はさみ']['example']['speech']]['input'].startswith('はさみで')
assert reviewed[extra['おかわり|おかわり']['example']['speech']]['input'].startswith('ごはんの')
requested = json.loads((ROOT / 'data/everyday-vocabulary-request.json').read_text())['entries']
assert len(requested) == 243
for word in requested:
    key = word['sourceKey']
    assert key in seen
    if key in extra:
        assert extra[key]['english'] == word['english']
        assert extra[key]['reading'] == word['reading']
    else:
        assert key == 'まかせる|任せる' and by_key[key]['english'] == 'leave it to someone'
assert memberships['がら|柄'] != memberships['え|柄']
assert 'なおる|治る' in extra and 'なおる|直る' in by_key
assert reviewed['ちからをぬく|力を抜く']['input'] == 'ちからおぬく'
requested = json.loads((ROOT / 'data/materials-nature-weather-request.json').read_text())['entries']
assert len(requested) == 159 and len({word['sourceKey'] for word in requested}) == 158
new_requested = {word['sourceKey'] for topic in additions if topic['id'] in ['materials', 'expanded-nature', 'weather'] for word in topic['vocabulary']}
assert len(new_requested) == 151
assert sum(word['sourceKey'] in new_requested for word in requested) == 150  # 雲 appears twice in the request.
for word in requested:
    assert word['sourceKey'] in seen
    if word['sourceKey'] in extra:
        assert extra[word['sourceKey']]['reading'] == word['reading']
        assert extra[word['sourceKey']]['english'] == word['english']
assert updates['しぜん|自然']['english'] == 'natural / nature'
assert memberships['かわ|川'] != memberships['かわ|革']
assert extra['かみせい|紙製']['reading'] == 'かみせい'
assert reviewed['は|葉']['input'] == 'は'
assert extra['ひょう|雹']['english'] == 'hail'
assert extra['あられ|霰']['reading'] == 'あられ'
material_request = json.loads((ROOT / 'data/material-manipulation-request.json').read_text())['entries']
material_cards = [card for card in data['entries'] if card['topicId'] == 'material-manipulation']
assert [len(card['blocks'][0]['pairs']) for card in material_cards] == [20, 20, 12]
material_pairs = [pair for card in material_cards for pair in card['blocks'][0]['pairs']]
assert [pair['sourceKey'] for pair in material_pairs] == [word['sourceKey'] for word in material_request]
for word, pair in zip(material_request, material_pairs):
    assert pair['vocabulary']['japanese'] == word['japanese']
    assert pair['vocabulary']['english'] == word['english']
    assert pair['example'] == word['example']
print('PASS: 1,630 entries, 25 topics, 171 pages; all 52 material-manipulation entries preserved on 20/20/12 pages; reviewed Marin 1.0 audio and existing recordings retained.')
