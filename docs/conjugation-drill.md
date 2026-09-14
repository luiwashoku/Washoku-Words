# Conjugation Drill

Current bank: 150 questions in `data/conjugation-drill.json`.
- Batch 1: `conjugation-drill-q001`–`conjugation-drill-q030`.
- Batch 2: `conjugation-drill-q031`–`conjugation-drill-q060`.
- Batch 3: `conjugation-drill-q061`–`conjugation-drill-q090`.
- Batch 4: `conjugation-drill-q091`–`conjugation-drill-q120`.
- Batch 5: `conjugation-drill-q121`–`conjugation-drill-q150` (approved extension).

## Current interaction

The user replaced typed production with a reveal flow. Both the catalog entry
and each question now use `answerMode: "reveal"`. The menu and chapter title are
exactly **Conjugation Drill**, directly after Particle Drill.

The shared quiz screen displays the Japanese sentence with one blank, its English
translation, and dictionary verb → requested form. There is no typing field before
reveal. **Check answer** immediately shows a read-only answer field and the concise
transformation rule, including verb group. There are no expandable explanation
or statistics panels. **Continue** moves on without requiring self-grading.

**Practise again later** is optional after reveal. It queues the same item after
three other reveals, or at the end if fewer remain. Each item gets at most one
queued revisit per session. Leaving/reopening resets this in-session queue.
No extra content or calendar-based spaced-repetition scheduler is generated.

A reveal is not evidence of a correct production. It does not increment overall
answer/accuracy counts or the former typed correctness statistics.
`washoku-conjugation-performance` stores additional reveal counts by family and
item, preserving any historical typed scores without changing them. The existing
lesson progress entry stores unique `attemptedIds`; the menu says “practised.”
Repeated reveals do not inflate the distinct-item numerator.

## Appendable data

Keep this as one array. Preserve prior IDs, sequence numbers, family keys and
existing content when appending a requested batch. Update the catalog's actual
`questionCount` and introduction (150 now).

Each item includes:
- Common quiz fields: `id`, `chapter`, `page`, `type`, `difficulty`, `question`,
  `answers`, `correct`, `jpExplanation`, `enExplanation`.
- `batch`: 1, 2, 3, 4 or 5; `page` is the stable item sequence number.
- `answerMode: "reveal"`; `answers: [canonicalAnswer]`, `correct: 0`.
  These are deliberately not four-choice questions.
- `sentence`: exactly one `＿＿＿` covering only the requested conjugated verb.
- `translation`; `question` combines sentence + blank line + translation.
- `verb`, `verbReading`, `verbGroup` (`group-1`, `group-2`, `irregular`).
- `form`, precise learner-facing `formLabel`, stable `conjugationFamily`.
  `masu`, `masen`, `mashita` and `masen-deshita` share family `polite`.
  `potential-negative` and `potential-negative-past` share `potential`;
  `tai-past` and `tai-negative` share `tai`; `te-ita` shares `te-iru`.
- `pattern`: specific transformation, such as `group-1-gu-te`.
- `rule`: immediately visible short transformation, not a long grammar lesson.
- `grammarPoint`: dictionary verb → form, for the existing question index.
- `acceptedAnswers`: canonical kanji/kana equivalents retained as reference
  metadata; the reveal flow does not ask for or validate input.

Before every future batch, read ALL existing questions and compare the verbs,
contexts, completed sentences and grammar frames. Avoid near-duplicates and
noun-only substitutions. Check Japanese, translation, exact blank, groups and
irregular readings manually. Validate IDs, JSON, counts, single blanks, reveal
behavior and existing multiple-choice behavior in the browser.

## Coverage strategy

The original four-batch bank targeted approximately 120 items. Original targets:
て-form 12; た-form 10; ない-form 12; ます/ません 8; potential 12; ～たい 8;
～たら 10; volitional 8; ～ば 7; passive 7; causative 6; causative-passive 4.
Remaining slots can include past negatives, ている, useful combinations and
occasional imperative/prohibitive recognition. These targets do not authorize
creating later batches early.

Batch 1 uses each of the ten core verbs three times. Batch 2 adds just two transfer
verbs, 泳ぐ and 遊ぶ, one item each, to exercise ぐ→いで and ぶ→んだ.

