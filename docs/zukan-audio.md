# 図鑑 audio

The illustrated vocabulary in `favorites.html` uses saved Marin MP3s generated
with OpenAI `gpt-4o-mini-tts` at generation speed 1.0 and normal playback speed,
matching the Marin Word Explosion vocabulary settings.

Run `python3 scripts/generate-zukan-audio.py` to generate or resume.
The exporter reads every illustrated page, preserves explicit pronunciation
lookup fields, derives speech input from the intended hiragana readings,
separates aliases with Japanese full stops, and uses the shared speech cleaner.
`scripts/zukan-speech-overrides.json` supplies speech-only corrections, preserving
display text and lookup keys. `scripts/zukan-marin-review.json` records the exact
reviewed input for every key and the generation model, voice, and speed. The
generator requires complete coverage and matching exported inputs, and rejects
anything other than hiragana, long-vowel marks, punctuation and whitespace
before API calls. Text review does not certify audible pitch accent.

The generator reads `OPENAI_API_KEY` or the external private key file
`~/.config/washoku-words/openai-api-key`; credentials never enter the website.
Generation incurs API charges for missing clips. Content-addressed MP3s are
reused on reruns. `--retry-key` regenerates an exact lookup key.

Publish `audio/zukan/`, `zukan-audio-manifest.js`, and `favorites.html` together.
Recordings load when an item is revealed. Selecting another item, changing
pages, or leaving the page stops the previous recording. The existing browser
voice remains the fallback for vocabulary without a saved recording.
