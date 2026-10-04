"""Run: python3 tests/animal-parts-cards.test.py"""
import json
from pathlib import Path
import re
import unittest
from urllib.parse import parse_qs, urlsplit
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parent.parent
SPECS = [('beef-parts-cards', 'page76', 23, 39), ('pork-parts-cards', 'page83', 25, 47)]


def read(path):
    return json.loads((ROOT / path).read_text())


class AnimalPartsCardsTest(unittest.TestCase):
    def test_source_coverage_diagrams_and_order(self):
        catalog = read('data/catalog.json')
        for lesson_id, source_id, count, _ in SPECS:
            with self.subTest(lesson=lesson_id):
                lesson = next(item for item in catalog if item['id'] == lesson_id)
                source = next(item for item in catalog if item['id'] == source_id)
                cards = read(lesson['file'])['entries']
                questions = {q['id']: q for q in read(source['file']) if q.get('image')}
                expected = [re.sub(r'\([^)]*\)', '', name) for q in questions.values()
                            for name in q['answers'][q['correct']].split('・')]
                self.assertEqual([card['kanji'] for card in cards], expected)
                self.assertEqual(len(set(expected)), count)
                self.assertEqual(lesson['questionCount'], count)
                self.assertEqual(catalog[catalog.index(lesson) - 1]['id'], source_id)
                self.assertEqual(lesson['gameMode'], 'vocabulary-cards')
                self.assertTrue(lesson['ordered'])
                self.assertTrue(lesson['compactCards'])
                for card in cards:
                    question = questions[card['sourceCard']]
                    self.assertEqual(card['example']['japanese'], question['jpExplanation'])
                    self.assertEqual(card['example']['english'], question['enExplanation'])
                    image = urlsplit(card['image'])
                    self.assertEqual(image.path + '#' + image.fragment, question['image'])
                    self.assertEqual(parse_qs(image.query)['highlight'], [image.fragment])
                    svg = ET.parse(ROOT / image.path).getroot()
                    self.assertTrue(any(node.get('id') == image.fragment for node in svg.iter()))

    def test_marin_reviews_speed_and_saved_audio(self):
        combined = read('audio/lessons/manifest.json')
        batches = read('scripts/lesson-audio-batches.json')
        for lesson_id, source_id, _, key_count in SPECS:
            with self.subTest(lesson=lesson_id):
                cards = read('data/' + lesson_id + '.json')['entries']
                review = read('scripts/lesson-audio-reviews/' + lesson_id + '.json')
                self.assertTrue(review['reviewed'])
                self.assertEqual((review['voice'], review['model']), ('marin', 'gpt-4o-mini-tts'))
                reviewed = {entry['key']: entry for entry in review['entries']}
                audio = read('audio/lessons/' + lesson_id + '/manifest.json')
                self.assertEqual(audio, combined[lesson_id])
                self.assertEqual(set(reviewed), set(audio))
                self.assertEqual(len(audio), key_count)
                vocabulary = {card['japanese'] for card in cards}
                for card in cards:
                    entry = reviewed[card['japanese']]
                    self.assertEqual(entry['input'], card['japanese'])
                    if entry['accent'] is not None:
                        self.assertEqual(entry['accent_status'], 'dictionary-reading-match')
                        self.assertTrue(entry['accent_source'])
                    else:
                        self.assertIn(entry['accent_status'], ['checked-no-reliable-culinary-entry', 'ambiguous-or-metaphorical-name-not-independently-verified'])
                for key, entry in reviewed.items():
                    self.assertFalse(re.search(r'[\u3400-\u9fff々\u30a1-\u30faA-Za-z]', entry['input']))
                    self.assertFalse(entry['listening_verified'])
                    self.assertEqual(entry['speed'], 1.0)
                    path = ROOT / audio[key]
                    self.assertTrue(path.name.startswith('marin-'))
                    self.assertGreater(path.stat().st_size, 100)
                batch = next(b for b in batches if b['lesson'] == lesson_id)
                self.assertEqual(batch['status'], 'generated')
                self.assertEqual(batch['speechKeys'], key_count)
                self.assertEqual(batch['recordings'], key_count)
        pork = read('data/pork-parts-cards.json')['entries']
        self.assertEqual(next(card['japanese'] for card in pork if card['kanji'] == '豚トロ'), 'とんとろ')


if __name__ == '__main__':
    unittest.main()
