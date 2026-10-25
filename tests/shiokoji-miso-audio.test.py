"""Verify exact text coverage, reviewed Marin targets, checksums and local signal audit."""
import hashlib,json,re
from pathlib import Path
ROOT=Path(__file__).resolve().parent.parent
for name,passages,keys in [('shiokoji',24,24),('miso',82,80)]:
 lesson='fermentation-notes-'+name
 data=json.loads((ROOT/f'data/fermentation-notes/{name}.json').read_text())
 review=json.loads((ROOT/f'scripts/lesson-audio-reviews/{lesson}.json').read_text())
 manifest=json.loads((ROOT/f'audio/lessons/{lesson}/manifest.json').read_text())
 audit=json.loads((ROOT/f'docs/{name}-audio-audit.json').read_text())['entries']
 by_id={e['message_id']:e for e in review['entries']}
 assert len(by_id)==passages and len(manifest)==len(audit)==keys
 assert set(manifest)=={e['key']for e in review['entries']}
 for entry in data['entries']:
  for message in entry['messages']:
   e=by_id[message['id']];x=audit[e['key']];path=ROOT/manifest[e['key']]
   assert not message.get('audioPending') and e['display']==message['japanese']
   assert (e['voice'],e['model'],e['speed'])==('marin','gpt-4o-mini-tts',1.0)
   assert e['hiragana_reviewed'] and e['phrase_reviewed'] and e['reading_source'] and e['context_review']
   assert e['accent_status']=='provisional' and e['accent_source'] and e['pronunciation_guidance']
   assert not re.search(r'[\u3400-\u9fff々\u30a1-\u30faA-Za-z0-9]',e['input'])
   assert e['audio']==x['audio']==manifest[e['key']]
   assert e['audio_sha256']==x['sha256']==hashlib.sha256(path.read_bytes()).hexdigest()
   assert x['rms']>20 and x['clipped_sample_fraction']==0 and x.get('transcript')
   assert e.get('transcription_reviewed') and e.get('transcription_review_note')
   assert e['listening_verified'] is False and e['audible_pitch_verified'] is False
 print(f'PASS: {name}, {passages} passages / {keys} speech keys, reviewed Marin 1.0, local signal audits and matching MP3 hashes.')
shiokoji=json.loads((ROOT/'data/fermentation-notes/shiokoji.json').read_text())
assert shiokoji['entries'][0]['japanese']+'\n'+''.join(m['japanese']for m in shiokoji['entries'][0]['messages'])==(ROOT/shiokoji['sourceFile']).read_text()
print('Source Japanese unchanged; no listening or audible-pitch verification claimed.')
