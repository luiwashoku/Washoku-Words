"""Decode and optionally transcribe one Stories card.
Automated evidence only: not listening or pitch verification.
Run: python3 scripts/audit-story-audio.py --card story-shiokoji-01 --transcribe
"""
import argparse, array, audioop, concurrent.futures, hashlib, json, os
from pathlib import Path
import subprocess, tempfile, urllib.error, urllib.request, uuid, wave
ROOT = Path(__file__).resolve().parent.parent
parser = argparse.ArgumentParser()
parser.add_argument('--card', required=True)
parser.add_argument('--transcribe', action='store_true')
parser.add_argument('--key', action='append')
parser.add_argument('--word-context', action='store_true', help='Provide only generic Japanese isolated-verb context, never expected words')
args = parser.parse_args()
review = json.loads((ROOT/'scripts/lesson-audio-reviews/stories-cards.json').read_text())
manifest = json.loads((ROOT/'audio/lessons/stories-cards/manifest.json').read_text())
report_path = ROOT/'docs/stories-audio-audit.json'
report = json.loads(report_path.read_text()) if report_path.exists() else {'method':'PCM decoding and optional ASR, without expected-text prompting. Not a listening review or pitch verification.', 'entries':{}}
key = (os.environ.get('OPENAI_API_KEY') or (Path.home()/'.config/washoku-words/openai-api-key').read_text().strip()) if args.transcribe else None
entries = [e for e in review['entries'] if e.get('card') == args.card and (not args.key or e['key'] in args.key)]
def audit(entry):
    path = ROOT/manifest[entry['key']]
    digest = hashlib.sha256(path.read_bytes()).hexdigest()
    old = report['entries'].get(entry['key'],{})
    with tempfile.TemporaryDirectory(prefix='washoku-story-') as temporary:
        target = Path(temporary)/'decoded.wav'
        subprocess.run(['/usr/bin/afconvert',str(path),str(target),'-f','WAVE','-d','LEI16'],check=True,capture_output=True)
        with wave.open(str(target),'rb') as audio:
            data=audio.readframes(audio.getnframes()); rate=audio.getframerate(); channels=audio.getnchannels()
        samples=array.array('h',data); peak=max(abs(v) for v in samples); rms=audioop.rms(data,2)
        assert peak>100 and rms>20, 'Silent/near-silent clip: '+entry['key']
        step=int(rate*channels*.02)*2
        levels=[audioop.rms(data[i:i+step],2) for i in range(0,len(data),step)]
        threshold=max(30,max(levels)*.015)
        voiced=[i for i,v in enumerate(levels) if v>threshold]
        longest=current=0
        for value in levels[voiced[0]:voiced[-1]+1]:
            current=current+1 if value<threshold else 0; longest=max(longest,current)
        result={'card':args.card,'display':entry['display'],'input':entry['input'],'audio':str(path.relative_to(ROOT)),'sha256':digest,'duration_seconds':round(len(samples)/channels/rate,3),'rms':rms,'peak':peak,'clipped_sample_fraction':round(sum(abs(v)>=32760 for v in samples)/len(samples),6),'longest_low_energy_gap_seconds':round(longest*.02,3),'listening_verified':False,'audible_pitch_verified':False}
    if args.transcribe:
        if old.get('sha256')==digest and old.get('transcript') and bool(old.get('generic_word_context'))==args.word_context:
            result['transcript']=old['transcript']; result['transcription_model']=old['transcription_model']
        else:
            boundary='washoku-'+uuid.uuid4().hex
            chunks=[]
            for name,value in [('model','gpt-4o-transcribe'),('language','ja'),('response_format','json')]:
                chunks.append(f'--{boundary}\r\nContent-Disposition: form-data; name="{name}"\r\n\r\n{value}\r\n'.encode())
            if args.word_context:
                chunks.append(f'--{boundary}\r\nContent-Disposition: form-data; name="prompt"\r\n\r\n日本語の単独の動詞を一語だけ発音した録音です。聞こえたとおりに日本語で記録してください。\r\n'.encode())
            chunks.append(f'--{boundary}\r\nContent-Disposition: form-data; name="file"; filename="clip.mp3"\r\nContent-Type: audio/mpeg\r\n\r\n'.encode()+path.read_bytes()+b'\r\n')
            chunks.append(f'--{boundary}--\r\n'.encode())
            request=urllib.request.Request('https://api.openai.com/v1/audio/transcriptions',data=b''.join(chunks),headers={'Authorization':'Bearer '+key,'Content-Type':'multipart/form-data; boundary='+boundary})
            try:
                with urllib.request.urlopen(request,timeout=120) as response: output=json.load(response)
            except urllib.error.HTTPError as error:
                raise RuntimeError('Transcription HTTP '+str(error.code)) from None
            result['transcript']=output['text'];result['transcription_model']='gpt-4o-transcribe'
        result['generic_word_context']=args.word_context
    return entry['key'],result
assert entries, 'No reviewed entries for this story'
with concurrent.futures.ThreadPoolExecutor(max_workers=6) as pool:
    for lookup,result in pool.map(audit,entries):report['entries'][lookup]=result
report_path.write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
print('Story',args.card,':',len(entries),'decoded non-silent recordings; transcription:',args.transcribe)
for e in entries:
    row=report['entries'][e['key']]
    print(row['display'],'=>',row.get('transcript','(not transcribed)'),'; gap',row['longest_low_energy_gap_seconds'])
