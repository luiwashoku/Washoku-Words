# File organization — 14 October 2026

The project remains a plain static website with no build step. `index.html`, `favorites.html`, `manifest.json`, and `sw.js` remain at the root. Keeping the service worker there preserves its app-wide scope.

## Changes

- Moved app JavaScript into `js/`: main app/offline controls, `cards/`, `games/`, `audio/`, and `ui/`.
- Moved the stylesheet into `css/` and adjusted its two image URLs.
- Moved the shared word bank to `data/word-explosion.txt`; updated games, catalog, deck builders, exporters, docs and tests.
- Moved historical voice comparison pages into `tools/` with an app-root document base. Their generator writes there too.
- Retained the original AppleScript in `archive/source-tools/` and earlier project background notes in `docs/`.
- Kept scripts and tests in their established directories, with guides explaining workflows, review files, and test types. Preserved earlier README notes separately.
- Updated HTML script URLs, audio generator output paths, maintenance manifest discovery, and the offline shell list.
- Added service-worker redirects for former source URLs. Already downloaded lesson caches and local game progress keep their existing names and keys.

The complete mapping is in `file-moves.json`. Publish all moved folders together with the updated entry pages and service worker; load the update online once before returning offline.

## Deletions and preservation

Removed four `.DS_Store` files and three orphan MP3s totalling 72,960 bytes. The orphan audit searched application source, lesson data, all audio manifests, scripts, reviews and historical batch metadata; none referred to these three recordings. Their originals were copied to `/private/tmp/washoku-cleanup-recovery/` before removal for short-term recovery.

Retained 28,796 snapshot files byte for byte, including the shared word-bank text, all artwork and every remaining MP3. Changed data files contain updated source-file locations only; vocabulary count, readings, meanings, examples and recording selections are preserved. No private source materials or Git history were deleted. Audio review history is retained even when a clip is not selected in the current app.

## Verification

- `tests/project-layout.test.py` checks 27,731 runtime file references, all 22 moves, legacy service-worker aliases, and Python syntax.
- All 36 JavaScript files compile.
- Vocabulary aggregation tests pass: 1,578 entries, 24 categories, 168 pages; original and supplemental examples/audio preserved.
- Grammar coverage tests pass: 275 grammar points and 550 examples.
- Bee dictionary/rules/generation tests pass: 3,439 usable readings. The offline integration test builds the same full dictionary and generates playable seven-kana boards with the network disabled.
- Money Cat, Word Explosion, recorded-audio lookup, search, reading-card, response-practice, and illustrated-dictionary command-line checks pass.
- Browser checks pass for home layout at 320/390/768px, the current topic deck, grammar deck, Money Cat, both Word Explosion games, Families of Doom, and offline migration.
- Offline migration checks cover shell installation, activation, old URL redirects, preservation of saved lessons, and audio byte ranges.
- The vocabulary builder runs successfully, the selective Marin generator dry-run validates its updated exporter paths, and whitespace checks pass.

Seven older command-line checks also fail against the original pre-cleanup files: animal parts, chicken cards, fish cards, Marin pitch trials, furigana, Japanese speech, and lesson audio. They retain outdated counts, ordering, voices or test mocks; this cleanup did not remove or weaken them. The older generic vocabulary browser page expects the previous purple button and word-card interface. The Bee browser harness reaches its refresh test and times out at the same stage against the original files; its game logic and offline dictionary tests pass. These existing failures are recorded in `file-organization-audit.json` rather than represented as successful checks.

Actual iPhone airplane-mode storage and audible playback still require device testing. This cleanup's offline check uses the real service-worker source with in-memory caches and blocked network requests; it does not claim an iPhone listening test.
