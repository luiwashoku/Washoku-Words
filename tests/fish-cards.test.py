"""Run: python3 tests/fish-cards.test.py"""
import json
from pathlib import Path
import re
import unittest
from urllib.parse import parse_qs, urlsplit
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parent.parent
SOURCES = [('page78', 'data/pages78.json'), ('page79', 'data/pages79.json'),
           ('page79-three-piece', 'data/pages79-three-piece.json')]


def read(path):
    return json.loads((ROOT / path).read_text())


def corrected_annotations(text):
    return (text.replace('一(いち)対(たい)', '一対(いっつい)')
            .replace('オレンジ色(しょく)', 'オレンジ色(いろ)')
            .replace('左右一対(いっつい)', '左右(さゆう)一対(いっつい)'))


class FishCardsTest(unittest.TestCase):
    def test_three_sources_and_distinct_diagrams(self):
        catalog = read('data/catalog.json')
        lesson = next(item for item in catalog if item['id'] == 'fish-cards')
        self.assertEqual(catalog[catalog.index(lesson) - 1]['id'], 'page79-three-piece')
        menu = sorted([item for item in catalog if item['category'] == 'animal-ingredients'],
                      key=lambda item: item.get('sortOrder') or int(re.match(r'\d+', str(item['page'])).group()))
        self.assertEqual(menu[menu.index(lesson) - 1]['id'], 'page79-three-piece')
        self.assertEqual(lesson['title'], '魚カード')
        self.assertEqual(lesson['questionCount'], 33)
        self.assertTrue(lesson['ordered'] and lesson['compactCards'])
        cards = read(lesson['file'])['entries']
        expected = [(source_id, q, re.sub(r'\([^)]*\)', '', name))
                    for source_id, file in SOURCES for q in read(file)
                    for name in q['answers'][q['correct']].split('・')]
        self.assertEqual(len(cards), len(expected))
        for card, (source_id, question, name) in zip(cards, expected):
            self.assertEqual(card['kanji'], name)
            self.assertEqual(card['sourceLesson'], source_id)
            self.assertEqual(card['sourceCard'], question['id'])
            self.assertEqual(card['example']['japanese'], corrected_annotations(question['jpExplanation']))
            self.assertEqual(card['example']['english'], question['enExplanation'])
            image = urlsplit(card['image'])
            self.assertEqual(image.path + '#' + image.fragment, question['image'])
            self.assertEqual(parse_qs(image.query)['highlight'], [image.fragment])
            svg = ET.parse(ROOT / image.path).getroot()
            self.assertTrue(any(node.get('id') == image.fragment for node in svg.iter()))
        for term in ['皮', '背骨', '腹骨']:
            matches = [card for card in cards if card['kanji'] == term]
            self.assertEqual(len(matches), 2)
            self.assertEqual(len({card['image'] for card in matches}), 2)

    def test_normal_speed_marin_and_pitch_provenance(self):
        cards = read('data/fish-cards.json')['entries']
        review = read('scripts/lesson-audio-reviews/fish-cards.json')
        audio = read('audio/lessons/fish-cards/manifest.json')
        entries = {entry['key']: entry for entry in review['entries']}
        self.assertTrue(review['reviewed'])
        self.assertEqual((review['voice'], review['model']), ('marin', 'gpt-4o-mini-tts'))
        self.assertEqual(set(entries), set(audio))
        self.assertEqual(len(audio), 62)
        self.assertEqual(audio, read('audio/lessons/manifest.json')['fish-cards'])
        vocabulary = {card['japanese'] for card in cards}
        self.assertEqual(len(vocabulary), 30)
        self.assertEqual(sum(entries[key]['accent'] is not None for key in vocabulary), 22)
        for card in cards:
            self.assertEqual(entries[card['japanese']]['input'], card['japanese'])
        for key, entry in entries.items():
            self.assertEqual(entry['speed'], 1.0)
            self.assertFalse(entry['listening_verified'])
            self.assertFalse(re.search(r'[\u3400-\u9fff々\u30a1-\u30faA-Za-z]', entry['input']))
            if key in vocabulary:
                if entry['accent'] is not None:
                    self.assertEqual(entry['accent_status'], 'dictionary-reading-match')
                    self.assertTrue(entry['accent_source'])
                else:
                    self.assertEqual(entry['accent_status'], 'checked-no-reliable-culinary-entry')
            path = ROOT / audio[key]
            self.assertTrue(path.name.startswith('marin-'))
            self.assertGreater(path.stat().st_size, 100)
        rib = next(card for card in cards if card['sourceCard'] == 'page79-q09')
        self.assertIn('左右(さゆう)一対(いっつい)', rib['example']['japanese'])
        self.assertTrue(any('だんめんずでわさゆういっつい' in entry['input'] for entry in entries.values()))


if __name__ == '__main__':
    unittest.main()
