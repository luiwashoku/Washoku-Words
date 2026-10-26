"""Edomae article preserves the supplied wording and is prepared with recorded sound."""
import json,re
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
d=json.loads((ROOT/'data/articles/edomae-sushi.json').read_text());e=d['entries'][0]
source=(ROOT/d['sourceFile']).read_text()
assert e['japanese']+'\n\n'+''.join(m['japanese']for m in e['messages'])==source
assert e['japanese']=='江戸前寿司（えどまえずし）とは？'
assert len(e['messages'])==40
assert len(e['englishHeadingLines'])==11
assert sum(b['type']=='heading'for m in e['messages']for b in m['blocks'])==11
for m in e['messages']:
 assert not m.get('audioPending') and m['english']
 assert len(m['blocks'])==len(m['english'].splitlines())
 assert len(m['japanese'])<240
 assert m['japanese'].rstrip()=='\n\n'.join(b['text']for b in m['blocks'])
pattern=re.compile('|'.join(map(re.escape,sorted(e['furigana'],key=len,reverse=True))))
assert not re.search('[一-龯]',pattern.sub('',source))
assert e['furigana']['漬け']=='づけ' and e['furigana']['漬ける']=='つける'
c=json.loads((ROOT/'data/catalog.json').read_text());stories=[x for x in c if x.get('category')=='stories']
assert len(stories)==12
lesson=next(x for x in stories if x['id']=='stories-edomae-sushi-reading')
assert lesson['articleCards'] and lesson['recordedAudioOnly'] and lesson['titleAudioDisabled']
assert d['sourceFile']in(ROOT/'sw.js').read_text() and lesson['file']in(ROOT/'sw.js').read_text()
print('PASS: exact source, 40 translated recording-sized passages, 11 headings, contextual furigana, menu order, offline files and audio enabled.')
