# Reviewed Nova lesson batches

Settings: `tts-1-hd`, Nova, speed 1.0, MP3.

The ordered queue is `scripts/lesson-audio-batches.json`. Existing taste and game
decks are excluded. Each remaining catalog lesson is a separate batch.

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
Next batch: `page05`, 調理器具.

Reading checks are not a certification of audible pitch accent or articulation.
