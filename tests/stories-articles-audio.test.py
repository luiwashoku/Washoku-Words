"""Exact Stories source coverage, reviewed audio targets and transcription evidence."""
import hashlib,json,re
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
catalog=json.loads((ROOT/'data/catalog.json').read_text())
combined=json.loads((ROOT/'audio/lessons/manifest.json').read_text())
lessons=[x for x in catalog if x.get('category')=='stories' and x.get('articleCards')]
assert len(lessons)==11
lessons=[x for x in lessons if x["id"] in combined]
assert len(lessons)==11
total=0
for lesson in lessons:
 lid=lesson['id'];data=json.loads((ROOT/lesson['file']).read_text());entry=data['entries'][0]
 assert entry['japanese']+'\n\n'+''.join(m['japanese']for m in entry['messages'])==(ROOT/data['sourceFile']).read_text()
 review=json.loads((ROOT/f'scripts/lesson-audio-reviews/{lid}.json').read_text())
 manifest=json.loads((ROOT/f'audio/lessons/{lid}/manifest.json').read_text())
 audit=json.loads((ROOT/f'docs/lesson-audio-audits/{lid}.json').read_text())['entries']
 assert manifest==combined[lid]
 assert set(manifest)==set(audit)=={e['key']for e in review['entries']}
 byid={e['message_id']:e for e in review['entries']}
 for m in entry['messages']:
  e=byid[m['id']];a=audit[e['key']];path=ROOT/manifest[e['key']]
  assert not m.get('audioPending') and m['japanese']==e['display']
  assert (e['voice'],e['model'],e['speed'])==('marin','gpt-4o-mini-tts',1.0)
  assert e['hiragana_reviewed'] and e['phrase_reviewed'] and e['reading_source'] and e['context_review']
  assert e['accent_status']=='provisional' and e['accent_source'] and e['pronunciation_guidance']
  assert not re.search(r'[\u3400-\u9fff々\u30a1-\u30faA-Za-z0-9]',e['input'])
  assert e['audio']==a['audio']==manifest[e['key']]
  assert e['audio_sha256']==a['sha256']==hashlib.sha256(path.read_bytes()).hexdigest()
  assert a['rms']>20 and a['clipped_sample_fraction']==0 and a['transcript']
  assert e['signal_checked'] and e['transcription_reviewed'] and e['transcription_review_note']
  assert e['listening_verified'] is False and e['audible_pitch_verified'] is False
  total+=1
 print('PASS:',lid,len(entry['messages']),'recorded passages')
assert total==335
print('PASS: 335 Marin 1.0 passages; exact source, hashes, PCM and transcript checks.')
