# 図鑑 audio

The illustrated vocabulary in `favorites.html` uses saved Nova MP3s generated with
OpenAI `tts-1-hd`, speed 1.0, matching the existing decks.

Run `python3 scripts/generate-zukan-audio.py` to generate or resume.
The exporter reads every illustrated page, preserves explicit pronunciation
lookup fields, derives Nova input from the intended hiragana readings, separates aliases with Japanese full stops, and uses the shared speech
cleaner. `scripts/zukan-speech-overrides.json` supplies speech-only inputs for
the reported faulty recordings, preserving display text and lookup keys.
Identical recordings from the game, taste, and sample folders are reused.
The generator reads `OPENAI_API_KEY` or the external private key file
`~/.config/washoku-words/openai-api-key`; credentials never enter the website.
Generation incurs API charges for missing clips. Before any API call, the exporter
and generator reject inputs containing kanji or katakana. Review intended readings
before rendering; this check does not certify audible pitch accent.

Publish `audio/zukan/`, `zukan-audio-manifest.js`, and `favorites.html` together.
Recordings load when an item is revealed. Selecting another item, changing
pages, or leaving the page stops the previous recording. The existing browser
voice remains the fallback for vocabulary without a saved recording.
