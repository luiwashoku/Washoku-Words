# Temporary vocabulary audio review

Open **音声チェック** on the home page, or `vocabulary-audio-review.html`.
The page contains only the 375 new cards from the October 12, 2026 additions.
Words and sentences have separate playback, OK, and Redo controls. Search and
The first reviewed batch retains 25 words; remaining batches contain 50 words. Notes and decisions save on the current
device; **Download checks** exports them for applying accepted recordings later.
The review page does not modify the deck or generate speech.

## Stage future batches

1. Review hiragana, meaning, particle pronunciation, phrase grouping, and applicable
   pitch guidance under `AGENTS.md`, then generate Marin at speed 1.0 when requested.
2. Use content-addressed MP3 filenames, with a new path for every replacement.
3. Set `audio.word` and/or `audio.sentence` for matching `key` entries in
   `data/vocabulary-audio-review.json`. Use repo-relative `audio/...mp3` paths.
   Keep preview recordings out of the active deck manifests during review.
4. The app cleanup audit protects audio referenced by this review JSON.
   Replacing a preview path automatically invalidates any saved approval for that
   clip. Word and sentence approvals are independent and tied to their paths.
5. After user approval or an exported check file, promote only the approved clips
   to the applicable active manifests. Keep redo/unreviewed clips staged.
   Retain distinct lookup keys for homonyms such as 奥／置く and 肩／方.
6. Remove an example's `audioPending` flag only after both its word and sentence
   recordings are accepted and correctly linked. Otherwise keep its deck audio
   disabled. Nothing in this temporary module performs promotion automatically.

A check is the user's judgment, not programmatic proof of audible pitch accuracy.
Browser storage can be lost when site data is cleared; exported checks preserve
review decisions across devices. Serving the page at another origin uses separate
browser storage.

## Batch 1 staged — October 12, 2026

Words 1–25 (袖 through イヤホン): 25 word clips and 25 example clips.
`python3 scripts/generate-vocabulary-review-audio.py --batch 1` validates the
complete review in `scripts/vocabulary-audio-reviews/batch-01.json` and stages
content-addressed previews only. Optional `--key` and `--kind` select reviewed
corrections. Generation speed is 1.0. Twenty-four words have exact dictionary
accent matches; 折りたたみ傘 uses authorized provisional compound intonation
with checked component sources. Sentence-level intonation is provisional with
reviewed noun targets and short phrase boundaries. All 25 sentence inputs match
contextual furigana, katakana conversion, and the reviewed 夜は → よるわ.
All 50 MP3 files pass file-format and positive-duration checks; this is not
listening or audible pitch verification. Active deck manifests and pending flags
remain unchanged until user approval.

## Batch 1 checks imported and corrections staged

The user export approved 42 clips and rejected 8. Exact review IDs, keys, voice,
speed and preview file paths were validated before applying the data. Twenty
word recordings and twenty-two sentence recordings were linked to the active
shared manifests; all 18 fully approved cards were enabled. Seven cards remain
audio-pending until their remaining clips are accepted. Scoped vocabulary keys
are preserved alongside unambiguous reading aliases in batch 1.

Only the eight rejected clips were rendered again, at Marin 1.0, with their
checked hiragana and dictionary targets retained and more compact phrasing
guidance. The new previews have fresh paths and no approval. Imported approvals
also appear on other devices; local decisions can override them. The source
check export is retained in scripts/vocabulary-audio-reviews for audit.

## Remaining batches of 50 cards

The user authorized generating all remaining cards for review at the end.
Explicit ranges in data/vocabulary-audio-review.json retain batch 1 (1-25)
and define batches 2-8 (26-75, 76-125, 126-175, 176-225, 226-275,
276-325, 326-375). Each new batch has 50 words plus 50 sentences.

Run `python3 scripts/generate-vocabulary-review-audio.py --batch 2 --through 8`.
The complete reviews cover 700 clips, with individual contextual particle
changes and preserved lexical kana. Seventeen topic phrases were individually
reviewed; all displayed object particles are transcribed as hiragana o.
Dictionary targets are available for 241 words (including reviewed spelling
aliases); 109 compounds or phrases use explicitly provisional component-guided
intonation. The voiced supplied reading of the baggage-storage word is accepted
as an alternate reading by Digital Daijisen, and its pitch remains provisional.
Inflected verbs and adjectives are instructed to use appropriate contextual
accent rather than mechanically applying dictionary-form accents.

All remaining clips stay in the temporary review page until checked. Existing
42 approvals, the 18 enabled cards, and batch 1 correction previews are retained.

Completion check: all 750 current preview references (375 words and 375
sentences) match the exact reviewed request hashes. Every file passes MP3
metadata and positive-duration checks. Word durations range from 0.360 to
3.552 seconds; sentence durations from 2.112 to 6.264 seconds. These checks do
not establish audible pitch, pacing or timbre correctness. Single-mora heiban
words 血 and 胃 received targeted compact guidance without an invented second
mora. User approvals and all 18 enabled cards remain unchanged.
