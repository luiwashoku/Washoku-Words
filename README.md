# Washoku-Words

A Japanese learning app with vocabulary, grammar, culinary reference decks, an illustrated dictionary, and word games. It uses plain HTML, CSS, and JavaScript; there is no build step.

## Run locally

Serve the repository root, then open `index.html`:

```sh
python3 -m http.server 8765 --bind 127.0.0.1
```

Open http://127.0.0.1:8765/. VS Code Live Preview also works. Offline downloads require HTTPS or localhost.

## File organization

| Location | Contents |
| --- | --- |
| `index.html`, `favorites.html` | App and illustrated dictionary entry pages |
| `sw.js`, `manifest.json` | Root-scoped offline service worker and app manifest |
| `js/app.js`, `js/offline.js` | Main app and offline download controls |
| `js/cards/` | Shared flashcard renderer |
| `js/games/` | かなハチ, Money Cat, Word Explosion, and Families of Doom |
| `js/audio/` | Japanese speech helper and generated playback manifests |
| `js/ui/` | Search interface helper |
| `css/` | App stylesheet |
| `data/` | Lesson data, shared word bank, vocabulary sources and category organization |
| `assets/` | Icons, diagrams and illustrations |
| `audio/` | Recordings, effects, and recording manifests |
| `scripts/` | Content exporters/builders, audio generators, and reviewed speech inputs |
| `tests/` | Data tests, game logic tests, and browser integration checks |
| `tools/` | Retained voice comparison pages |
| `docs/` | Feature notes, vocabulary lists, audits and organization records |
| `archive/source-tools/` | Retained original AppleScript source tool |
| `nopush/` | Private source materials; ignored by Git |

`AGENTS.md` contains the persistent recording preferences. See [organization notes](docs/file-organization.md) and [the exact move list](docs/file-moves.json).

## Vocabulary and audio

The shared word bank is `data/word-explosion.txt`. The topic deck is generated from that bank, original category definitions, supplemental vocabulary and the category priority map. To rebuild the deck and its readable vocabulary list:

```sh
python3 scripts/build-topic-vocabulary.py
python3 scripts/export-topic-vocabulary-list.py
```

Keep audio playback manifests in `js/audio/` together with their corresponding recordings in `audio/`. Generators write to these locations automatically. Reviewed inputs and provenance remain under `scripts/`; see [audio workflow](docs/lesson-audio.md) and `AGENTS.md` before generating recordings.

## Verification

```sh
python3 tests/project-layout.test.py
python3 tests/topic-vocabulary-cards.test.py
python3 tests/grammar-example-coverage.test.py
osascript -l JavaScript tests/kanahachi.test.js "$PWD"
osascript -l JavaScript tests/money-cat.test.js
osascript -l JavaScript tests/recorded-audio.test.js
```

JavaScript command-line tests use macOS JavaScript for Automation. Browser test pages run from the local server: see [test guide](tests/README.md). Some older tests contain outdated content counts; the organization audit records their unchanged baseline failures.

## Publish and offline use

Publish the entry pages, `sw.js`, `manifest.json`, and the complete `js/`, `css/`, `data/`, `assets/`, and `audio/` folders together. Keep the service worker at the root so it can control all app routes. Existing lesson downloads and saved game progress are retained; the service worker redirects former source-file paths to their current locations.

See [offline instructions](docs/offline.md), [かなハチ](docs/kanahachi.md), [category organization](docs/vocabulary-category-organization.md), and [earlier implementation notes](docs/historical-readme.md).
