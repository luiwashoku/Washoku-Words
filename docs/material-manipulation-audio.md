# Material manipulation audio, pages 169–171

Voice: Marin. Model: `gpt-4o-mini-tts`. Generation speed: **1.0** for every vocabulary item and sentence; playback is unchanged.

The user supplied the readings, meanings, and examples. Full lexical readings were compared with the segmented display furigana and material-handling contexts. Exact phonetic inputs, phrase boundaries, selected pitch targets and variants are recorded in `scripts/lesson-audio-reviews/topic-vocabulary-cards.json` (entries with `page` 169–171). Context-specific lookup keys remain separate from display labels and speech input. Japanese lookup-key suffixes keep these keys compatible with the app's speech-text normalization.

Accent reference: [pinned Kanjium accent dictionary](https://raw.githubusercontent.com/mifunetoshiro/kanjium/9ebca4589565c696e7c39e089e2e928ad65f678c/data/source_files/raw/accents.txt), SHA-256 `8bd0dd127dab32ceec94cb03ab1ba6b68858ea73421dfa1731af2f373deb4f20`. Exact same-meaning spelling/reading matches were available for 44 vocabulary items; their selected accents and listed variants are recorded. Eight whole expressions and the complete sentence contours are provisional under the user's standing authorization. Reliable lexical component references are retained. 両端 uses the supplied りょうはし, also recorded in [Daijisen](https://dictionary.goo.ne.jp/word/両端_(りょうはし)/).

Sentence review preserves lexical は in はこ, はんぶん, はさみ, はりがね and はし; object を is spoken お, while the topic は in この紙は is わ. Counter readings include きゅうじゅうど, にほん, にまい, さんまい and いちまい. Speech-only pauses occur after complete phrase groups, including a light comma after かみお in the folding sentence, rather than immediately before a particle.

Generation guidance requests continuous everyday Japanese, natural lexical timing, preserved long vowels and gemination, and no syllable-by-syllable delivery. Initial ASR mismatches and excessive unplanned internal gaps were investigated with targeted rerenders. The PCM and transcription results are in `docs/material-manipulation-audio-audit.json`; `scripts/audit-material-audio.py` can recheck one page. ASR receives no expected-text prompt; short isolated-verb follow-up checks for つまむ, つぶす and 結ぶ supply generic Japanese-word context only. Alternate kanji or kana for isolated homophones, such as 春 for はる, do not themselves establish a pronunciation error. ASR also cannot establish audible pitch accent or voice smoothness.

These are input/context reviews, file decoding/signal checks and automated transcript comparisons. They are **not actual listening verification**. Audible pitch accuracy, naturalness and freedom from choppiness remain unconfirmed by listening.

All three pages are enabled: page 169 has 40 clips, page 170 has 40, and page 171 has 24 (104 final word/sentence recordings). Final transcript differences are script/homophone choices or particle spelling, rather than identified content changes. The complete record retains raw transcripts and file hashes.

## 2026-10-21: standalone smoothness retry

User reported choppy delivery of ねじる and 結ぶ. Regenerated only those two word clips with shorter, connected-word delivery guidance, retaining the reviewed readings, Tokyo type 2 / type 0 targets respectively, Marin, and generation speed 1.0. Replacement recording checks are tracked in the audit JSON. Audible smoothness is not listening-verified.
