# Fermentation notes audio

`fermentation-notes-basics-2026`: all 20 passages recorded with Marin (`gpt-4o-mini-tts`) at generation speed 1.0. Individual sound buttons and Read all enabled. Original source, punctuation and display text preserved. Speech-only phrase boundaries join original line wraps and pronounce headings, list content and explanatory parentheses.

Readings/context and pitch targets are in `scripts/lesson-audio-reviews/fermentation-notes-basics-2026.json`. Sources include the pinned Kanjium dictionary, [Kanjipedia 煮沸](https://www.kanjipedia.jp/kotoba/0002984100), [NTA sake terminology for 蔵付き酵母](https://www.nta.go.jp/taxes/sake/hambai/moderutekisuto/pdf/r03_04_10.pdf), and referenced dictionary entries for 甘味/旨味. Exact lexical accents selected where available; whole-passage and unconfirmed specialist-compound contours provisional under standing authorization. No pitch target inferred from unrelated homophones.

`docs/fermentation-notes-audio-audit.json`: PCM decoding, hashes, level/clipping/gap measurements and unprompted Japanese transcripts. All 20 clips non-silent with zero measured clipping. Passage 12 initially stalled and completed after concise phrasing guidance. Passages 1, 5, 7, 9 and 16–19 regenerated after initial transcript issues. Final transcripts retain intended content with homophonic spelling substitutions and normalization; an independent whisper-1 transcription retains both opening headings omitted/merged by primary ASR. Both results saved. ASR writes 発光/発行 for はっこう, 孔子 for こうし and normalizes ジプロック; reviewed inputs retain the article’s readings and wording.

These are automated checks, not listening verification. Audible pitch, pauses and smoothness have not been listening-verified. No new factual assessment or editing of the source article is implied by the reading review.

Passage 04 re-recorded at user request after a weird-voice report, retaining Marin at generation speed 1.0 and the reviewed speech input. Simpler stable narration guidance used. Replacement PCM has no measured clipping. Two independent ASR results retained with particle/homophone disagreement; voice quality has not been listening-verified.
