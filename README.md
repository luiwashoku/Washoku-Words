# Washoku-Words
A washoku learning app prepared by lui

# Live Preview

`Shift-Cmd P`: Live Preview: Start Server


## Money Cat

The temporary 音声チェック deck is currently hidden from the home screen; its retained checker lists the same recorded vocabulary
in Japanese reading order, with kanji/readings and one replay button per word.
Use it to identify pronunciation corrections without playing the game.

The home-screen Money Cat button replaces the random-question entry. The original
random-question session code remains in `app.js` for future restoration.

Money Cat reuses `WordExplosionGame.loadVocabulary` and the existing
recording lookup from 単語爆発2, including Marin vocabulary. It preloads each
section's recordings and uses a persistent native audio element, matching the
playback path used by the working decks. Vocabulary and feedback share one player, started with silent samples during
the launch tap and reused for both feedback sounds and timed vocabulary playback.
The speaker restarts the current word, and leaving cancels pending playback.
It only selects words
that already have recordings. The source cat is copied unchanged from
`nopush/cat-03.svg` to `assets/cat-03.svg`; the game scopes its SVG styles, crops
empty canvas and keeps the floor stationary. Only the held `rect.st3` changes
color, leaving the collar bell unchanged.

Move the mouse over the play area, or drag anywhere on touch screens. Keyboard
users can focus the arena and use A/D to move and space to replay. Catch one of
three English coins. Missed coins repeat the unanswered question without a
penalty. Ten answered words lead to mistakes with chosen/correct meanings, followed by
correctly answered words; NEXT preserves the running
¥ total. Recent-word history and modest mistake weights persist during the
session. Leaving Money Cat resets the session and cancels its resources.

Run the session/data checks with:

```sh
osascript -l JavaScript tests/money-cat.test.js
```

For browser integration checks, serve the repository and open
`tests/money-cat-browser.html` (phone layout), or add `?desktop` for desktop.
The harness checks actual DOM collisions, shared audio replay, section money,
mistake review, SVG coin feedback, responsive bounds and navigation cleanup.

The temporary 音声チェック deck has a **New** speaker beside each existing recording for the Marin pitch comparison batch. Games use the selected recordings: 50 originals retained from the reviewed keep list, with 666 pitch-targeted recordings activated. See [review notes and source attribution](docs/marin-pitch-comparisons.md) for provisional expressions and listening limitations.


The October 3 expansion adds 124 vocabulary readings to the shared source used by
単語爆発, 単語爆発2 and Money Cat. Repeated requested labels are merged; meanings
such as both uses of おく and きつい remain in their cards. All 144 distinct requested
readings have short, newly written Marin example sentences. New vocabulary and
examples use generation speed 1.0 and native 1.0× playback. Existing preferred
recordings, including the original 見た目, are retained.

Exact sentence inputs, display text and vocabulary keys are saved in
`scripts/word-explosion-batches/2026-10-03.json`. To validate or resume rendering:

```sh
python3 scripts/generate-word-explosion-batch.py --batch 2026-10-03 --dry-run
python3 scripts/generate-word-explosion-batch.py --batch 2026-10-03
```

The generator saves clips and an incremental batch manifest without changing
active selections. Sentence particles and lexical kana are reviewed individually.
Dictionary pitch targets guide generation; audible pitch has not been independently
listening-verified. Fifteen new connected expressions use provisional phrase
guidance rather than an unsupported whole-expression accent number.


## Vocabulary study cards

The purple **カード** button beside home search opens a study deck from the same
vocabulary and examples as 単語爆発2. Each card shows the Japanese word, reading,
English meaning, Japanese example and English translation, with separate speakers
for the word and sentence. A centered vocabulary area places the word speaker
below the vocabulary, followed by a generous gap before the sentence. Content
has no inner box; the page background is green. The header includes a furigana
toggle and the shared 単語爆発2 offline download control. Word readings and sentence
readings start hidden, matching the other decks. The arrows and card count sit
in a centered group below the deck panel.

Existing recordings play at native 1×. Each word plays automatically using the
same gesture-unlocked native player as Money Cat; the word speaker replays it.
Playing a sentence stops the word. Swipe left/right, use the arrow buttons, or
press the keyboard arrow keys to browse; changing cards stops previous playback
and starts the next word. Going back stops playback and removes the deck controls
and green background. The first and last cards do not wrap.

The 単語爆発2 全 popup has a styled search field directly above its numbered list.
Filtered entries keep their original numbers. Clicking outside the popup closes it.
Browser checks: `tests/vocabulary-cards-browser.html`.
