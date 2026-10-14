"""Run: python3 tests/project-layout.test.py"""
import ast
import json
from pathlib import Path
import re
from urllib.parse import unquote, urlsplit

ROOT = Path(__file__).resolve().parent.parent
checked = set()


def exists(path):
    path = unquote(urlsplit(path).path)
    if path in ('', './'):
        return
    assert (ROOT / path).is_file(), f'Missing project file: {path}'
    checked.add(path)


def references(value):
    if isinstance(value, str):
        if re.fullmatch(r'(?:assets|audio|data)/[^\n]+\.(?:json|txt|svg|SVG|png|webp|jpg|mp3|wav)(?:[?#].*)?', value):
            exists(value)
    elif isinstance(value, list):
        for item in value:
            references(item)
    elif isinstance(value, dict):
        for item in value.values():
            references(item)


sw = (ROOT / 'sw.js').read_text()
shell = json.loads(re.search(r'const FILES = (\[.*?\]);', sw).group(1))
for path in shell:
    exists(path)
exists('js/audio/word-explosion-audio-manifest.js')
exists('data/word-explosion.txt')
exists('data/word-explosion-examples.json')

for page in ('index.html', 'favorites.html'):
    source = (ROOT / page).read_text()
    for path in re.findall(r'(?:src|href)="([^"]+)"', source):
        if not path.startswith(('#', 'http:', 'https:', 'data:')):
            exists(path)
for path in re.findall(r'url\("([^"]+)"\)', (ROOT / 'css/styles.css').read_text()):
    exists(str((Path('css') / path)))
for page in ('tools/tts-sample.html', 'tools/tts-quality-check.html'):
    assert '<base href="../">' in (ROOT / page).read_text(), page

for file in (ROOT / 'data').glob('*.json'):
    references(json.loads(file.read_text()))
for file in (ROOT / 'js/audio').glob('*-audio-manifest.js'):
    mapping = json.loads(file.read_text().split('=', 1)[1].strip().rstrip(';'))
    references(mapping)
for folder in ('scripts', 'tests'):
    for file in (ROOT / folder).glob('*.py'):
        ast.parse(file.read_text(), filename=str(file))

moves = json.loads((ROOT / 'docs/file-moves.json').read_text())
for old, new in moves.items():
    exists(new)
    assert not (ROOT / old).exists(), f'Old source file remains: {old}'
    if old.endswith(('.js', '.css', '.txt', '.html')):
        assert f"'{old}': '{new}'" in sw, f'Missing offline migration: {old}'
assert "register('sw.js')" in (ROOT / 'js/offline.js').read_text()
print(f'PASS: {len(checked):,} shell, page, CSS, data and audio references; '
      f'{len(moves)} moves, legacy offline aliases and Python syntax.')
