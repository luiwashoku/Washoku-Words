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


def organize_topics(definitions, organization):
    """Reorder/merge source topics without changing any vocabulary payload."""
    sources = {topic['id']: topic for topic in definitions}
    assignments = []
    for topic in organization['topics']:
        assignments.extend(topic['sources'])
    if len(assignments) != len(set(assignments)):
        raise ValueError('A source topic may only belong to one organized category')
    if set(assignments) - set(sources):
        raise ValueError('Organization references an unknown source topic')
    moves = organization.get('wordMoves', [])
    moved_keys = {move['sourceKey'] for move in moves}
    if len(moved_keys) != len(moves):
        raise ValueError('A word may only be moved once')
    available = {key for topic in definitions for group in topic['groups'] for key in group['keys']}
    if moved_keys - available:
        raise ValueError('Organization moves an unknown vocabulary entry')
    organized = []
    for topic in organization['topics']:
        groups = []
        for source_id in topic['sources']:
            for source_group in sources[source_id]['groups']:
                keys = [key for key in source_group['keys'] if key not in moved_keys]
                if keys:
                    labels = organization.get('sectionLabels', {}).get(source_id + ':' + source_group['id'], {})
                    groups.append({**source_group, **labels, 'id': source_id + '-' + source_group['id'],
                                   'cardIdPrefix': f"topic-{source_id}-{source_group['id']}", 'keys': keys})
        routed = [move['sourceKey'] for move in moves if move['topicId'] == topic['id']]
        if routed:
            groups.append({'id': 'related', 'japanese': topic['japanese'],
                           'english': topic['english'], 'keys': routed})
        organized.append({k: v for k, v in topic.items() if k != 'sources'} | {'groups': groups})
    # Future source topics stay available even before a priority has been assigned.
    organized.extend(topic for topic in definitions if topic['id'] not in assignments)
    before = [key for topic in definitions for group in topic['groups'] for key in group['keys']]
    after = [key for topic in organized for group in topic['groups'] for key in group['keys']]
    if len(after) != len(before) or set(after) != set(before) or len(after) != len(set(after)):
        raise ValueError('Reorganization must preserve every vocabulary entry exactly once')
    return organized


def main():
    source = json.loads(subprocess.check_output([
        '/usr/bin/osascript', '-l', 'JavaScript',
        str(ROOT / 'scripts/export-topic-vocabulary.js'), str(ROOT),
    ], text=True))
    by_key = {word['key']: word for word in source}
    definitions = json.loads((ROOT / 'data/vocabulary-card-topics.json').read_text())['topics']
    additions_file = ROOT / 'data/topic-vocabulary-additions.json'
    if additions_file.exists():
        supplement = json.loads(additions_file.read_text())
        for key, update in supplement.get('meaningUpdates', {}).items():
            if key not in by_key:
                raise ValueError('Meaning update has no original vocabulary entry: ' + key)
            by_key[key]['english'] = update['english']
            if update.get('additionalExample'):
                by_key[key]['example']['explanation'] = dict(update['additionalExample'])
        additions = supplement['topics']
        for topic in additions:
            keys = []
            for word in topic['vocabulary']:
                key = word['sourceKey']
                if key in by_key:
                    raise ValueError('Supplement duplicates an existing vocabulary key: ' + key)
                by_key[key] = {
                    'key': key, 'reading': word['reading'], 'display': word['display'],
                    'label': word['japanese'], 'english': word['english'],
                    'wordSpeech': word['speech'],
                }
                if word.get('example'):
                    by_key[key]['example'] = dict(word['example'])
                keys.append(key)
            definitions.append({
                'id': topic['id'], 'japanese': topic['japanese'], 'english': topic['english'],
                'groups': [{'id': 'vocabulary', 'japanese': topic['japanese'],
                            'english': topic['english'], 'keys': keys,
                            'vocabularyOnly': not all(word.get('example') for word in topic['vocabulary'])}],
            })
    assigned = [key for topic in definitions for group in topic['groups'] for key in group['keys']]
    if len(assigned) != len(set(assigned)) or set(assigned) != set(by_key):
        raise ValueError('Every source vocabulary key must appear exactly once in the topic definitions')
    if len({topic['id'] for topic in definitions}) != len(definitions):
        raise ValueError('Vocabulary topic IDs must be unique')
    organization_file = ROOT / 'data/vocabulary-topic-organization.json'
    if organization_file.exists():
        definitions = organize_topics(definitions, json.loads(organization_file.read_text()))
    if len({topic['id'] for topic in definitions}) != len(definitions):
        raise ValueError('Organized category IDs must be unique')
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
                    vocabulary = {'japanese': label, 'reading': word['reading'],
                                  'english': word['english'], 'speech': word['wordSpeech']}
                    if group.get('vocabularyOnly'):
                        pairs.append({'sourceKey': key, **vocabulary})
                    else:
                        pairs.append({
                            'sourceKey': key,
                            'vocabulary': {k: v for k, v in vocabulary.items() if k != 'reading'},
                            'example': dict(word['example']),
                        })
                cards.append({
                    'id': group.get('cardIdPrefix', f"topic-{topic['id']}-{group['id']}") + f'-{part:02d}',
                    'step': len(cards) + 1, 'topicId': topic['id'],
                    'topicJapanese': topic['japanese'], 'topicEnglish': topic['english'],
                    'kanji': title, 'japanese': title,
                    'english': group['english'] + (f' · {part}/{total}' if total > 1 else ''),
                    'searchText': ' '.join(by_key[key]['key'] + ' ' + by_key[key]['english'] for key in group['keys'][offset:offset + PAGE_SIZE]),
                    'blocks': [{'items': pairs}] if group.get('vocabularyOnly') else [
                        {'japanese': group['japanese'], 'english': group['english'], 'exampleSentences': True, 'pairs': pairs}],
                })
        topics.append({
            'id': topic['id'], 'japanese': topic['japanese'], 'english': topic['english'],
            'wordCount': sum(len(group['keys']) for group in topic['groups']),
            'pageCount': len(cards) - start,
        })
    data = {
        'title': '単語', 'sourceFiles': ['data/word-explosion.txt', 'data/word-explosion-examples.json', 'data/household-finance-cards.json']
        + (['data/topic-vocabulary-additions.json'] if additions_file.exists() else []),
        'organizationFile': 'data/vocabulary-topic-organization.json' if organization_file.exists() else None,
        'sourceVocabularySha256': hashlib.sha256((ROOT / 'data/word-explosion.txt').read_bytes()).hexdigest(),
        'wordCount': len(by_key), 'topics': topics, 'entries': cards,
    }
    (ROOT / 'data/topic-vocabulary-cards.json').write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n')
    print(f"Built {len(by_key)} words across {len(topics)} topics and {len(cards)} pages; existing examples and recordings retained")


if __name__ == '__main__':
    main()
