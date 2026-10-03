"""Validate comparison coverage and speech targets without calling the API."""
import importlib.util
import hashlib
import json
import re
from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parent.parent
spec = importlib.util.spec_from_file_location('generator', ROOT / 'scripts/generate-marin-pitch-trials.py')
generator = importlib.util.module_from_spec(spec)
spec.loader.exec_module(generator)

class PitchComparisons(unittest.TestCase):
    def test_generated_batch_payloads(self):
        spec = importlib.util.spec_from_file_location('batch_generator', ROOT / 'scripts/generate-word-explosion-batch.py')
        batch_generator = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(batch_generator)
        audio = json.loads((ROOT / 'audio/word-explosion-batches/2026-10-03/manifest.json').read_text())
        jobs = batch_generator.prepare('2026-10-03')
        self.assertEqual(len(jobs), 268)
        for kind, key, folder, payload in jobs:
            self.assertEqual(payload['voice'], 'marin')
            self.assertEqual(payload['speed'], 1.0)
            digest = hashlib.sha256(json.dumps(payload, ensure_ascii=False, sort_keys=True).encode()).hexdigest()[:20]
            self.assertEqual(audio[kind][key], f'{folder}/marin-{digest}.mp3')
            self.assertGreater((ROOT / audio[kind][key]).stat().st_size, 100)

    def test_requested_expansion_and_examples(self):
        batch = json.loads((ROOT / 'scripts/word-explosion-batches/2026-10-03.json').read_text())
        audio = json.loads((ROOT / 'audio/word-explosion-batches/2026-10-03/manifest.json').read_text())
        review = json.loads((ROOT / 'scripts/word-explosion-marin-review.json').read_text())['entries']
        examples = json.loads((ROOT / 'data/word-explosion-examples.json').read_text())
        game_audio = json.loads((ROOT / 'game-audio-manifest.js').read_text().split(' = ', 1)[1].rstrip(';\n'))
        self.assertEqual(len(batch['requested_readings']), 144)
        self.assertEqual(len(batch['new_vocabulary_keys']), 124)
        self.assertTrue(set(batch['requested_readings']).issubset(review))
        self.assertEqual(set(audio['vocabulary']), set(batch['new_vocabulary_keys']))
        self.assertEqual(set(audio['sentences']), {e['key'] for e in batch['sentences']})
        self.assertEqual({e['vocabulary_key'] for e in batch['sentences']}, set(batch['requested_readings']))
        for sentence in batch['sentences']:
            self.assertTrue(re.fullmatch(r'[ぁ-ゖー、。！？!?\s]+', sentence['input']))
            self.assertLessEqual(len(sentence['input']), 40)
            self.assertEqual(sentence['speed'], 1.0)
            self.assertEqual(examples[sentence['vocabulary_key']], {
                'japanese': sentence['display'], 'english': sentence['english']})
            self.assertEqual(game_audio[sentence['key']], audio['sentences'][sentence['key']])
            self.assertTrue((ROOT / game_audio[sentence['key']]).is_file())
        # Particle correction must retain lexical は, including 発酵 and 入って.
        inputs = {s['vocabulary_key']: s['input'] for s in batch['sentences']}
        self.assertIn('はっこうにわ', inputs['おんどかんり'])
        self.assertIn('めにはいって', inputs['うっとうしい'])
        self.assertIn('はがするどい', inputs['するどい'])
        self.assertIn('そのはなし', inputs['おもしろい'])

    def test_morae_and_pitch_targets(self):
        self.assertEqual(generator.morae('きょう'), ['きょ', 'う'])
        self.assertEqual(generator.morae('しょっかん'), ['しょ', 'っ', 'か', 'ん'])
        base = {'text': 'あきらか', 'vocabulary': [{'english': 'clear'}]}
        for accent, pattern in [(0, 'low-high-high-high'), (1, 'high-low-low-low'), (2, 'low-high-low-low')]:
            self.assertIn(pattern, generator.instruction(dict(base, accent=accent)))

    def test_selected_game_audio(self):
        selection = json.loads((ROOT / 'scripts/marin-audio-selection.json').read_text())
        originals = json.loads((ROOT / selection['original_manifest']).read_text())
        trials = json.loads((ROOT / selection['new_manifest']).read_text())
        active = json.loads((ROOT / 'audio/word-explosion-marin/manifest.json').read_text())
        browser_manifest = (ROOT / 'word-explosion-audio-manifest.js').read_text()
        self.assertEqual(json.loads(browser_manifest.split(' = ', 1)[1].rstrip(';\n')), active)
        kept = set(selection['keep_original_keys'])
        review = json.loads((ROOT / 'scripts/word-explosion-marin-review.json').read_text())['entries']
        for label in selection['keep_original_labels']:
            keys = [k for k, e in review.items() if k == label or any(v['kanji'] == label for v in e['vocabulary'])]
            self.assertTrue(keys, label)
            self.assertTrue(set(keys).issubset(kept), label)
        self.assertEqual(set(active), set(originals))
        for key, file in active.items():
            self.assertEqual(file, originals[key] if key in kept else trials[key])
            self.assertTrue((ROOT / file).is_file())

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
