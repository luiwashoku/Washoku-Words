# Word Explosion Game

Open **日本語で話す → 単語爆発** in the existing local preview.

The vocabulary source is [word explosion.txt](../word%20explosion.txt) in the project root. Add one entry per line:

```text
apple | りんご
fox | きつね
```

Reopen the subdeck after saving edits. No question JSON or code changes are needed. Blank lines and lines beginning with `#` are ignored. Answers must be hiragana (the long-vowel mark `ー` is also supported). Duplicate reading-and-kanji pairs keep only the first entry. Distinct words may share a reading or English meaning; each round selects three different English prompts and hiragana answers. At least three unique entries are required. A malformed line displays its line number in the game with a retry button.

Each round draws three entries and shuffles the exact combined character pool. Matching a word automatically consumes only its chosen tiles. Its card turns into a solid, black-outlined burst that snaps between two fixed angles twice, like stop-motion frames, then disappears without shifting the remaining cards. Invalid prefixes return their tiles immediately. Tapping a selected character returns it and any characters after it, allowing you to back up without losing tiles. Consumed pool positions stay empty to keep other buttons from jumping under your finger. Clear all three words to unlock the next round.

No scores, timers, persistence, or quiz-progress updates are used. The catalog's `questionCount: 0` indicates that this is a dynamic game rather than a fixed question deck; it does not limit the vocabulary file.

Click a vocabulary bubble to reveal its Japanese answer in the answer box. The English label disappears when the bubble explodes.

The game panel grows to show every row of tiles in full. Long selections scroll horizontally within the answer box.

After “Round clear!”, an Everyday examples section shows one Japanese sentence and an English translation for each of the three words. The next-round button sits below the examples, which clear when the next round starts. Examples are stored in `data/word-explosion-examples.json`, keyed by the vocabulary's hiragana reading. Homophones with different meanings use a `hiragana|kanji` key for their separate examples; this takes precedence over a reading-only key. When adding a word to the TXT file, also add its `japanese` sentence and `english` translation to this JSON file. Missing examples produce a loading error with the affected word, so every playable word has an example.

The game engine and view live in `word-explosion.js`; `app.js` handles the existing deck navigation and provides the shared sounds and confetti. Leaving the screen cancels loading and feedback timers. Reduced-motion preferences suppress animation.

Vocabulary audio in both Word Explosion modes uses Marin (`gpt-4o-mini-tts`) at generation speed `1.0`. Marin vocabulary plays at normal speed in both modes. Sample sentences retain their existing Nova recordings. `word-explosion-audio-manifest.js` maps vocabulary speech keys to MP3s in `audio/word-explosion-marin/`; other decks do not use this mapping. The original Nova files remain available.

To regenerate, review the explicit hiragana in `word explosion.txt` and update `scripts/word-explosion-marin-review.json`, including contextual particle pronunciations. Run `python3 scripts/generate-word-explosion-marin.py`. The vocabulary-only exporter excludes sample sentences, and the generator requires complete reviewed key coverage and hiragana input before API calls. Reruns reuse content-addressed clips. Text review does not verify audible pitch accent.

Run the focused logic checks on macOS from the repository root:

```sh
osascript -l JavaScript tests/word-explosion.test.js
```

For a local preview, run `python3 -m http.server 8000` and open `http://localhost:8000`. Open via HTTP, since browsers restrict fetching the TXT vocabulary when opening the HTML as a local file.

With the preview server running, open `http://localhost:8000/tests/word-explosion-browser.html` for browser checks of example visibility, Japanese/English pairing, desktop and narrow layouts, round reset, cleanup, and loading retries. The page reports PASS or FAIL at the top.

Each example has a voice button beneath it, using the app's Japanese speech controls. Click to listen, pause, or resume. Playing a different example, starting a new round, or leaving the game stops the previous audio. Parenthetical readings are converted to spoken Japanese without repeating the kanji. Browsers without speech synthesis show a disabled voice button.
