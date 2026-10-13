"""Build topic cards from the original vocabulary, examples and curated groups.

This reuses the active recordings. It does not generate or replace audio.
Run: python3 scripts/build-topic-vocabulary.py
"""
import hashlib
import json
from pathlib import Path
import subprocess

ROOT = Path(__file__).resolve().parent.parent
PAGE_SIZE = 12


def main():
    source = json.loads(subprocess.check_output([
        '/usr/bin/osascript', '-l', 'JavaScript',
        str(ROOT / 'scripts/export-topic-vocabulary.js'), str(ROOT),
    ], text=True))
    by_key = {word['key']: word for word in source}
    definitions = json.loads((ROOT / 'data/vocabulary-card-topics.json').read_text())['topics']
    assigned = [key for topic in definitions for group in topic['groups'] for key in group['keys']]
    if len(assigned) != len(set(assigned)) or set(assigned) != set(by_key):
        raise ValueError('Every source vocabulary key must appear exactly once in the topic definitions')
    if len(definitions) != 23 or len({topic['id'] for topic in definitions}) != 23:
        raise ValueError('Expected the 23 agreed topics')
    cards, topics = [], []
    for topic in definitions:
        start = len(cards)
        for group in topic['groups']:
            total = (len(group['keys']) + PAGE_SIZE - 1) // PAGE_SIZE
            for offset in range(0, len(group['keys']), PAGE_SIZE):
                part = offset // PAGE_SIZE + 1
                title = group['japanese']
                if title != topic['japanese']:
                    title = topic['japanese'] + ' · ' + title
                if total > 1:
                    title += f'（{part}/{total}）'
                pairs = []
                for key in group['keys'][offset:offset + PAGE_SIZE]:
                    word = by_key[key]
                    label = word['display']
                    if 'label' in word:
                        label = word['label']
                    elif label != word['reading']:
                        label += '(' + word['reading'] + ')'
                    pairs.append({
                        'sourceKey': key,
                        'vocabulary': {'japanese': label, 'english': word['english'], 'speech': word['wordSpeech']},
                        'example': dict(word['example']),
                    })
                cards.append({
                    'id': f"topic-{topic['id']}-{group['id']}-{part:02d}",
                    'step': len(cards) + 1, 'topicId': topic['id'],
                    'topicJapanese': topic['japanese'], 'topicEnglish': topic['english'],
                    'kanji': title, 'japanese': title,
                    'english': group['english'] + (f' · {part}/{total}' if total > 1 else ''),
                    'searchText': ' '.join(by_key[key]['key'] + ' ' + by_key[key]['english'] for key in group['keys'][offset:offset + PAGE_SIZE]),
                    'blocks': [{'japanese': group['japanese'], 'english': group['english'], 'exampleSentences': True, 'pairs': pairs}],
                })
        topics.append({
            'id': topic['id'], 'japanese': topic['japanese'], 'english': topic['english'],
            'wordCount': sum(len(group['keys']) for group in topic['groups']),
            'pageCount': len(cards) - start,
        })
    data = {
        'title': '単語カード', 'sourceFiles': ['word explosion.txt', 'data/word-explosion-examples.json', 'data/household-finance-cards.json'],
        'sourceVocabularySha256': hashlib.sha256((ROOT / 'word explosion.txt').read_bytes()).hexdigest(),
        'wordCount': len(source), 'topics': topics, 'entries': cards,
    }
    (ROOT / 'data/topic-vocabulary-cards.json').write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n')
    print(f"Built {len(source)} words across {len(topics)} topics and {len(cards)} pages; existing examples and recordings retained")


if __name__ == '__main__':
    main()
