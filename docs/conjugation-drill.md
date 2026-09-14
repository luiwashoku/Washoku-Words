# Conjugation Drill: content and extension guide

Only Batch 1 exists: `conjugation-drill-q001`–`conjugation-drill-q030`.
The intended later batches are 031–060, 061–090 and 091–120. Do not add them
until the user requests the relevant batch. There are no future-question placeholders.

## Data and app integration

`data/conjugation-drill.json` is one appendable array, loaded through the existing
catalog/lesson loader. Its entry follows Particle Drill (`sortOrder: 68.75`).
Both the lesson and each question declare `answerMode: "typed"`.
All other lessons retain the multiple-choice path.

Typed items retain the common `id`, `chapter`, `page`, `type`, `difficulty`,
`question`, `answers`, `correct`, and explanation fields. As explicitly requested,
typed items have ONE canonical answer (`answers: ["聞いて"]`, `correct: 0`),
not four distractors. The loader bypasses answer shuffling for this mode.

Additional fields:

- `batch`: batch number; `page`: stable sequence number within this drill.
- `sentence`: Japanese with exactly one `＿＿＿` blank.
- `translation`: the intended English meaning.
- `question`: sentence, blank line, translation, for the shared renderer/speech.
- `verb`, `verbReading`, `verbGroup`: dictionary form, hiragana reading,
  and `group-1`, `group-2`, or `irregular`.
- `form`, `formLabel`: precise target and learner-facing name.
- `conjugationFamily`: stable performance key. `masu` and `masen` share `polite`;
  other Batch 1 forms use their form key.
- `pattern`: narrower transformation key, such as `group-1-ku-te`.
- `acceptedAnswers`: explicit kanji/kana equivalents; include the canonical answer.
- `rule`: a very short transformation, shown in a collapsed optional rule panel.
- `grammarPoint`: dictionary verb → requested form, used by the existing index.

The typed form shows the Japanese sentence, translation, dictionary verb and
requested form. It does not display or speak the answer before submission.
Blank/whitespace-only input and active IME composition do not submit.
Validation normalizes Unicode width, surrounding whitespace and katakana to
hiragana, then compares against the explicit accepted-answer list. It does not
strip internal characters, match by meaning, accept romaji, or automatically
accept a different conjugation. Standard potential and full `ている` forms are
labelled explicitly; `見れる` and `持ってる` are not orthographic alternatives to
those requested targets.

## Practice and review

A miss is queued for after three other submitted answers. If the bank ends
sooner, pending reviews are offered at the end. The same question is reused,
so no extra bank items or hidden future-batch content are generated. Each item
can receive at most one queued review per session, preventing an endless loop.
A correct answer to a pending item cancels that pending review. Index navigation
can skip/resume bank questions; leaving or reopening the lesson resets the
in-session queue. There is no calendar-based spaced-repetition scheduler.

`washoku-conjugation-performance` in localStorage persists family attempts,
correct attempts, distinct verbs produced correctly, and per-item attempt counts.
Retries count as attempts. The feedback's “Practice by form” panel explicitly
says these are practice statistics, not a mastery score.

The existing `washoku-foundation-progress` entry stores unique `attemptedIds`
and `correctIds` for this lesson. Its menu says “practised” rather than “mastered”
or “completed”; repeating an item does not inflate the numerator. Other lessons'
legacy progress behavior is unchanged. Overall answer statistics still include
all attempts, as they do elsewhere in the app.

## Appending the next requested batch

1. Read ALL existing Conjugation Drill questions first. Compare the completed
   sentences, verb/form pairs, contexts and grammar frames to avoid near-duplicates.
2. Add exactly 30 new objects with the next IDs and `batch` number. Retain prior
   IDs, accepted answers and family keys so existing saved progress still works.
3. Update the catalog's actual `questionCount` and introduction to describe the
   batches that actually exist. Never advertise 120 items before they exist.
4. Track cumulative form/verb coverage. The user's 120-item distribution is a
   target across all batches, not an equal quota per batch. Introduce harder
   forms gradually; transfer verbs should remain few.
5. Check natural Japanese, exact blank boundaries, translation, dictionary form,
   verb group, irregular forms, and accepted kana for every new question.
6. Verify JSON, IDs, one canonical answer, one blank and catalog count. Exercise
   typed acceptance/rejection, IME handling, review timing/end-of-bank behavior,
   persisted family stats and an existing multiple-choice lesson in a browser.

## Batch 1 coverage

| Form | Count |
|---|---:|
| て-form | 5 |
| た-form | 3 |
| ない-form | 4 |
| なかった-form | 2 |
| ます | 2 |
| ません | 1 |
| Potential | 4 |
| ～たい | 2 |
| ～たら | 3 |
| Volitional | 2 |
| ～ば | 1 |
| ～ている | 1 |
| Total | 30 |

All ten core verbs appear exactly three times: 食べる, 見る, 行く, 聞く,
話す, 持つ, 飲む, 帰る, する, 来る. No transfer verbs or lower-frequency advanced
forms have been added in Batch 1.

## Final-bank targets to retain for later batches

These are approximate totals across the eventual 120 items, not additional
questions to generate now: て-form 12; た-form 10; ない-form 12; ます/ません 8;
potential 12; ～たい 8; ～たら 10; volitional 8; ～ば 7; passive 7;
causative 6; causative-passive 4. The remaining 16 slots can cover past negatives,
ている and other useful combinations. Imperative/prohibitive recognition can be
considered in those remaining slots when a later batch is explicitly requested.

## Batch 1 verification

- Manually checked the 30 completed Japanese sentences, translations, exact
  target forms, group assignments and accepted kana; all ten verbs occur three times.
- Checked exact canonical forms/readings, unique project IDs, one blank per
  question, JSON schema and the actual 30-item catalog count.
- Exercised all 30 items in both kanji and kana in an isolated headless Brave
  profile. Verified rejection of 11 wrong/overlong/contracted forms, including
  行いて, 行いた, 帰ない, きない, 見れる for standard potential, and whole expressions.
- Verified whitespace-only rejection, katakana/width normalization, composition
  event guards, native Enter submission, and duplicate-submission locking.
- Verified a delayed retry after three other answers, resumption of the bank,
  flushing multiple misses at the end and termination after failed retries.
- Verified persisted statistics after reload, distinct practice counts staying
  at 30/30 on repeats, mobile layout at 390px, and the existing Particle Drill's
  multiple-choice feedback. No JavaScript runtime errors were observed.
- IME composition was exercised with browser composition events; no claim is
  made that every native OS keyboard/IME was tested.
