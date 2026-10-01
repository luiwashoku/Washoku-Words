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
