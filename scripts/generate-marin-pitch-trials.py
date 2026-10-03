"""Generate reviewed Marin comparison audio without editing the game manifest.

Run: python3 scripts/generate-marin-pitch-trials.py
Use --reviewed-only during reference review; the default requires all entries.
Existing content-addressed trials are reused and interrupted runs can resume.
"""
import argparse
import concurrent.futures
import hashlib
import json
import os
from pathlib import Path
import re
import time
import urllib.error
import urllib.request

ROOT = Path(__file__).resolve().parent.parent


def morae(text):
    result = []
    for char in text:
        if char in "ぁぃぅぇぉゃゅょゎ" and result:
            result[-1] += char
        else:
            result.append(char)
    return result


def instruction(entry):
    beats = morae(entry['text'])
    if entry.get('status') == 'provisional-components':
        return ('Speak standard Tokyo Japanese. Read only the supplied hiragana once, '
                'naturally and clearly, without adding any other words. ' + entry['guidance'] +
                ' Keep the phrase connected, preserve vowel length and doubled consonants, '
                'and avoid exaggerated stress or pauses between morae.')
    accent = entry['accent']
    pattern = ['high' if (accent == 1 and i == 0) or
               (accent != 1 and i > 0 and (accent == 0 or i < accent))
               else 'low' for i in range(len(beats))]
    shape = ('heiban: no lexical pitch drop within the word' if accent == 0 else
             f"drop immediately after mora {accent} ({beats[accent - 1]})")
    meanings = '; '.join(v['english'] for v in entry['vocabulary'])
    return (
        "Speak standard Tokyo Japanese. Read only the supplied vocabulary once, "
        "naturally and clearly. Do not add a particle, translation, explanation, "
        "or any other words. "
        f"The intended meaning is {meanings}. "
        f"There are {len(beats)} morae: {', '.join(beats)}. "
        f"Use Tokyo pitch accent type {accent}: {shape}. "
        f"The mora-by-mora pitch pattern is {'-'.join(pattern)}. "
        "Keep the word smoothly connected without pauses between morae, "
        "without stress or exaggerated intonation. Preserve vowel length, "
        "nasal morae and doubled consonants."
    )


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--workers', type=int, default=8)
    parser.add_argument('--reviewed-only', action='store_true')
    parser.add_argument('--dry-run', action='store_true')
    args = parser.parse_args()
    if not 1 <= args.workers <= 16:
        parser.error('Workers must be between 1 and 16')
    review = json.loads((ROOT / 'scripts/marin-pitch-review.json').read_text())
    readings = json.loads((ROOT / 'scripts/word-explosion-marin-review.json').read_text())
    if review['entries'].keys() != readings['entries'].keys():
        parser.error('Vocabulary coverage must match the original reading review')
    pending = [k for k, e in review['entries'].items() if 'accent' not in e and not e.get('guidance')]
    if pending and not args.reviewed_only:
        parser.error(f'{len(pending)} entries still need a reviewed accent reference')
    jobs = []
    for key, entry in review['entries'].items():
        if 'accent' not in entry and not entry.get('guidance'):
            continue
        if not re.fullmatch(r'[ぁ-ゖー]+', entry['text']):
            parser.error(f'Invalid hiragana speech input for {key}')
        original = readings['entries'][key]
        if entry['text'] != original['text'] or entry['vocabulary'] != original['vocabulary']:
            parser.error(f'Reading review mismatch for {key}')
        if not entry.get('guidance') and (not isinstance(entry['accent'], int) or
                not 0 <= entry['accent'] <= len(morae(entry['text'])) or not entry.get('source')):
            parser.error(f'Invalid or unsourced accent for {key}')
        payload = dict(model=review['model'], voice=review['voice'], input=entry['text'],
                       speed=entry['speed'], response_format='mp3', instructions=instruction(entry))
        jobs.append((key, payload))
    print(f'Reviewed jobs: {len(jobs)}; pending reference checks: {len(pending)}', flush=True)
    if args.dry_run:
        return
    key = os.environ.get('OPENAI_API_KEY') or (Path.home() / '.config/washoku-words/openai-api-key').read_text().strip()
    manifest_path = ROOT / 'data/marin-audio-trials.json'
    manifest = json.loads(manifest_path.read_text()) if manifest_path.exists() else {}
    active_files = ['word-explosion-audio-manifest.js', 'audio/word-explosion-marin/manifest.json']
    active_hashes = {p: hashlib.sha256((ROOT / p).read_bytes()).hexdigest() for p in active_files}
    folder = ROOT / 'audio/marin-pitch-trials'
    folder.mkdir(parents=True, exist_ok=True)

    def generate(job):
        speech_key, payload = job
        # Keep the original Akiraka comparison that the user has already tried.
        if speech_key == 'あきらか' and speech_key in manifest and (ROOT / manifest[speech_key]).is_file():
            return speech_key, manifest[speech_key]
        digest = hashlib.sha256(json.dumps(payload, ensure_ascii=False, sort_keys=True).encode()).hexdigest()[:20]
        path = folder / f'marin-{digest}.mp3'
        if path.is_file() and path.stat().st_size > 100:
            return speech_key, str(path.relative_to(ROOT))
        for attempt in range(5):
            request = urllib.request.Request('https://api.openai.com/v1/audio/speech',
                data=json.dumps(payload).encode(), headers={'Authorization': 'Bearer ' + key, 'Content-Type': 'application/json'})
            try:
                with urllib.request.urlopen(request, timeout=120) as response:
                    data = response.read()
                    if not response.headers.get('Content-Type', '').startswith('audio/') or len(data) < 100:
                        raise RuntimeError('Unexpected speech response')
                temporary = path.with_suffix('.tmp')
                temporary.write_bytes(data)
                temporary.replace(path)
                return speech_key, str(path.relative_to(ROOT))
            except urllib.error.HTTPError as error:
                if error.code not in (429, 500, 502, 503, 504) or attempt == 4:
                    raise RuntimeError(f'Speech generation HTTP {error.code} for {speech_key}') from None
            except urllib.error.URLError:
                if attempt == 4:
                    raise RuntimeError(f'Speech generation network error for {speech_key}') from None
            time.sleep(2 ** (attempt + 1))

    def save():
        temporary = manifest_path.with_suffix('.tmp')
        temporary.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n')
        temporary.replace(manifest_path)

    completed, failures = 0, []
    with concurrent.futures.ThreadPoolExecutor(max_workers=args.workers) as pool:
        futures = {pool.submit(generate, job): job[0] for job in jobs}
        for future in concurrent.futures.as_completed(futures):
            try:
                speech_key, file = future.result()
                manifest[speech_key] = file
                save()
                completed += 1
                if completed % 25 == 0 or completed == len(jobs):
                    print(f'Completed {completed}/{len(jobs)}', flush=True)
            except Exception as error:
                failures.append(futures[future])
                print(str(error), flush=True)
    assert all(hashlib.sha256((ROOT / p).read_bytes()).hexdigest() == digest for p, digest in active_hashes.items()), 'Active game manifest changed during generation'
    print(f'Trial clips available: {len(manifest)}. Active game manifests unchanged.', flush=True)
    if failures:
        raise SystemExit(f'{len(failures)} clips failed; rerun to resume')


if __name__ == '__main__':
    main()
