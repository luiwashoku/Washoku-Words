# Reviewed Nova lesson batches

Settings: `tts-1-hd`, Nova, MP3. Default generation speed is 1.0; a reviewed batch
can specify `speed` in its review file, with per-entry `speed` overrides. Batches
49–50 use 1.0 for sentence/dialogue question prompts (including cloze prompts)
and explanations, and 0.85 for standalone answer words, grammar fragments,
and combined choice lists. Reviewed hiragana inputs are unchanged.

The ordered queue is `scripts/lesson-audio-batches.json`. Existing taste and game
decks are excluded. Each remaining catalog lesson is a separate batch.

Upcoming generation prioritizes the 日本語で話す category. Completed batches
1–48 retain their history; batches 49–60 cover its remaining decks, starting with
`useful-conversation-chunks` (会話で使えるフレーズ), followed by the grammar,
particle, conjugation, mimetic, everyday conversation, standard/spoken,
adjective, and adverb decks. Remaining food lessons follow in batches 61–83.
Review every speech key and its exact hiragana input before generating each batch.

Before rendering a batch, export its live speech keys:

```sh
osascript -l JavaScript scripts/export-lesson-audio.js "$PWD" page01-02
```

Check source furigana and kanji readings, and particle pronunciation in context.
Save an explicit mapping of every key to the reviewed hiragana input in
`scripts/lesson-audio-reviews/<lesson-id>.json`. Keep lexical は intact.
Mixed-language prompts need Japanese-only speech inputs; display text stays intact.
Then generate with:

```sh
python3 scripts/generate-lesson-audio.py --lesson page01-02
```

Generation refuses missing, incomplete, or stale key coverage and inputs containing
kanji, katakana, or Latin letters before reading the API key or making requests.
The generator reuses existing matching clips and resumes interrupted batches.
The key source is the same external private file/environment as the other decks.
Use `--retry-key <exact-key>` to regenerate a reported faulty recording.

Publish `audio/lessons/`, `lesson-audio-manifest.js`, `index.html`, and `app.js`
together. The app looks up recordings only within the selected reviewed lesson.
Existing audio controls still pause/resume and cancel on navigation.

Batch 1: `page01-02`, 味・香り・食感, 80 cards, 271 reviewed speech keys, 270 recordings.
Individual answer clips play sequentially in displayed order after shuffling.
Batch 2: `page03-04`, 調理の基本動詞, 40 cards, 159 reviewed speech keys and recordings.
Batch 3: `page05`, 調理器具, 32 cards, 144 reviewed speech keys and recordings.
Batch 4: `page06`, 焼き加減, 20 cards, 98 reviewed speech keys and recordings.
Batch 49: `useful-conversation-chunks`, 会話で使えるフレーズ, 210 cards,
936 reviewed speech keys and recordings: 418 at speed 1.0 and 518 at 0.85. Reading review
includes contextual particles, preserved lexical は, katakana long vowels,
spoken A/B placeholders, and the seasonal 盛り reading さかり.
Batch 50: `golden-grammar`, Grammar Drill, 189 cards, 1,028 reviewed speech keys
and 1,027 recordings: 377 at speed 1.0 and 650 at 0.85. The input review corrects
気に入る to きにいる, grammar terms to ますけい and たけい, and unconverted
間に and 嫌い to あいだに and きらい, with contextual particle checks.
Next batch: `particle-drill`, Particle Drill (batch 51).

Reading checks are not a certification of audible pitch accent or articulation.
