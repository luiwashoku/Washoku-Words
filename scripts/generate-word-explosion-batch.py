"""Render a reviewed Marin vocabulary/example batch without changing active manifests.

Run: python3 scripts/generate-word-explosion-batch.py --batch 2026-10-03
Clips and incremental progress are content-addressed; interrupted runs can resume.
"""
import argparse
import concurrent.futures
import hashlib
import importlib.util
import json
import os
from pathlib import Path
import re
import subprocess
import time
import urllib.error
import urllib.request

ROOT = Path(__file__).resolve().parent.parent


def load(relative):
    return json.loads((ROOT / relative).read_text())


def prepare(batch_id):
    batch = load(f'scripts/word-explosion-batches/{batch_id}.json')
    pitch = load('scripts/marin-pitch-review.json')['entries']
    readings = load('scripts/word-explosion-marin-review.json')['entries']
    rows = json.loads(subprocess.check_output([
        '/usr/bin/osascript', '-l', 'JavaScript', str(ROOT / 'scripts/export-game-audio.js'),
        str(ROOT), '--vocab-only'
    ], text=True))
    if set(readings) != {r['key'] for r in rows} or set(pitch) != set(readings):
        raise ValueError('Complete vocabulary reading and accent review coverage is required')
    for row in rows:
        entry = readings[row['key']]
        if {'english': row['english'], 'kanji': row['kanji']} not in entry['vocabulary']:
            raise ValueError(f"Vocabulary reading review changed: {row['key']}")
    exported = json.loads(subprocess.check_output([
        '/usr/bin/osascript', '-l', 'JavaScript', str(ROOT / 'scripts/export-game-audio.js'),
        str(ROOT)
    ], text=True))
    exported_inputs = {r['key']: r['text'] for r in exported}
    spec = importlib.util.spec_from_file_location('marin_pitch', ROOT / 'scripts/generate-marin-pitch-trials.py')
    generator = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(generator)
    jobs = []
    for key in batch['new_vocabulary_keys']:
        entry = pitch[key]
        if entry['text'] != readings[key]['text'] or entry['vocabulary'] != readings[key]['vocabulary']:
            raise ValueError(f'Reading/meaning mismatch: {key}')
        if not entry.get('source') or not re.fullmatch(r'[ぁ-ゖー]+', entry['text']):
            raise ValueError(f'Unreviewed vocabulary input: {key}')
        if entry.get('guidance'):
            if not entry.get('components') or entry.get('status') != 'provisional-components':
                raise ValueError(f'Unreviewed phrase guidance: {key}')
        elif not isinstance(entry.get('accent'), int) or not 0 <= entry['accent'] <= len(generator.morae(entry['text'])):
            raise ValueError(f'Invalid accent target: {key}')
        if entry['speed'] != 1.0:
            raise ValueError(f'This batch requires generation speed 1.0: {key}')
        payload = dict(model=batch['model'], voice=batch['voice'], input=entry['text'],
                       speed=1.0, response_format='mp3', instructions=generator.instruction(entry))
        jobs.append(('vocabulary', key, 'audio/marin-pitch-trials', payload))
    examples = load('data/word-explosion-examples.json')
    for entry in batch['sentences']:
        key = entry['key']
        if (entry['speed'] != 1.0 or not re.fullmatch(r'[ぁ-ゖー、。！？!?\s]+', entry['input'])
                or exported_inputs.get(key) != entry['input']):
            raise ValueError(f'Unreviewed or mismatched sentence input: {key}')
        example = examples[entry['vocabulary_key']]
        if example != {'japanese': entry['display'], 'english': entry['english']}:
            raise ValueError(f'Sentence changed after reading review: {key}')
        instructions = (
            'Speak natural standard Tokyo Japanese in a warm, relaxed conversational voice. '
            'Read only the supplied hiragana sentence once; add no introduction, translation, '
            'explanation, or other words. Use native lexical pitch accent and natural phrase-level '
            'intonation, including the appropriate accent for conjugated forms. Do not mechanically '
            'apply dictionary-form accent to inflected words. Preserve long vowels and doubled '
            'consonants. The particles are already transcribed phonetically; do not change them. '
            'Use the supplied Japanese commas for short, natural breath breaks without long pauses. '
            'Do not sound theatrical, robotic, or over-enunciate individual morae.'
        )
        payload = dict(model=batch['model'], voice=batch['voice'], input=entry['input'],
                       speed=1.0, response_format='mp3', instructions=instructions)
        jobs.append(('sentences', key, f'audio/word-explosion-batches/{batch_id}', payload))
    if {e['vocabulary_key'] for e in batch['sentences']} != set(batch['requested_readings']):
        raise ValueError('Complete requested example coverage is required')
    if batch['voice'] != 'marin' or batch['speed'] != 1.0:
        raise ValueError('This batch requires Marin at generation speed 1.0')
    return jobs


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--batch', required=True)
    parser.add_argument('--workers', type=int, default=6)
    parser.add_argument('--dry-run', action='store_true')
    args = parser.parse_args()
    if not re.fullmatch(r'[a-zA-Z0-9_-]+', args.batch) or not 1 <= args.workers <= 16:
        parser.error('Invalid batch name or worker count')
    jobs = prepare(args.batch)
    print(f'Reviewed Marin jobs: {len(jobs)}; generation speed: 1.0', flush=True)
    if args.dry_run:
        return
    key_file = Path.home() / '.config/washoku-words/openai-api-key'
    api_key = os.environ.get('OPENAI_API_KEY') or key_file.read_text().strip()
    progress_path = ROOT / f'audio/word-explosion-batches/{args.batch}/manifest.json'
    progress_path.parent.mkdir(parents=True, exist_ok=True)
    progress = json.loads(progress_path.read_text()) if progress_path.exists() else {'vocabulary': {}, 'sentences': {}}

    def render(job):
        kind, lookup, folder, payload = job
        digest = hashlib.sha256(json.dumps(payload, ensure_ascii=False, sort_keys=True).encode()).hexdigest()[:20]
        path = ROOT / folder / f'marin-{digest}.mp3'
        path.parent.mkdir(parents=True, exist_ok=True)
        if path.is_file() and path.stat().st_size > 100:
            return kind, lookup, str(path.relative_to(ROOT))
        for attempt in range(5):
            request = urllib.request.Request('https://api.openai.com/v1/audio/speech',
                data=json.dumps(payload).encode(), headers={'Authorization': 'Bearer ' + api_key, 'Content-Type': 'application/json'})
            try:
                with urllib.request.urlopen(request, timeout=120) as response:
                    data = response.read()
                    if not response.headers.get('Content-Type', '').startswith('audio/') or len(data) < 100:
                        raise RuntimeError(f'Unexpected audio response for {lookup}')
                temporary = path.with_suffix('.tmp')
                temporary.write_bytes(data)
                temporary.replace(path)
                return kind, lookup, str(path.relative_to(ROOT))
            except urllib.error.HTTPError as error:
                if error.code not in (429, 500, 502, 503, 504) or attempt == 4:
                    raise RuntimeError(f'Marin speech HTTP {error.code} for {lookup}') from None
            except urllib.error.URLError:
                if attempt == 4:
                    raise RuntimeError(f'Marin speech network failure for {lookup}') from None
            time.sleep(2 ** (attempt + 1))

    failures = []
    completed = 0
    with concurrent.futures.ThreadPoolExecutor(max_workers=args.workers) as pool:
        pending = {pool.submit(render, job): job[1] for job in jobs}
        for future in concurrent.futures.as_completed(pending):
            try:
                kind, lookup, file = future.result()
                progress[kind][lookup] = file
                temporary = progress_path.with_suffix('.tmp')
                temporary.write_text(json.dumps(progress, ensure_ascii=False, indent=2) + '\n')
                temporary.replace(progress_path)
                completed += 1
                if completed % 10 == 0 or completed == len(jobs):
                    print(f'Completed {completed}/{len(jobs)}', flush=True)
            except Exception as error:
                failures.append(pending[future])
                print(str(error), flush=True)
    if failures:
        raise SystemExit(f'{len(failures)} clips failed; rerun to resume cached generation')
    print('Batch complete. Active manifests can now be updated from the batch manifest.', flush=True)


if __name__ == '__main__':
    main()
