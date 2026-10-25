"""Generate reviewed reading articles sequentially, auditing each small batch.
Requires the user's authorization for TTS and, with --transcribe, transcription.
"""
import argparse,json,subprocess,sys
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
p=argparse.ArgumentParser();p.add_argument('--lesson',required=True);p.add_argument('--start',type=int,default=1);p.add_argument('--end',type=int);p.add_argument('--transcribe',action='store_true');p.add_argument('--audit-only',action='store_true');args=p.parse_args()
r=json.loads((ROOT/'scripts/lesson-audio-reviews'/(args.lesson+'.json')).read_text())
for batch in sorted({e['batch']for e in r['entries']}):
 if batch<args.start or (args.end and batch>args.end):continue
 selected=[e for e in r['entries']if e['batch']==batch]
 print(args.lesson,'batch',batch,len(selected),'passages',flush=True)
 if not args.audit_only:
  cmd=[sys.executable,str(ROOT/'scripts/generate-lesson-audio.py'),'--lesson',args.lesson]
  for e in selected:cmd+=['--key',e['key']]
  subprocess.run(cmd,check=True,cwd=ROOT)
 cmd=[sys.executable,str(ROOT/'scripts/audit-reading-article-audio.py'),'--lesson',args.lesson]+(['--transcribe']if args.transcribe else [])
 for e in selected:cmd+=['--key',e['key']]
 subprocess.run(cmd,check=True,cwd=ROOT,stdout=subprocess.DEVNULL)
 report=json.loads((ROOT/'docs/lesson-audio-audits'/(args.lesson+'.json')).read_text())['entries']
 assert all(report[e['key']]['clipped_sample_fraction']==0 for e in selected),'Clipping flagged'
 print('Batch',batch,'decoded, non-silent, no clipping; transcription:',args.transcribe,flush=True)
