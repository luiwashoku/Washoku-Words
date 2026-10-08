# Persistent voice rendering preference

The user's default for all future Japanese voice rendering in this project is
Marin (`gpt-4o-mini-tts`) at generation speed `1.0`, including standalone
vocabulary, particles, short fragments, sentences, and dialogue. This preference
persists across sessions and VS Code restarts. It supersedes the older Nova and
`0.85` defaults below; use another voice or speed only when the user explicitly
requests it. Record voice, model, and generation speed in each review file and
keep per-entry speeds at `1.0`. Do not substitute a playback-rate adjustment.

Before sending any input to Marin, check every hiragana reading against a
reviewed reading source and its intended meaning and grammatical context.
Preserve long vowels, doubled consonants, lexical kana, and contextual particle
pronunciations. Keep display labels and lookup keys separate from speech input.

Before rendering, check the applicable standard Tokyo pitch accent against a
reliable accent source for the intended word and meaning when available. Record
the source, selected accent, and any variants in the review file, and send the
checked pitch guidance to Marin. Do not infer an accent from an unrelated
homophone or label an unconfirmed specialist compound as verified.

The user explicitly authorizes provisional intonation using Marin at generation
speed `1.0` when a reliable whole-word or phrase pitch target cannot be confirmed.
This authorization persists across sessions and VS Code restarts. Proceed
without asking for provisional-pitch permission again: use natural Tokyo
Japanese intonation, record the target as provisional in the review file, and
retain any reliable component sources. This allowance concerns pitch intonation
only; still check every hiragana reading for meaning and context before rendering
and resolve uncertain readings. Preserve user-supplied pitch contours for
specific entries rather than replacing them with generic provisional guidance.

Verified input and pitch targets do not prove that generated audio follows
them. Do not claim accurate audible pitch, clean sound, or listening verification
without reviewing the actual recording.

# Legacy Nova speech generation (only when explicitly requested)

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

# Marin sentence phrasing

Before generating Japanese Marin sentences, review phrase boundaries as well as
hiragana readings. Where a pause helps, add speech-only commas after complete
phrases or clauses; keep particles attached to the preceding phrase and never
insert a pause immediately before topic は (spoken わ), directional へ (spoken え),
or object を (spoken お). For 自分では, keep じぶんでわ continuous and pause
after わ when appropriate. Preserve display text and lookup keys. Use per-entry
`pronunciation_guidance` for troublesome grouping. Do not claim audible pause
verification without listening to the recording.

# Ingredient deck scope

For 食材カード under 食材の基本, the original supplied list ends at page 26.
Original source pages 27 and 28 remain skipped. The user subsequently authorized
five new flour/preparation pages, appended page by page as deck pages 27–31:
小麦粉; 衣・とろみ用の粉; 和菓子用の粉; その他の粉・ミックス; 使い方.
