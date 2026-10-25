# Stories article recordings

Completed all 258 previously missing passages across nine article subdecks, in batches of at most eight. Voice: Marin; model: gpt-4o-mini-tts; generation speed: 1.0. Existing 会話 recordings retained.

Reviewed hiragana, contextual particle readings and clause boundaries before generation. Exact lexical reading/accent sources and provisional full-passage intonation targets are recorded in scripts/lesson-audio-reviews/stories-*.json. Display Japanese and English translations are unchanged.

Every final MP3 was decoded for non-silent signal and clipping, hashed, and transcribed with gpt-4o-transcribe without an expected-text prompt. Compared every transcript against its supplied passage; ambiguous clips received independent Whisper/phonetic checks and whole-passage re-recordings as needed. Evidence and superseded recording history are retained in review JSON and docs/lesson-audio-audits/. These are automated checks, not listening verification or proof of audible pitch accuracy.

Validation: tests/stories-articles-audio.test.py; tests/stories-remaining-articles.test.py; tests/stories-articles-audio-browser.html; tests/stories-remaining-articles-browser.html; tests/stories-salt-article-browser.html. Browser checks cover all 258 exact MP3 selections at playback rate 1, nine complete Read all queues, finish/stop/exit behavior, translations, furigana and mobile layout.
