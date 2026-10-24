# Koji notes audio

`fermentation-notes-koji`: 25 passages, Marin (`gpt-4o-mini-tts`), generation speed 1.0 throughout. Two batches: chunks 1–13 and 14–25, with batch-specific reading/transcription checks. Sound buttons and Read all enabled. No changes to original Japanese wording, English translations, furigana, custom color dots or diagram.

Readings and context reviewed against the supplied text, explicit phonetic glosses and katakana transliterations, the pinned lexical accent dictionary, and referenced Japanese fermentation terminology. Sources and selected lexical pitch variants are in `scripts/lesson-audio-reviews/fermentation-notes-koji.json`. Whole-passage and unconfirmed scientific-name/compound pitch contours remain provisional under standing authorization.

Speech-only punctuation joins source wraps, keeps particles attached to complete phrases and preserves long vowels/gemination. Scientific names with phonetic glosses and explicit furigana are read once. Flow symbols become pauses (equals/plus spoken); decorative color/bullet markers and the diagram are not narrated. Source spellings オリーゼ, ルーチュエンス, ソーエ, ペプチン and 死活 are preserved without scientific editing or endorsement.

Generation requests for chunks 10 and 16 initially stalled; completed after concise narration guidance, retaining cached clips. Targeted transcript-based replacements for chunks 2, 6, 9, 14 and 19. Final primary ASR matches intended content with spelling/homophone normalization (e.g. 醍醐期 for 第5期, and オリゼ normalization). Secondary whisper-1 without an expected-text prompt retains heading 5 in chunk 19, omitted by primary ASR; both results saved. Earlier chunk-9 ambiguity resolved by replacement, not carried forward as verified.

`docs/koji-audio-audit.json` contains PCM measurements, file hashes, durations and raw transcripts. All 25 recordings decode as non-silent PCM with zero measured clipping. Automated checks do not prove audible pitch, voice quality or smoothness; no listening verification claimed.
