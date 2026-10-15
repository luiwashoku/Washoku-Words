# かなハチ — dictionary game

The single orange bee on the home screen opens **かなハチ**, the retained dictionary version. The app-only game has been removed. Existing dictionary-game progress remains under the same save key.

## Play

- Find ten distinct answer readings to reach the goal; keep playing after ten if desired.
- App vocabulary and eligible dictionary words count equally. Different spellings of the same reading count once, with spellings and meanings preserved in the answer detail.
- Use at least two kana, include the yellow centre, and use only the seven displayed kana. Repeats are allowed; small kana, voiced kana and `ー` remain distinct. Katakana input is matched in hiragana.
- Progress is shown only as `found / 10 found`, including continued play beyond ten; no points are displayed.
- Hints favour available app vocabulary, then common dictionary readings. The first hint gives a meaning; another hint reveals the reading.
- Reaching ten does not reveal or lock answers. An optional finish control reveals the remaining accepted readings.
- No recordings are generated. The game reuses the existing audio resolver; words without an available recording show their spelling, reading and meaning without an audio control.

## Dictionary and boards

The packaged dictionary derives from JMdict, via the pinned English `jmdict-simplified` release `3.6.2+20261012204142`, dictionary date **2026-10-12**. It contains **162,109 usable readings**, **224,244 spelling/meaning variants**, and **19,746 dictionary-marked common readings**. The output is **19,535,157 bytes** (19.5 MB decimal; approximately 5.9 MB with gzip transfer compression when supported by hosting). The app downloads the compact JSON, not the original source archive.

The importer preserves supplied reading/spelling/sense restrictions and source IDs. It converts katakana readings to hiragana and never guesses readings. It omits unsupported readings, one-kana entries, readings needing more than seven distinct tiles, search-only/obsolete/rare kana variants, outdated or search-only kanji variants, proper-name and archaic/obsolete senses, X-tagged senses, and entries whose only eligible senses are bound prefixes/suffixes, auxiliaries or counters. English meanings are shortened to the first three glosses of up to three eligible senses. No inflection expansion is performed. App entries are included separately under their existing vocabulary definitions.

Commonness comes from the source's reading-level common flags and is an approximation, not a graded learner word list. The importer compiles **2,400 boards**, each with at least **ten distinct common answer readings**, at most 45 common answers, at least five common readings of three or more kana, and no unused tile among the common answers. A pangram is optional.

Phones select a prechecked board and scan the compact rows once to calculate all accepted answers for that board. Only matching records become full dictionary objects. This avoids generating thousands of puzzles or materializing the full dictionary as large per-word objects on the phone. Current explicit app entries are merged at runtime, so new app words can count when their kana fit. The precompiled dictionary and boards update through a deliberate dictionary rebuild.

New puzzles favour boards with **at least five app-vocabulary answer readings**, while keeping the ten-common-dictionary-answer guarantee. If the locally available app vocabulary cannot support five, selection uses the highest available app count; with no available app vocabulary, dictionary-only boards remain playable. Any ten accepted answers still complete the goal. Existing saved puzzles continue unchanged; the preference applies when starting a new puzzle. This prioritizes app revision but does not guarantee exposure to every app word, since selection still uses the compiled seven-kana board pool.

## Isolation and offline use

- Game module: `js/games/kanahachi-dictionary.js`.
- Route: `#kanahachi`; previous `#kanahachi-dictionary` links are accepted.
- Preserved progress key: `washoku-kanahachi-dictionary-v1`.
- The shell cache includes the new module, compact dictionary, attribution and licence. Open the updated app online and let installation complete before going offline.
- The dictionary game can run offline even when other lessons have not been downloaded. It merges app vocabulary from sources that are available and reports when some app sources are unsaved. Existing recorded audio needs its corresponding saved audio download to play offline.
- Shared matching, vocabulary and audio helpers live in `js/games/kanahachi-core.js`; no app-only game UI or generator remains.

## Source and licence

See [JMdict attribution](licenses/jmdict.md) and the included [CC BY-SA 4.0 text](licenses/CC-BY-SA-4.0.txt). The generated dictionary is distributed under CC BY-SA 4.0; the game's rules popup links the attribution.

Rebuild from the checksum-pinned source archive:

```sh
python3 scripts/build-kanahachi-dictionary.py --source /path/to/jmdict-eng-3.6.2+20261012204142.json.zip
```

The builder stores the source URL and SHA-256 checksum in its source code and generated data. Keep the archive outside the published app; it is not required at runtime.

## Verification

```sh
python3 tests/kanahachi-dictionary.test.py
osascript -l JavaScript tests/kanahachi-dictionary.test.js "$PWD"
osascript -l JavaScript tests/kanahachi.test.js "$PWD"
```

Serve the app and open `tests/kanahachi-dictionary-browser.html` for goal completion, continued play, おいしい, meaning display, duplicates, hints, reveal, new puzzles, refresh/reopen persistence, mobile layout and saved-progress preservation. `tests/offline-migration-browser.html` checks app vocabulary and the packaged dictionary with the network disabled. Existing home, vocabulary and grammar browser checks also pass. Physical iPhone storage behaviour and audible playback are not listening-verified by these tests.
