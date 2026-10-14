"""Render one reviewed Marin batch into the temporary review page only.

Active deck manifests and pending flags are never changed. Resume uses hashed clips.
"""
import argparse
import concurrent.futures
import hashlib
import json
import os
from pathlib import Path
import re
import subprocess
import sys
import time
import urllib.error
import urllib.request

ROOT = Path(__file__).resolve().parent.parent


def load(path):
    return json.loads(path.read_text())


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--batch', type=int, required=True)
    parser.add_argument('--through', type=int, help='Render consecutive batches, ending at this batch')
    parser.add_argument('--workers', type=int, default=6)
    parser.add_argument('--key', action='append', default=[])
    parser.add_argument('--kind', choices=['both', 'word', 'sentence'], default='both')
    parser.add_argument('--redo-from', type=Path, help='Select only clips marked Redo in this exported check file')
    parser.add_argument('--dry-run', action='store_true')
    args = parser.parse_args()
    if not 1 <= args.workers <= 16:
        parser.error('Invalid batch or worker count')
    staging_path = ROOT / 'data/vocabulary-audio-review.json'
    if not staging_path.exists():
        staging_path = ROOT / 'scripts/vocabulary-audio-reviews/final-recordings.json'
    staging = load(staging_path)
    if args.through is not None:
        requested = list(range(args.batch, args.through + 1))
        if (not requested or set(requested) - {b['id'] for b in staging['batches']}
                or args.key or args.kind != 'both'):
            parser.error('Invalid consecutive-batch request')
        for batch_id in requested:
            command = [sys.executable, str(Path(__file__).resolve()), '--batch', str(batch_id), '--workers', str(args.workers)]
            if args.dry_run:
                command.append('--dry-run')
            if args.redo_from:
                command.extend(['--redo-from', str(args.redo_from)])
            subprocess.run(command, check=True)
        return
    definition = next((b for b in staging['batches'] if b['id'] == args.batch), None)
    if not definition:
        parser.error('Unknown review batch')
    review = load(ROOT / f'scripts/vocabulary-audio-reviews/batch-{args.batch:02d}.json')
    if (review.get('id') != staging['id'] or review.get('batch') != args.batch
            or not review.get('reviewed') or review.get('model') != 'gpt-4o-mini-tts'
            or review.get('voice') != 'marin' or review.get('speed') != 1.0):
        parser.error('A completed Marin 1.0 reading and pitch review is required')
    if review.get('range') != [definition['start'], definition['end']]:
        parser.error('Reviewed range does not match the batch definition')
    batch = staging['entries'][definition['start'] - 1:definition['end']]
    cards = {e['key']: e for e in batch}
    entries = review['entries']
    expected = {(key, kind) for key in cards for kind in ['word', 'sentence']}
    if {(e['key'], e['kind']) for e in entries} != expected or len(entries) != len(expected):
        parser.error('Review must cover exactly all words and sentences in this batch')
    if set(args.key) - set(cards):
        parser.error('Requested key is not in this batch')
    for entry in entries:
        card = cards[entry['key']]
        word = entry['kind'] == 'word'
        if (not entry.get('hiragana_reviewed') or entry.get('speed') != 1.0
                or not re.fullmatch(r'[ぁ-ゖー、。！？!?\s]+', entry['input'])
                or not entry.get('pronunciation_guidance')
                or entry['display'] != (card['display'] if word else card['example']['japanese'])
                or entry['english'] != (card['english'] if word else card['example']['english'])
                or word and entry.get('reading_original', entry['input']) != card['reading']):
            parser.error('Reading review changed or is incomplete for ' + entry['key'])
        pitch = entry.get('pitch', {})
        target = pitch if word else pitch.get('word_target', {})
        if target.get('status') == 'provisional-components':
            if not target.get('components') or any(not c.get('source') for c in target['components']):
                parser.error('Missing provisional component references')
        elif not isinstance(target.get('accent'), int) or not target.get('source'):
            parser.error('Missing dictionary pitch target')
    redo = None
    if args.redo_from:
        checks = load(args.redo_from)
        if checks.get('review') != staging['id'] or checks.get('voice') != 'marin' or checks.get('speed') != 1.0:
            parser.error('Check file does not match this review')
        redo = set()
        for card in checks['entries']:
            if card['key'] not in cards:
                continue
            for kind in ['word', 'sentence']:
                if card[kind]['status'] == 'redo':
                    if card[kind]['file'] != cards[card['key']]['audio'][kind]:
                        parser.error('Redo check points to an outdated preview')
                    redo.add((card['key'], kind))
    selected = [e for e in entries if (not args.key or e['key'] in args.key)
                and (args.kind == 'both' or e['kind'] == args.kind)
                and (redo is None or (e['key'], e['kind']) in redo)]
    if not selected:
        parser.error('No reviewed clips selected')
    jobs = []
    for entry in selected:
        instructions = (
            'Read only the supplied hiragana once, in natural standard Tokyo Japanese, '
            'using a clear, warm, relaxed conversational voice. Add no other words. '
            'Preserve native vowel lengths, nasal morae, and doubled consonants. '
            'The particles have already been transcribed for pronunciation. '
            'Avoid English-style stress, whispering, theatrical delivery, stretched syllables, '
            'and pauses between morae. Use only brief natural pauses at phrase boundaries. '
            + entry['pronunciation_guidance']
        )
        payload = dict(model=review['model'], voice=review['voice'], speed=1.0,
                       input=entry['input'], response_format='mp3', instructions=instructions)
        jobs.append((entry, payload))
    print(f'Reviewed batch {args.batch}: {len(jobs)} clips; Marin generation speed 1.0', flush=True)
    if args.dry_run:
        return
    protected = list((ROOT/'js/audio').glob('*-audio-manifest.js')) + [ROOT / 'data/word-explosion-examples.json', ROOT / 'data/word-explosion.txt']
    protected_hashes = {p: hashlib.sha256(p.read_bytes()).hexdigest() for p in protected}
    api_key = os.environ.get('OPENAI_API_KEY') or (Path.home() / '.config/washoku-words/openai-api-key').read_text().strip()
    folder = ROOT / f'audio/vocabulary-review/batch-{args.batch:02d}'
    folder.mkdir(parents=True, exist_ok=True)
    manifest_path = folder / 'manifest.json'
    manifest = load(manifest_path) if manifest_path.exists() else {}

    def render(job):
        entry, payload = job
        digest = hashlib.sha256(json.dumps(payload, ensure_ascii=False, sort_keys=True).encode()).hexdigest()[:20]
        path = folder / f'marin-{digest}.mp3'
        if path.is_file() and path.stat().st_size > 100:
            return entry, str(path.relative_to(ROOT))
        for attempt in range(5):
            request = urllib.request.Request('https://api.openai.com/v1/audio/speech',
                data=json.dumps(payload).encode(), headers={'Authorization': 'Bearer ' + api_key, 'Content-Type': 'application/json'})
            try:
                with urllib.request.urlopen(request, timeout=120) as response:
                    data = response.read()
                    if not response.headers.get('Content-Type', '').startswith('audio/') or len(data) < 100:
                        raise RuntimeError('Unexpected speech response')
                temporary = path.with_suffix('.tmp')
                temporary.write_bytes(data)
                temporary.replace(path)
                return entry, str(path.relative_to(ROOT))
            except urllib.error.HTTPError as error:
                if error.code not in (429, 500, 502, 503, 504) or attempt == 4:
                    raise RuntimeError(f'Speech HTTP {error.code} for {entry["key"]}') from None
            except urllib.error.URLError:
                if attempt == 4:
                    raise RuntimeError('Speech network failure; rerun to resume') from None
            time.sleep(2 ** (attempt + 1))

    failures = []
    with concurrent.futures.ThreadPoolExecutor(max_workers=args.workers) as pool:
        futures = [pool.submit(render, job) for job in jobs]
        for i, future in enumerate(concurrent.futures.as_completed(futures), 1):
            try:
                entry, path = future.result()
                manifest.setdefault(entry['key'], {})[entry['kind']] = path
                temporary = manifest_path.with_suffix('.tmp')
                temporary.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n')
                temporary.replace(manifest_path)
            except Exception as error:
                failures.append(str(error))
            if i % 10 == 0 or i == len(jobs):
                print(f'Completed {i}/{len(jobs)}', flush=True)
    assert all(hashlib.sha256(p.read_bytes()).hexdigest() == h for p, h in protected_hashes.items()), 'Active deck files changed'
    if failures:
        raise SystemExit('\n'.join(failures))
    # Publish preview paths only after this request has completed successfully.
    staging = load(staging_path)
    for card in staging['entries']:
        for entry in selected:
            if entry['key'] == card['key']:
                path = manifest[entry['key']][entry['kind']]
                card['audio'][entry['kind']] = path
                imported = card.get('review', {}).get(entry['kind'])
                if imported and imported.get('file') != path:
                    card['review'][entry['kind']] = {'file': path, 'status': 'unreviewed'}
    temporary = staging_path.with_suffix('.tmp')
    temporary.write_text(json.dumps(staging, ensure_ascii=False, indent=2) + '\n')
    temporary.replace(staging_path)
    print('Preview paths updated. Active deck audio and pending flags unchanged.', flush=True)


if __name__ == '__main__':
    main()
