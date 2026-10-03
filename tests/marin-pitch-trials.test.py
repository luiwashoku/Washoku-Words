"""Validate comparison coverage and speech targets without calling the API."""
import importlib.util
import json
from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parent.parent
spec = importlib.util.spec_from_file_location('generator', ROOT / 'scripts/generate-marin-pitch-trials.py')
generator = importlib.util.module_from_spec(spec)
spec.loader.exec_module(generator)

class PitchComparisons(unittest.TestCase):
    def test_morae_and_pitch_targets(self):
        self.assertEqual(generator.morae('きょう'), ['きょ', 'う'])
        self.assertEqual(generator.morae('しょっかん'), ['しょ', 'っ', 'か', 'ん'])
        base = {'text': 'あきらか', 'vocabulary': [{'english': 'clear'}]}
        for accent, pattern in [(0, 'low-high-high-high'), (1, 'high-low-low-low'), (2, 'low-high-low-low')]:
            self.assertIn(pattern, generator.instruction(dict(base, accent=accent)))

    def test_complete_separate_comparisons(self):
        review = json.loads((ROOT / 'scripts/marin-pitch-review.json').read_text())['entries']
        original = json.loads((ROOT / 'scripts/word-explosion-marin-review.json').read_text())['entries']
        manifest = json.loads((ROOT / 'data/marin-audio-trials.json').read_text())
        self.assertEqual(set(review), set(original))
        self.assertEqual(set(manifest), set(original))
        for key, entry in review.items():
            self.assertEqual(entry['text'], original[key]['text'])
            self.assertEqual(entry['vocabulary'], original[key]['vocabulary'])
            self.assertFalse(entry['listening_verified'])
            self.assertTrue(entry['source'])
            if entry.get('guidance'):
                self.assertEqual(entry['status'], 'provisional-components')
                self.assertTrue(entry['components'])
                self.assertNotIn('accent', entry)
            else:
                self.assertGreaterEqual(entry['accent'], 0)
                self.assertLessEqual(entry['accent'], len(generator.morae(entry['text'])))
            self.assertTrue(manifest[key].startswith('audio/marin-pitch-trials/'))
            self.assertGreater((ROOT / manifest[key]).stat().st_size, 100)

if __name__ == '__main__':
    unittest.main()
