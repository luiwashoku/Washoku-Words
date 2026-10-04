"""Run: python3 tests/chicken-cards.test.py"""
import json
from pathlib import Path
import re
import unittest
from urllib.parse import urlsplit, parse_qs
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parent.parent


def read(path):
    return json.loads((ROOT / path).read_text())


class ChickenCardsTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.catalog = read('data/catalog.json')
        cls.lesson = next(item for item in cls.catalog if item['id'] == 'chicken-parts-cards')
        cls.cards = read(cls.lesson['file'])['entries']
        cls.questions = {q['id']: q for q in read('data/pages73.json') if q.get('image')}
        cls.review = read('scripts/lesson-audio-reviews/chicken-parts-cards.json')
        cls.audio = read('audio/lessons/manifest.json')['chicken-parts-cards']

    def test_individual_parts_and_source_descriptions(self):
        expected = [re.sub(r'\([^)]*\)', '', name)
                    for q in self.questions.values()
                    for name in q['answers'][q['correct']].split('・')]
        self.assertEqual([card['kanji'] for card in self.cards], expected)
        self.assertEqual(len(set(expected)), 22)
        self.assertEqual(self.lesson['questionCount'], len(expected))
        self.assertTrue(self.lesson['compactCards'])
        index = self.catalog.index(self.lesson)
        self.assertEqual(self.catalog[index - 1]['id'], 'page73')
        for card in self.cards:
            source = self.questions[card['sourceCard']]
            if card['kanji'] == 'ハラミ':
                self.assertIn('腹壁(ふくへき)', card['example']['japanese'])
                self.assertNotIn('横隔膜', card['example']['japanese'])
            else:
                self.assertEqual(card['example']['japanese'], source['jpExplanation'])
                self.assertEqual(card['example']['english'], source['enExplanation'])
            image = urlsplit(card['image'])
            self.assertEqual(image.path + '#' + image.fragment, source['image'])
            self.assertEqual(parse_qs(image.query)['highlight'], [image.fragment])
            svg = ET.parse(ROOT / image.path).getroot()
            self.assertTrue(any(node.get('id') == image.fragment for node in svg.iter()))

    def test_reviewed_marin_coverage_and_pitch_provenance(self):
        self.assertTrue(self.review['reviewed'])
        self.assertEqual(self.review['voice'], 'marin')
        self.assertEqual(self.review['model'], 'gpt-4o-mini-tts')
        reviewed = {entry['key']: entry for entry in self.review['entries']}
        self.assertEqual(set(reviewed), set(self.audio))
        self.assertEqual(len(reviewed), 39)
        for card in self.cards:
            entry = reviewed[card['japanese']]
            self.assertEqual(entry['input'], card['japanese'])
            self.assertEqual(entry['speed'], 0.85)
            if entry['accent'] is not None:
                self.assertEqual(entry['accent_status'], 'dictionary-reading-and-sense-match')
                self.assertTrue(entry['accent_source'])
            else:
                self.assertIn(entry['accent_status'], ['checked-no-reliable-culinary-entry', 'metaphorical-name-not-independently-verified'])
        for key, entry in reviewed.items():
            self.assertFalse(re.search(r'[\u3400-\u9fff々\u30a1-\u30faA-Za-z]', entry['input']))
            self.assertFalse(entry['listening_verified'])
            if key not in {card['japanese'] for card in self.cards}:
                self.assertEqual(entry['speed'], 1.0)
            path = ROOT / self.audio[key]
            self.assertTrue(path.name.startswith('marin-'))
            self.assertGreater(path.stat().st_size, 100)
        self.assertEqual(self.audio, read('audio/lessons/chicken-parts-cards/manifest.json'))


if __name__ == '__main__':
    unittest.main()
