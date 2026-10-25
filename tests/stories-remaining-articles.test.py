"""Content-only checks: source coverage, translation structure, readings and recorded audio."""
import hashlib,json,re,unittest
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
EXPECTED=[('yakiniku',29,7),('versatile-seasonings',34,7),('soy-sauce',37,12),('cooking-sake',32,7),('miso-types',41,11)]

class RemainingArticles(unittest.TestCase):
    def test_content_and_catalog(self):
        catalog=json.loads((ROOT/'data/catalog.json').read_text())
        stories=[x for x in catalog if x.get('category')=='stories']
        self.assertEqual(len(stories),10)
        self.assertEqual(stories[0]['title'],'会話')
        ids=set()
        for order,(slug,count,headings) in enumerate(EXPECTED,6):
            d=json.loads((ROOT/f'data/articles/{slug}.json').read_text());e=d['entries'][0]
            source=(ROOT/d['sourceFile']).read_text()
            self.assertEqual(e['japanese']+'\n\n'+''.join(m['japanese']for m in e['messages']),source)
            self.assertEqual(len(e['messages']),count)
            self.assertEqual(sum(b['type']=='heading'for m in e['messages']for b in m['blocks']),headings)
            self.assertEqual(len(e['englishHeadingLines']),headings)
            for m in e['messages']:
                self.assertNotIn(m['id'],ids);ids.add(m['id'])
                self.assertFalse(m.get('audioPending'))
                self.assertTrue(m['english'])
                self.assertEqual('\n'.join(b['text']for b in m['blocks'])+'\n',m['japanese'])
                self.assertEqual(len(m['blocks']),len(m['english'].splitlines()))
                self.assertLess(len(m['japanese']),240,'Recording-sized passage')
            pattern=re.compile('|'.join(map(re.escape,sorted(e['furigana'],key=len,reverse=True))))
            self.assertFalse(re.search('[一-龯]',pattern.sub('',source.replace('\n',''))),'Furigana coverage')
            lesson=next(x for x in stories if x['id']=='stories-'+slug+'-reading')
            self.assertEqual(lesson['sortOrder'],order);self.assertTrue(lesson['articleCards'])
            self.assertIn(lesson['file'],(ROOT/'sw.js').read_text())
            self.assertIn(d['sourceFile'],(ROOT/'sw.js').read_text())

if __name__=='__main__':unittest.main()
