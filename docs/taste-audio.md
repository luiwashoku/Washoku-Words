# 味のことば audio

This deck uses saved OpenAI `tts-1-hd` MP3s with Nova at speed 1.0.
The existing browser voice remains available for other decks.

## Generate or resume

On macOS, run from the project root:

```sh
python3 scripts/generate-taste-audio.py
```

The script reads `OPENAI_API_KEY`, or the private file
`~/.config/washoku-words/openai-api-key`. Never put that key in the website.
It uses the existing JavaScript speech cleaner through macOS's `osascript`,
so no Python packages or frontend dependencies are required.

The source is `data/taste-words.json`: each name and its three descriptions.
The approved コシヒカリ title uses the speech-only input こしひかり.
Sentences beginning 最初は use the speech-only input さいしょわ to cue the particle pronunciation.
Displayed text and furigana are unchanged.

`scripts/taste-speech-overrides.json` contains the 150 reviewed particle
corrections authorized after the audit, plus the requested retry of the
干し椎茸のだし mouthfeel sentence. The latter uses natural Japanese with kanji in the
speech input while preserving じわーっと; the spaced hiragana retry was
still reported as garbled and has been replaced. The 新米 sweetness sentence also uses natural Japanese with kanji after
its hiragana recording was reported as mispronounced. These are exact
sentence matches.
The audit files remain a snapshot from before these replacements; their
old audio links are retained for comparison. The tofu-name and pitch-accent
findings have not been applied as part of this batch.

Audio filenames hash the input, model, voice, speed, and format. Existing
nonempty files are skipped, and matching Nova samples are reused. Completed
responses are saved atomically. Eight workers generate missing recordings;
each waits 500 ms after a successful request. Temporary HTTP errors receive
up to three retries. New generation and retries can incur API charges.

On success the script writes:

- `audio/taste-words/*.mp3`
- `audio/taste-words/manifest.json`
- `taste-audio-manifest.js`

Publish these together with the app changes. The manifest is a text-to-file
lookup; it contains no credentials. The browser loads individual MP3s only
when a sound button is clicked. A second click pauses/resumes. Switching
buttons or cards stops the previous recording. Loading/play errors reset
the button so the user can retry.

## Checks

```sh
osascript -l JavaScript tests/recorded-audio.test.js
osascript -l JavaScript tests/japanese-speech.test.js
osascript -l JavaScript tests/reading-card.test.js
```
