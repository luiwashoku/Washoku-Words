"""Tempura article source, translation and recorded audio integration checks."""
import json,re
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
d=json.loads((ROOT/'data/articles/tempura-science.json').read_text());e=d['entries'][0];source=(ROOT/d['sourceFile']).read_text()
assert e['japanese']=='天ぷらの科学（てんぷらのかがく）'
assert e['japanese']+'\n\n'+''.join(m['japanese']for m in e['messages'])==source
assert len(e['messages'])==37 and len(e['englishHeadingLines'])==9
assert sum(b['type']=='heading'for m in e['messages']for b in m['blocks'])==9
for m in e['messages']:
 assert not m.get('audioPending') and m['english']
 assert len(m['blocks'])==len(m['english'].splitlines())
 assert len(m['japanese'])<=150
 assert m['japanese'].rstrip()=='\n\n'.join(b['text']for b in m['blocks'])
pattern=re.compile('|'.join(map(re.escape,sorted(e['furigana'],key=len,reverse=True))))
assert not re.search('[一-龯]',pattern.sub('',source))
assert e['furigana']['衣']=='ころも' and e['furigana']['糊化']=='こか' and e['furigana']['生地']=='きじ'
assert '160〜180℃'in source and 'パンはよくこねる。天ぷらは混ぜすぎない。'in source
c=json.loads((ROOT/'data/catalog.json').read_text());stories=[x for x in c if x.get('category')=='stories']
assert len(stories)==12 and stories[-1]['id']=='stories-tempura-science-reading'
assert stories[-1]['sortOrder']==12 and stories[-2]['id']=='stories-edomae-sushi-reading'
assert stories[-1]['articleCards'] and stories[-1]['recordedAudioOnly'] and stories[-1]['titleAudioDisabled']
assert d['sourceFile']in(ROOT/'sw.js').read_text() and stories[-1]['file']in(ROOT/'sw.js').read_text()
print('PASS: exact Tempura source, 37 translated recording-sized passages, 9 headings, contextual furigana, menu/offline integration and audio enabled.')
