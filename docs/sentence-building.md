# Sentence-building bank

The current bank is `data/game-prototype.json`, listed under 日本語で話す / Game Prototype in `data/catalog.json`.

## Authoring and audit standards

These standards apply to future sentence-building batches and edits to this bank.

- Start with an everyday thought an adult would actually communicate. Choose natural spoken Japanese first, then an idiomatic English prompt. Do not reconstruct English syntax in Japanese.
- Aim around N4–N3 with mostly familiar vocabulary. Teach reusable sentence patterns, collocations, conjugations, particles, and nuance. Mix casual and neutral polite speech.
- For a requested batch of ten, aim for six exercises with one primary target, three with two interacting targets, and one more complex thought. Basic supporting grammar does not automatically count as another target.
- Do not pad sentences to reach a tile count. A short useful construction is better than unnecessary clauses. Longer thoughts belong when each part adds meaning.
- Check whether a native speaker would ordinarily say the sentence in the stated context, whether information would normally stay implicit, and whether two constructions unnecessarily repeat the same idea. Being technically grammatical is not sufficient.
- Keep natural existing sentences unchanged. Do not simplify solely because of length, remove ordinary conversational softening, or rewrite just for stylistic variety.
- Replace weak or unnatural exercises only when their communication need or learning target is worth keeping; otherwise remove them and update the catalog count.
- Review the entire bank for duplicates before adding a batch. Repeating a useful pattern across distinct contexts is appropriate; repeatedly swapping one noun in the same sentence is not.
- Update the English prompt, Japanese answer, tiles, accepted sequences, and both explanations together when replacing an exercise. Keep its ID when replacing the same learning slot; do not leave the rejected version elsewhere in the bank.

## Tiles and validation

This is a sentence-building format, distinct from four-choice notebook quizzes. Each entry has `answerMode: "sentence-builder"`, one canonical sentence in `answers`, `correct: 0`, a `chunks` array, and indexed `acceptedSequences`.

- Use meaningful tiles: common chunks, noun/particle groups, stems, endings, and connectors. Split conjugations when that teaches a useful distinction.
- Include a few plausible distractors, normally three. Prefer wrong conjugations, particles, tense, polarity, or meaning over unrelated vocabulary.
- Review combinations of distractors too: two individually plausible distractors can form a valid alternative together. Accept a natural equivalent or change the distractors rather than mark good Japanese wrong.
- Accept natural alternative orders that preserve the English meaning. Do not add merely imaginable or stilted orders to increase the number of alternatives.
- Add standalone Japanese comma tiles (`、`) at helpful clause boundaries. Show punctuation in the canonical answer and accept omission of these optional commas.
- Duplicate tiles are separate selectable buttons. The app scores the resulting text, so identical commas or repeated `たり` tiles are interchangeable.
- Use parenthetical furigana; never curly-brace readings or ruby markup.
- Check JSON parsing, global question-ID uniqueness, catalog count, valid tile indexes, no reuse of a physical tile within a sequence, and canonical sentence reconstruction. Review linguistic correctness separately; passing data validation does not prove naturalness.

## Current bank: 100 user-supplied sentences

The user subsequently requested a full replacement of the original bank with 50 explicitly supplied English/Japanese pairs, focus labels, and registers. The user then supplied sentences 51–100 to append, keeping the original 50 unchanged. The current deck contains exactly those 100 pairs, with parenthetical readings, playable tiles, three distractors per exercise, explanatory notes, and optional comma variants. Canonical wording is preserved; the usual 6/3/1 recommendation does not override an explicitly supplied set.

Question IDs use `game-prototype-set02-q01` through `game-prototype-set02-q100`, so the retired questions are not reused as new content identities. The catalog count is 100. The earlier audit below is historical and does not describe the current entries.

## Historical audit of the original 33 exercises

All 33 sentence-building entries were reviewed, including English prompts, Japanese answers, tiles, explanations, and accepted alternatives. No other data file contained this answer mode. At the end of that audit, the bank contained 33 exercises: two sentence replacements, two additional entries with answer-bank fixes, and 29 entries unchanged. No new exercises were generated during the audit.

| ID suffix | Decision | Reason |
| --- | --- | --- |
| q02 | Keep | Fresh fish and reasonable prices give distinct reasons to return. |
| q03 | Keep | Natural examples of day-off activities; たり is useful rather than decorative. |
| q04 | Replace | The ordering-confidence goal was buried inside an elaborate fear-until-practice construction. Use 日本語で緊張せずに注文できるようになりたいです. |
| q05 | Replace | The expectation was stated twice. Use 思ったより複雑だった and align the English prompt. |
| q06 | Keep | Timing, checking fridge contents, and a deliberate habit each add information. |
| q07 | Keep | Lack of motivation, leftovers, and a tentative plan form a natural complete thought. |
| q08 | Keep | Intended deadline, unexpected duration, and unfinished status explain a real work delay. |
| q09 | Keep | Rejecting dislike while explaining a personal choice is useful conversational softening. |
| q10 | Keep | An attempt and its disappointing result are distinct and natural. |
| q11 | Keep | An undecided plan and interest in visiting can coexist; the tentative ending is normal speech. |
| q12 | Keep sentence; trim alternatives | Gradual change is meaningful. Remove the two awkward orders placing 少しずつ directly before 最近. |
| q13 | Keep | Forecast, conditional outing, and advice belong in the same practical message. |
| q14 | Keep | A worthwhile purchase, leaving it unused, and a softened opinion each contribute meaning. |
| q15 | Keep | Transfers 思ったより into a concrete hotel impression; not an excessive duplicate of q05. |
| q16 | Keep | 先に確認しておきます is ordinary preparation language, not a reason to mechanically remove reinforcement. |
| q17 | Keep | A concise personal decision, distinct from general habits. |
| q18 | Keep | A practical short complaint teaching にくい. |
| q19 | Keep | A plausible small mistake with natural casual regret. |
| q20 | Keep | A concise release from an obligation. |
| q21 | Keep | Simultaneous activities plus frequency describe a real routine. |
| q22 | Keep | A possible delay and uncertain consequence form useful travel communication. |
| q23 | Keep | Previous experience explains knowing the way. |
| q24 | Keep | Regret, the possibility of a cancellation, and a tentative response justify the length. |
| q25 | Keep sentence; fix distractor | だけ combined with the available positive verb could yield a valid one-cup statement. Replace that distractor with まで. |
| q26 | Keep | Sustained curiosity about a movie naturally uses 気になってる. |
| q27 | Keep | 今ちょうど is an ordinary timing expression, not unnecessary grammatical complexity. |
| q28 | Keep | Personal taste and a softened degree make the criticism socially useful. |
| q29 | Keep | The negative habit target complements the affirmative habit in q06 without merely swapping a noun. |
| q30 | Keep | A short, useful shopping question. |
| q31 | Keep | Recent purchase plus failure is a natural complaint; the contrast matters. |
| q32 | Keep | Forgetting prevention and a note for later naturally combine. |
| q33 | Keep | Receiving a recommendation and wanting to try the place have separate roles. |
| q34 | Keep | Expectation, overspending on ingredients, and the opposite result form a coherent real experience. |

Recurring patterns were retained where they transfer to different communication needs: preparations in q16/q32, habits in q06/q29, and trying an experience in q10/q33. No whole exercise needed deletion solely for duplication.