| Form | Batch 1 | Batch 2 | Batch 3 | Batch 4 | Batch 5 | Total |
|---|---:|---:|---:|---:|---:|---:|
| te | 5 | 3 | 2 | 2 | 7 | 19 |
| ta | 3 | 3 | 2 | 2 | 5 | 15 |
| nai | 4 | 3 | 3 | 2 | 9 | 21 |
| potential | 4 | 3 | 3 | 2 | 2 | 14 |
| masu | 2 | 1 | 1 | 1 | 0 | 5 |
| nakatta | 2 | 1 | 1 | 1 | 1 | 6 |
| tai | 2 | 2 | 2 | 2 | 1 | 9 |
| tara | 3 | 2 | 2 | 3 | 2 | 12 |
| ba | 1 | 2 | 2 | 2 | 2 | 9 |
| masen | 1 | 1 | 1 | 0 | 0 | 3 |
| volitional | 2 | 2 | 2 | 2 | 1 | 9 |
| te-iru | 1 | 1 | 0 | 1 | 0 | 3 |
| causative | 0 | 3 | 1 | 2 | 0 | 6 |
| passive | 0 | 3 | 2 | 2 | 0 | 7 |
| causative-passive | 0 | 0 | 2 | 2 | 0 | 4 |
| potential-negative | 0 | 0 | 1 | 0 | 0 | 1 |
| mashita | 0 | 0 | 1 | 0 | 0 | 1 |
| prohibitive | 0 | 0 | 1 | 0 | 0 | 1 |
| tai-past | 0 | 0 | 1 | 0 | 0 | 1 |
| potential-negative-past | 0 | 0 | 0 | 1 | 0 | 1 |
| masen-deshita | 0 | 0 | 0 | 1 | 0 | 1 |
| te-ita | 0 | 0 | 0 | 1 | 0 | 1 |
| tai-negative | 0 | 0 | 0 | 1 | 0 | 1 |
| Total | 30 | 30 | 30 | 30 | 30 | 150 |

## Reveal / Batch 2 verification

Reviewed all prior questions before creating Batch 2. Checked each new completed
sentence, intended English meaning, verb group, requested blank and exact
kanji/kana form. Closest text-similarity candidates were also reviewed manually;
they test different transformations and situations rather than noun swaps.

Browser checks passed for all 60 question reveals: no input before reveal,
read-only canonical answer afterward, immediate rule visibility, no details menus,
no false correctness/accuracy increments and no double-counting repeated clicks.
Verified optional review after three other reveals, end-of-bank review capping,
60/60 distinct-item progress, 390px mobile layout and Particle Drill regression.
No JavaScript runtime errors were observed. At that verification, the bank contained q001–q060.

## Batch 3 review

Read all 60 existing items before appending q061–q090. This batch uses all ten
core verbs, revisits 泳ぐ with potential, and introduces 死ぬ once for ぬ→んで.
Common forms remain the majority; two causative-passives, a quoted urgent
prohibition, potential negative, polite past and past desire broaden coverage.
The short causative-passive is explicitly labeled to disambiguate its full variant.
Checked completed Japanese, English, exact blanks, groups and irregular readings.
Earlier 60 records are preserved unchanged. At that point, no Batch 4 content was included.

Batch 3 validation passed: 90 unique IDs and sentences, 30 exact new kanji/kana
forms, matching catalog count, and unchanged prior 60 records. Reviewed closest
sentence-similarity pairs; shared grammar frames use different transformations
and situations. Browser checks passed for all 90 reveals, immediate explanations,
optional delayed/end-of-bank review, 90/90 distinct progress, 390px mobile layout
and Particle Drill regression, with no JavaScript runtime errors.

## Batch 4 review

The user approved a wider verb set for the fourth batch. Read all prior 90
questions before appending q091–q120. Twenty-seven items use ten new verbs:
買う, 待つ, 読む, 書く, 帰す, 開ける, 起きる, 寝る, 入る and 使う.
Three revisit 行く, 来る and 聞く with useful combinations. 入る is Group 1;
起きる is Group 2. 帰す means sending someone home, distinct from 帰る.
Short causative-passives and standard potential/causative forms are explicitly
labeled where variants exist. Reviewed Japanese, translations, exact blanks,
readings and groups; earlier 90 records remain unchanged.

The main standalone form counts now meet the original approximate targets.
Related negative/past combinations add further practice in potential, desire,
polite and ongoing-state families. The same array, family tracking and reveal
interaction are retained; no application code changes were needed.

Validation passed: independently derived all 30 kanji/kana forms; 120 unique IDs
and sentences; catalog count/order; prior 90 records preserved. Closest sentence
pairs were reviewed for meaningful differences in verb endings and context.
Browser checks passed for all 120 reveals, immediate rules, no typing or
expansion menus, optional review, 120/120 distinct progress, mobile layout and
Particle Drill regression. No JavaScript runtime errors were observed.

## Batch 5 review

User-approved extension: q121–q150 across 13 everyday verbs. Read all prior
120 questions before drafting. Three questions each use ある, できる, 分かる
and 作る; two each use いる, 切る, 着る, 出る, 言う, もらう, くれる,
なる and 入れる. Prioritize conversational forms over additional advanced forms.

ある remains Group 1 with explicitly marked exceptional negative patterns;
できる is itself Group 2, with negative/past/conditional forms categorized by
the actual transformation. 切る and 着る contrast Group 1/2 with the same reading.
入れる contrasts with previously practised 入る. Auxiliary もらう/くれる
questions blank only the target auxiliary, keeping the preceding て-form visible.

Checked natural completed sentences, intended English, blank boundaries, verb
groups and readings. Independently derived all new kanji/kana answers. Validated
150 unique IDs/sentences, five batches of 30, catalog count/order, and unchanged
prior 120 records. Existing reveal flow and progress schema require no changes.

Browser checks passed for all 150 answer reveals, immediate rules, optional
delayed/end-of-bank review, 150/150 distinct progress, 390px mobile layout and
Particle Drill regression. No JavaScript runtime errors were observed. Closest
sentence-similarity pairs were reviewed and test different verbs and contexts.
