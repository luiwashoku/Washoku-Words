"""Build the offline Bee 2 dictionary from a checksum-pinned JMdict JSON zip.

Run: python3 scripts/build-kanahachi-dictionary.py --source /path/to/release.zip
The source archive stays outside the published app. No audio is generated.
"""
import argparse
from collections import Counter
import hashlib
import json
from pathlib import Path
import random
import re
import unicodedata
import zipfile

ROOT = Path(__file__).resolve().parent.parent
SOURCE_URL = 'https://github.com/scriptin/jmdict-simplified/releases/download/3.6.2%2B20261012204142/jmdict-eng-3.6.2%2B20261012204142.json.zip'
SOURCE_SHA256 = '9a04fc1d0facf87645f8ec7cdaa370647d4a8f59131f6e2a614bcd680f855b85'
BAD_KANA = {'sk', 'ok', 'rk'}
BAD_KANJI = {'sK', 'oK', 'rK'}
BAD_SENSE = {'arch', 'obs', 'X', 'n-pr', 'surname', 'given', 'person', 'place', 'company', 'organization', 'product', 'station', 'work', 'char', 'ship', 'dei', 'fict', 'creat', 'ev', 'group'}
BOUND_POS = {'pref', 'suf', 'n-pref', 'n-suf', 'aux', 'aux-v', 'aux-adj', 'ctr', 'unc'}


def normalize(text):
    text = unicodedata.normalize('NFKC', text).strip()
    return unicodedata.normalize('NFC', ''.join(chr(ord(c) - 0x60) if 'ァ' <= c <= 'ヶ' else c for c in text))


def applies(restrictions, text):
    return not restrictions or '*' in restrictions or text in restrictions


def export_words(source):
    rows = set()
    exclusions = Counter()
    for word in source['words']:
        for kana in word['kana']:
            reading = normalize(kana['text'])
            if not re.fullmatch('[ぁ-ゖー]{2,48}', reading) or len(set(reading)) > 7:
                exclusions['reading_or_seven_tile_limit'] += 1
                continue
            if BAD_KANA.intersection(kana['tags']):
                exclusions['search_only_obsolete_or_rare_reading'] += 1
                continue
            spellings = [k for k in word['kanji'] if not BAD_KANJI.intersection(k['tags']) and applies(kana['appliesToKanji'], k['text'])]
            # No-kanji readings must not inherit a sense restricted to another spelling.
            if not spellings:
                spellings = [{'text': kana['text']}]
            for spelling in spellings:
                meanings = []
                for sense in word['sense']:
                    tags = set(sense['partOfSpeech']) | set(sense['misc'])
                    if BAD_SENSE.intersection(tags) or (sense['partOfSpeech'] and set(sense['partOfSpeech']) <= BOUND_POS):
                        continue
                    if not applies(sense['appliesToKana'], kana['text']) or not applies(sense['appliesToKanji'], spelling['text']):
                        continue
                    glosses = [g['text'] for g in sense['gloss'] if g['lang'] == 'eng']
                    if glosses:
                        meanings.append(' / '.join(glosses[:3]))
                if meanings:
                    # Preserve reading/spelling restrictions; shorten definitions, not readings.
                    meaning = '; '.join(dict.fromkeys(meanings[:3]))
                    rows.add((reading, spelling['text'], meaning, int(kana['common']), word['id']))
                else:
                    exclusions['no_eligible_standalone_english_sense'] += 1
    return sorted(rows), dict(exclusions)


def build_boards(rows):
    common = sorted({r for r, _, _, flag, _ in rows if flag})
    alphabet = sorted(set(''.join(common)))
    bits = {c: 1 << i for i, c in enumerate(alphabet)}
    mask = lambda reading: sum(bits[c] for c in set(reading))
    words = [(r, mask(r)) for r in common]
    rng = random.Random(20261015)
    rng.shuffle(words)
    candidates = {m for _, m in words if bin(m).count('1') == 7}
    # Bounded offline compilation; phones only select an already checked board.
    for _ in range(12000):
        _, left = rng.choice(words)
        _, right = rng.choice(words)
        union = left | right
        if left & right and bin(union).count('1') == 7:
            candidates.add(union)
        if len(candidates) >= 1200:
            break
    boards = []
    for candidate in sorted(candidates)[:1200]:
        subset = [(r, m) for r, m in words if m & candidate == m]
        kana = [c for c in alphabet if bits[c] & candidate]
        for center in kana:
            answers = [(r, m) for r, m in subset if bits[center] & m]
            if not 10 <= len(answers) <= 45 or sum(len(r) >= 3 for r, _ in answers) < 5:
                continue
            used = 0
            for _, m in answers:
                used |= m
            if used == candidate:
                boards.append([''.join(kana), center, len(answers)])
    assert boards, 'No ten-word boards; refusing to replace the dictionary.'
    rng.shuffle(boards)
    return boards[:2400]


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--source', required=True, type=Path)
    args = parser.parse_args()
    assert hashlib.sha256(args.source.read_bytes()).hexdigest() == SOURCE_SHA256, 'Unexpected source checksum'
    with zipfile.ZipFile(args.source) as archive:
        source = json.loads(archive.read(archive.namelist()[0]))
    rows, excluded = export_words(source)
    boards = build_boards(rows)
    result = {
        'version': 1, 'source': 'JMdict / EDRDG, via jmdict-simplified',
        'sourceDate': source['dictDate'], 'sourceUrl': SOURCE_URL, 'sourceSha256': SOURCE_SHA256,
        'copyright': 'James William BREEN and the Electronic Dictionary Research and Development Group',
        'license': 'CC-BY-SA-4.0', 'licenseUrl': 'https://creativecommons.org/licenses/by-sa/4.0/',
        'attributionFile': 'docs/licenses/jmdict.md',
        'columns': ['reading', 'spelling', 'english', 'common', 'sourceId'],
        'readings': len({r[0] for r in rows}), 'commonReadings': len({r[0] for r in rows if r[3]}),
        'sourceEntries': len(source['words']), 'exclusions': excluded,
        'rows': rows, 'boards': boards,
    }
    path = ROOT / 'data/dictionaries/kanahachi-jmdict.json'
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(result, ensure_ascii=False, separators=(',', ':')) + '\n')
    print(f'{result["readings"]:,} readings / {len(rows):,} spelling-meaning variants / '
          f'{result["commonReadings"]:,} common readings / {len(boards):,} boards / {path.stat().st_size:,} bytes')


if __name__ == '__main__':
    main()
