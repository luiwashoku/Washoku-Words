"""Audit MP3s against app references; pass --delete to remove unreferenced files.

Runtime manifests, data, HTML, and current reviewed reuse inputs are protected.
Historical batch manifests are bookkeeping, not evidence that a clip is used.
"""
import argparse
import json
from pathlib import Path
import re
import subprocess

ROOT = Path(__file__).resolve().parent.parent
parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--delete', action='store_true')
parser.add_argument('--report', default='/tmp/washoku-unused-audio-report.json')
args = parser.parse_args()

def paths(value):
    if isinstance(value, str):
        return {value.removeprefix('./')} if value.removeprefix('./').startswith('audio/') and value.endswith('.mp3') else set()
    if isinstance(value, dict):
        return set().union(*(paths(v) for v in value.values())) if value else set()
    if isinstance(value, list):
        return set().union(*(paths(v) for v in value)) if value else set()
    return set()

manifest_path = ROOT/'audio/lessons/manifest.json'
combined = json.loads(manifest_path.read_text())
stale = {}
for lesson, mapping in combined.items():
    rows = json.loads(subprocess.check_output(['osascript', '-l', 'JavaScript', str(ROOT/'scripts/export-lesson-audio.js'), str(ROOT), lesson], text=True))
    current = {r['key'] for r in rows}
    stale[lesson] = sorted(set(mapping) - current)
    combined[lesson] = {k:v for k,v in mapping.items() if k in current}

used = paths(combined)
for file in ROOT.glob('*-audio-manifest.js'):
    if file.name == 'lesson-audio-manifest.js':
        continue
    used |= paths(json.loads(file.read_text().split('=', 1)[1].strip().rstrip(';')))
for file in (ROOT/'data').glob('*.json'):
    used |= paths(json.loads(file.read_text()))
# Protect direct references on auxiliary pages, including the voice comparison.
for pattern in ('*.js', '*.html'):
    for file in ROOT.glob(pattern):
        if file.name == 'lesson-audio-manifest.js':
            continue
        used |= set(re.findall(r'(?<![\w/])(audio/[^\s\"\'<>]+\.mp3)', file.read_text()))
reviews = {}
for file in (ROOT/'scripts/lesson-audio-reviews').glob('*.json'):
    review = json.loads(file.read_text())
    removed = set(stale.get(review.get('lesson'), []))
    review['entries'] = [e for e in review['entries'] if e['key'] not in removed]
    used |= {e['reuse_audio'] for e in review['entries'] if e.get('reuse_audio')}
    reviews[file] = review

missing = sorted(p for p in used if not (ROOT/p).is_file())
if missing:
    raise SystemExit('Refusing cleanup: missing protected files: '+str(missing))
all_files = {str(p.relative_to(ROOT)):p for p in (ROOT/'audio').rglob('*.mp3')}
unused = sorted(set(all_files) - used)
report = {'deleted':args.delete, 'unused_files':unused, 'unused_count':len(unused), 'unused_bytes':sum(all_files[p].stat().st_size for p in unused), 'retained_count':len(all_files)-len(unused), 'stale_lesson_keys':{k:v for k,v in stale.items() if v}, 'missing_references':missing}
Path(args.report).write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
if args.delete:
    manifest_path.write_text(json.dumps(combined,ensure_ascii=False,indent=2)+'\n')
    for lesson,mapping in combined.items():
        individual = ROOT/'audio/lessons'/lesson/'manifest.json'
        if not individual.exists() or json.loads(individual.read_text()) != mapping:
            individual.write_text(json.dumps(mapping,ensure_ascii=False,indent=2)+'\n')
    (ROOT/'lesson-audio-manifest.js').write_text('window.lessonAudioFiles = '+json.dumps(combined,ensure_ascii=False)+';\n')
    for file,review in reviews.items():
        if json.loads(file.read_text()) != review:
            file.write_text(json.dumps(review,ensure_ascii=False,indent=2)+'\n')
    for p in unused:
        all_files[p].unlink()
    # Keep historical metadata from pointing at deleted files.
    def prune(value):
        if isinstance(value, dict):
            if value.get('file') in unused_set:
                return None
            return {k:cleaned for k,v in value.items() if (cleaned:=prune(v)) is not None}
        if isinstance(value, list):
            return [cleaned for v in value if (cleaned:=prune(v)) is not None]
        return None if isinstance(value,str) and value in unused_set else value
    unused_set = set(unused)
    for file in (ROOT/'audio').rglob('manifest.json'):
        value=json.loads(file.read_text());cleaned=prune(value)
        if cleaned != value:
            file.write_text(json.dumps(cleaned,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({k:v for k,v in report.items() if k not in ['unused_files','stale_lesson_keys']},indent=2))
print('Stale lesson keys:',sum(len(v) for v in stale.values()))
print('Report:',args.report)
