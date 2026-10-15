"""Run: python3 tests/kanahachi-dictionary.test.py"""
import importlib.util
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
spec = importlib.util.spec_from_file_location('dictionary_builder', ROOT / 'scripts/build-kanahachi-dictionary.py')
builder = importlib.util.module_from_spec(spec)
spec.loader.exec_module(builder)
data = json.loads((ROOT / 'data/dictionaries/kanahachi-jmdict.json').read_text())
assert data['sourceSha256'] == builder.SOURCE_SHA256
assert data['license'] == 'CC-BY-SA-4.0'
assert len({row[0] for row in data['rows']}) == data['readings']
assert all(row[0] == builder.normalize(row[0]) and len(row[0]) >= 2 and len(set(row[0])) <= 7 for row in data['rows'])

# Independently verify every compiled board against the exported common readings.
common = {row[0] for row in data['rows'] if row[3]}
alphabet = sorted(set(''.join(common)))
bits = {c: 1 << i for i, c in enumerate(alphabet)}
mask = lambda value: sum(bits[c] for c in set(value))
common_masks = [mask(reading) for reading in common]
for kana, center, count in data['boards']:
    board_mask, required = mask(kana), bits[center]
    assert len(kana) == len(set(kana)) == 7 and center in kana
    assert sum(m & board_mask == m and bool(m & required) for m in common_masks) == count >= 10

# Synthetic entry proves that reading and sense restrictions survive the compact export.
fixture = {'words': [{'id': 'fixture', 'kanji': [
    {'text':'甲','tags':[]}, {'text':'乙','tags':[]}, {'text':'丙','tags':['sK']}],
    'kana':[{'text':'こう','common':True,'tags':[],'appliesToKanji':['甲']},
            {'text':'おつ','common':False,'tags':[],'appliesToKanji':['乙']},
            {'text':'こお','common':False,'tags':['sk'],'appliesToKanji':['甲']}],
    'sense':[{'partOfSpeech':['n'],'misc':[],'appliesToKana':['こう'],'appliesToKanji':['甲'],'gloss':[{'lang':'eng','text':'first'}]},
             {'partOfSpeech':['n'],'misc':[],'appliesToKana':['おつ'],'appliesToKanji':['乙'],'gloss':[{'lang':'eng','text':'second'}]},
             {'partOfSpeech':['n'],'misc':['obs'],'appliesToKana':['*'],'appliesToKanji':['*'],'gloss':[{'lang':'eng','text':'obsolete'}]}]}]}
rows, _ = builder.export_words(fixture)
assert rows == [('おつ','乙','second',0,'fixture'),('こう','甲','first',1,'fixture')]
print(f'PASS: {data["readings"]:,} readings, every one of {len(data["boards"]):,} boards has ten common answers; reading/sense restrictions, exclusions, normalization and licence preserved.')
