# かなハチ — first seven-kana version

The bee on the main page opens the existing game screen. This first version uses exactly seven distinct kana, at least five distinct answer readings, a required centre, optional all-seven bonus, and the existing recorded-audio player. It generates its dictionary at runtime from current source data. There is no separately maintained game word library.

## Vocabulary audit

Current data produces **3,028 unique usable readings**, retaining **3,290 spelling/meaning variants**. Normalization uses Unicode NFKC/NFC and converts katakana to hiragana. Voicing, small kana, っ, ん, and ー remain distinct. Words with the same reading share one answer, but their different spellings and meanings are retained. Capitalization/whitespace-only gloss duplicates merge with their source audio metadata preserved. The answer display combines equivalent meanings and redundant romanized labels into one row while retaining genuine homophones.

Included explicit vocabulary sources:

- Shared `word explosion.txt` word bank, also used by Word Explosion and Money Cat.
- Ingredient, meat, chicken, beef, pork, and fish cards.
- Cooking/food reference vocabulary tables, topic vocabulary tables, and household-finance vocabulary tables. Example sentences and food-reference examples are not extracted.
- Number-table entries with their supplied readings and explicit contextual English meanings. See the [translation audit](kanahachi-translation-audit.md).
- Fermentation, washoku, heat-control and knife cards: standalone terms and vocabulary lists, not prose or section headings.
- Food titles in `taste-words.json` and dictionary-form verbs in conjugation cards.

These currently contribute 20 source IDs across the app's categories. Catalog vocabulary-card sources are discovered automatically; new terms in the supported formats become available on the next game load.

Of 4,579 candidate entries, **4 are excluded for unsupported/ambiguous readings**: `IHコンロ`, `ツバ（口金）`, `口輪（角巻）`, and `R（反り）`. Their source readings contain Latin text or multiple comma-separated alternatives. **27 one-kana occurrences** are excluded by the two-kana minimum. Counts are occurrences before deduplication. No missing reading is guessed.

This is intentionally the initial integration requested before building the broader library. Quiz answer strings, grammar patterns/explanations, dialogue, sentence decks, and the separate 図鑑 page are not scraped. Conservative term filters omit prose, combined labels, and long phrases. Extending extraction to additional explicitly marked vocabulary schemas is a later library task. Counts change as the source data changes.

## Puzzles and progress

Candidate tile sets come from unions of actual word readings. Search is bounded to 400 seeds, 160 partners, and at most 180 tile sets. Every answer is calculated before play, and every displayed tile participates in at least one valid answer. Pangrams are not required. Shorter answer lists (5–35 readings) are preferred when available. An empty puzzle is never displayed.

Each kana in an accepted reading earns one point; an answer containing all seven distinct tiles earns seven extra points. Homophones score once. Revealed answers earn no points and finish the puzzle.

`washoku-kanahachi-v1` stores the board, outer positions, found readings, input, hint stage, and finished state in local storage. Saved answers are revalidated against current vocabulary and points are recalculated. `#kanahachi` returns a refreshed page directly to the game. The back button clears that route and returns home. Corrupt saves are discarded. Storage failures are shown to the player.

Audio reuses the source lesson and shared vocabulary manifests, retaining spelling-specific keys where supplied. It uses the existing player at native playback speed; no voice generation or playback-rate adjustment is introduced. Missing recordings are labelled rather than replaced with unreviewed TTS. This first game does not add a full-library offline download; all vocabulary sources must load successfully, otherwise it offers retry.

## Verification

- `osascript -l JavaScript tests/kanahachi.test.js "$PWD"`: real-data aggregation, homophones, sentence exclusion, kana normalization, validation, scoring, seven-kana generation, optional pangrams, persistence sanitation and audio resolution.
- `tests/kanahachi-browser.html`, served locally: bee/back navigation, Japanese controls (no shuffle or Clear), centred cross deletion, staged hints, recorded playback, finish/reveal, new puzzle, refresh/reopen restoration, existing vocabulary cards, and horizontal fit at 320px/390px.
- Existing `tests/recorded-audio.test.js`: audio playback and game isolation regression checks.

Implementation: `kanahachi.js`, with integration in `app.js`, `index.html`, `styles.css`, and `sw.js`; icon at `assets/bee.svg`.
