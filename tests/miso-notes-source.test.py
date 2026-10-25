"""Check PDF transcription, column order and offline assets without generating audio."""
import json
import re
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATA = json.loads((ROOT / 'data/fermentation-notes/miso.json').read_text())
PAGES = (ROOT / DATA['sourceFile']).read_text().split('\f\n')
normalize = lambda text: re.sub(r'\s+', '', re.sub(r'[a-pI],', '', text))


class MisoPdfNotes(unittest.TestCase):
    def test_source_wording_and_audio_ready(self):
        self.assertEqual(len(PAGES), 10)
        self.assertEqual(len(DATA['entries']), 22)
        self.assertEqual(sum(len(e['messages']) for e in DATA['entries']), 82)
        ids = set()
        for entry in DATA['entries']:
            self.assertTrue(entry['furigana'])
            for message in entry['messages']:
                self.assertNotIn(message['id'], ids)
                ids.add(message['id'])
                self.assertFalse(message.get('audioPending'))
                self.assertTrue(message['english'])
                self.assertNotRegex(message['japanese'], r'[a-pI],')
                self.assertNotRegex(message['english'], r'\([a-pI]\)')
                self.assertFalse(any(im.get('caption') for im in message.get('images', [])))
                source = normalize((ROOT / message['sourceFile']).read_text()) if message.get('sourceFile') else normalize(''.join(PAGES[p-1] for p in message['sourcePages']))
                parts = []
                for block in message['blocks']:
                    if 'text' in block:
                        values = [block['text']]
                        parts.append(block['text'])
                    elif 'items' in block:
                        values = block['items']
                        parts.append('\n'.join(values))
                    else:
                        values = block.get('headers', []) + [v for row in block['rows'] for v in row]
                        parts.append('\n'.join([' '.join(block.get('headers', []))] + [' '.join(row) for row in block['rows']]))
                    for value in values:
                        # A neighboring column interrupts one wrapped instruction in raw PDF order.
                        if normalize(value) not in source:
                            for line in value.splitlines():
                                self.assertIn(normalize(line), source, message['id'])
                self.assertEqual('\n'.join(parts), message['japanese'])

    def test_recipes_and_images(self):
        cards = {entry['id']: entry for entry in DATA['entries']}
        cheese = cards['miso-cheese']['messages'][0]['japanese']
        self.assertIn('大葉刻み 30g', cheese)
        self.assertIn('味醂 60cc', cheese)
        self.assertNotIn('すり生姜', cheese)
        self.assertIn('すり生姜 20g', cards['miso-ginger']['messages'][0]['japanese'])
        images = [im for e in DATA['entries'] for m in e['messages'] for im in m.get('images', [])]
        self.assertEqual(len(images), 16)
        basics = cards['miso-basics']['messages']
        for chunk_id in ['miso-basics-chunk-05', 'miso-basics-chunk-07']:
            message = next(m for m in basics if m['id'] == chunk_id)
            self.assertFalse(message.get('images'))
            self.assertTrue(message['japanese'])
        cache = (ROOT / 'sw.js').read_text()
        for image in images:
            self.assertTrue((ROOT / image['src']).is_file())
            self.assertIn(image['src'], cache)
            self.assertGreater(image['width'], 0)
        self.assertNotIn('nopush/', cache)


if __name__ == '__main__':
    unittest.main()
