# 単語爆発2

Open **日本語で話す → 単語爆発2**. The listening game uses the same `word explosion.txt` vocabulary and `data/word-explosion-examples.json` sentences as 単語爆発, through its shared vocabulary loader.

- Each round automatically speaks one Japanese word while the box shows “?”.
- The speaker below the box replays the word from the start.
- Three shuffled English choices contain the answer and two distinct other vocabulary meanings. Words with the same hiragana reading as the answer are excluded from the other choices.
- Incorrect guesses keep the word hidden and allow another attempt.
- The correct answer bursts the box, then reveals hiragana and kanji when available.
- After the reveal, the same Japanese example and English translation used in 単語爆発 appear below the choices, with a sentence voice button.
- “Next word” clears the example and automatically speaks the next word. All words are shuffled and played once before the list is reshuffled, avoiding an immediate repeat at the boundary.

The game uses Nova recordings at 80% playback speed with pitch preserved, and falls back to the device's Japanese speech synthesis when a recording is unavailable. The speaker button restarts the word from the beginning, including during playback. If autoplay is blocked, the speaker button provides a user-initiated replay. Reduced-motion mode reveals the answer immediately. Leaving the game cancels speech, loading, and the reveal timer. Failed loading can be retried.

This is a dynamic game entry with `questionCount: 0`, following the first Word Explosion game's catalog convention.

Serve the app locally and open `tests/word-explosion-2-browser.html` to check the complete vocabulary cycle, matching sentences/translations, sentence audio calls, autoplay/replay, guesses, reveal, mobile layout, cleanup, and return to the original game. Speech is mocked in the test; check audible playback on the target device.
