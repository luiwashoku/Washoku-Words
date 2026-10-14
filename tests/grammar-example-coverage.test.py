"""Validate the reviewed grammar evidence, register labels and recorded examples."""
import json
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parent.parent
cards = json.loads((ROOT / 'data/grammar-cards.json').read_text())['entries']
audit = json.loads((ROOT / 'data/grammar-example-audit.json').read_text())
review = json.loads((ROOT / 'scripts/lesson-audio-reviews/grammar-cards.json').read_text())
manifest = json.loads((ROOT / 'audio/lessons/grammar-cards/manifest.json').read_text())
evidence = {(row['card'], row['exampleIndex']): row for row in audit['examples']}
reviewed = {row['key']: row for row in review['entries']}
assert audit['reviewed'] and len(cards) == 275
assert len(evidence) == sum(len(card['examples']) for card in cards) == 550
assert review['voice'] == 'marin' and review['model'] == 'gpt-4o-mini-tts' and review['speed'] == 1.0

def lexical_reading(text):
    return re.sub(r'[一-龯々]+[（(]([ぁ-ゖァ-ヶー]+)[）)]', r'\1', text)

def hiragana(text):
    return ''.join(chr(ord(c) - 96) if 'ァ' <= c <= 'ヶ' else c for c in text)

for card in cards:
    for index, example in enumerate(card['examples']):
        row = evidence[(card['id'], index)]
        key = lexical_reading(example['japanese'])
        match = re.search(row['pattern'], hiragana(key))
        assert match and match[0] == row['evidence'], (card['id'], index, 'Missing reviewed grammar construction')
        assert row['point'] == card['kanji']
        if row['relationship'] == 'explicit-polite-equivalent':
            assert example['label'].startswith('Polite equivalent'), 'Different constructions need an explicit label'
        elif row['relationship'] == 'documented-contraction':
            assert 'contracted form' in example['label'] and 'Casual' in card['formation']
        assert example['english'] and key in reviewed and key in manifest
        assert reviewed[key].get('speed', review['speed']) == 1.0
        path = ROOT / manifest[key]
        assert path.is_file() and path.stat().st_size > 100 and path.name.startswith('marin-')
print('PASS: all 275 grammar points / 550 examples have reviewed construction evidence, clearly labelled equivalents and Marin 1.0 recordings.')
