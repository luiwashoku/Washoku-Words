"""Export the current 単語カード vocabulary (including supplemental word-only cards).
Run: python3 scripts/export-topic-vocabulary-list.py
"""
from datetime import datetime
import json
from pathlib import Path
import re
from zoneinfo import ZoneInfo

ROOT = Path(__file__).resolve().parent.parent

def main():
    data = json.loads((ROOT / 'data/topic-vocabulary-cards.json').read_text())
    def escape(value):
        return str(value).replace('|', '\\|').replace('\n', ' ')
    def label(value):
        return re.sub(r'[（(][ぁ-ゖァ-ヶー]+[）)]', '', value)
    today = datetime.now(ZoneInfo('Europe/Zurich')).date().isoformat()
    lines = ['# ' + data['title'] + ' — Complete vocabulary list', '',
             f"{data['wordCount']:,} entries from the current vocabulary deck, grouped in deck order.", '',
             f'Source: `data/topic-vocabulary-cards.json`. Exported {today}. This is a reference export; the app continues to load its vocabulary from the source data.', '']
    seen = set()
    last_topic = None
    for card in data['entries']:
        if card['topicId'] != last_topic:
            lines += ['## ' + escape(card['topicJapanese']) + ' · ' + escape(card['topicEnglish']), '']
            last_topic = card['topicId']
        lines += ['### ' + str(card['step']) + '. ' + escape(label(card['kanji'])), '',
                  '| Japanese | Kana reading | English |', '| --- | --- | --- |']
        for block in card['blocks']:
            for item in block.get('pairs', block.get('items', [])):
                word = item.get('vocabulary', item)
                key = item['sourceKey']
                if key in seen:
                    raise ValueError('Duplicate vocabulary key: ' + key)
                seen.add(key)
                reading = word.get('reading') or key.split('|', 1)[0]
                lines.append('| ' + escape(label(word['japanese'])) + ' | ' + escape(reading) + ' | ' + escape(word['english']) + ' |')
        lines.append('')
    if len(seen) != data['wordCount']:
        raise ValueError('Export does not match the deck word count')
    target = ROOT / 'docs/topic-vocabulary-list.md'
    target.write_text('\n'.join(lines) + '\n')
    print(f'Exported {len(seen):,} words to {target.relative_to(ROOT)}')

if __name__ == '__main__':
    main()
