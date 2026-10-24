"""Verify preserved reading source, reviewed Marin targets and audited files."""
import hashlib,json
from pathlib import Path
ROOT=Path(__file__).resolve().parent.parent
lesson='fermentation-notes-amazake-questions'
d=json.loads((ROOT/'data/fermentation-notes/amazake-questions.json').read_text());article=d['entries'][0]
assert article['japanese']+'\n'+''.join(m['japanese'] for m in article['messages'])==(ROOT/d['sourceFile']).read_text()
r=json.loads((ROOT/f'scripts/lesson-audio-reviews/{lesson}.json').read_text());entries={e['message_id']:e for e in r['entries']}
m=json.loads((ROOT/f'audio/lessons/{lesson}/manifest.json').read_text());a=json.loads((ROOT/'docs/amazake-questions-audio-audit.json').read_text())['entries']
assert len(entries)==len(m)==len(a)==len(article['messages'])==19
assert [sum(e['batch']==n for e in entries.values()) for n in (1,2)]==[10,9]
for message in article['messages']:
 e=entries[message['id']];clip=ROOT/m[e['key']];x=a[e['key']]
 assert not message.get('audioPending') and e['display']==message['japanese']
 assert (e['voice'],e['model'],e['speed'])==('marin','gpt-4o-mini-tts',1.0)
 assert e['hiragana_reviewed'] and e['phrase_reviewed'] and e['reading_source'] and e['context_review']
 assert e['accent_status']=='provisional' and e['accent_source']
 assert e['audio']==x['audio']==m[e['key']] and x['sha256']==hashlib.sha256(clip.read_bytes()).hexdigest()
 assert x['rms']>20 and x['clipped_sample_fraction']==0 and x.get('transcript')
 assert e['listening_verified'] is False and e['audible_pitch_verified'] is False
assert len(article['questionHeadingLines'])==9
print('PASS: verbatim source, 19 reviewed Marin 1.0 passages in two batches, matching audio audits and nine question headings; no listening verification claimed.')
