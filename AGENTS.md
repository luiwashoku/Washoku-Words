# Nova speech generation

For future Japanese Nova recordings, first check the intended hiragana reading
against the vocabulary reading or reviewed reading source. Send the correct
hiragana to Nova, retaining necessary long-vowel marks and punctuation. Do not
send display kanji as a substitute for checking pronunciation. Keep display
labels unchanged and maintain distinct lookup keys where needed.

For 図鑑, use `scripts/export-zukan-audio.js` and
`scripts/zukan-speech-overrides.json`. The exporter and generator reject
remaining kanji or katakana inputs before making API calls. Preserve explicit
readings for rare kanji, aliases, and pronunciation corrections. Text validation
is not proof of correct audible pitch accent; do not claim listening verification
without reviewing the recording.

For the rest of the app, generate in lesson batches listed in
`scripts/lesson-audio-batches.json`. Before rendering, review every speech key
from `scripts/export-lesson-audio.js` and save exact hiragana inputs in
`scripts/lesson-audio-reviews/<lesson-id>.json`. Check topic は → わ,
directional へ → え, and object を → お in context; preserve lexical kana
such as はな, はっこう, はごたえ, and はいった. Never replace every は globally.
Use `scripts/generate-lesson-audio.py --lesson <lesson-id>`, which requires
complete reviewed input coverage. Preserve distinct display text and lookup keys.

For upcoming Nova batches, use generation speed `1.0` for sentences, dialogue
prompts (including cloze prompts), and full-sentence explanations. Use `0.85` for standalone
vocabulary, particles, and very short phrase/grammar fragments. Record the
generation speed in the review file, using per-entry `speed` overrides as needed;
this is the Nova generation setting, not a playback-rate change.
