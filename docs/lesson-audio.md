# Reviewed Nova lesson batches

Settings: `tts-1-hd`, Nova, MP3. Default generation speed is 1.0; a reviewed batch
can specify `speed` in its review file, with per-entry `speed` overrides. Batches
49–50 use 1.0 for sentence/dialogue question prompts (including cloze prompts)
and explanations, and 0.85 for standalone answer words, grammar fragments,
and combined choice lists. Reviewed hiragana inputs are unchanged.

The ordered queue is `scripts/lesson-audio-batches.json`. Existing taste and game
decks are excluded. Each remaining catalog lesson is a separate batch.

Upcoming generation prioritizes the 日本語で話す category. Completed batches
1–48 retain their history; batches 49–60 cover its remaining decks, starting with
`useful-conversation-chunks` (会話で使えるフレーズ), followed by the grammar,
particle, conjugation, mimetic, everyday conversation, standard/spoken,
adjective, and adverb decks. Remaining food lessons follow in batches 61–83.
Review every speech key and its exact hiragana input before generating each batch.

Before rendering a batch, export its live speech keys:

```sh
osascript -l JavaScript scripts/export-lesson-audio.js "$PWD" page01-02
```

Check source furigana and kanji readings, and particle pronunciation in context.
Save an explicit mapping of every key to the reviewed hiragana input in
`scripts/lesson-audio-reviews/<lesson-id>.json`. Keep lexical は intact.
Mixed-language prompts need Japanese-only speech inputs; display text stays intact.
Then generate with:

```sh
python3 scripts/generate-lesson-audio.py --lesson page01-02
```

Generation refuses missing, incomplete, or stale key coverage and inputs containing
kanji, katakana, or Latin letters before reading the API key or making requests.
The generator reuses existing matching clips and resumes interrupted batches.
The key source is the same external private file/environment as the other decks.
Use `--retry-key <exact-key>` to regenerate a reported faulty recording.

Publish `audio/lessons/`, `lesson-audio-manifest.js`, `index.html`, and `app.js`
together. The app looks up recordings only within the selected reviewed lesson.
Existing audio controls still pause/resume and cancel on navigation.

Batch 1: `page01-02`, 味・香り・食感, 80 cards, 271 reviewed speech keys, 270 recordings.
Individual answer clips play sequentially in displayed order after shuffling.
Batch 2: `page03-04`, 調理の基本動詞, 40 cards, 159 reviewed speech keys and recordings.
Batch 3: `page05`, 調理器具, 32 cards, 144 reviewed speech keys and recordings.
Batch 4: `page06`, 焼き加減, 20 cards, 98 reviewed speech keys and recordings.
Batch 49: `useful-conversation-chunks`, 会話で使えるフレーズ, 210 cards,
936 reviewed speech keys and recordings: 418 at speed 1.0 and 518 at 0.85. Reading review
includes contextual particles, preserved lexical は, katakana long vowels,
spoken A/B placeholders, and the seasonal 盛り reading さかり.
Batch 50: `golden-grammar`, Grammar Drill, 189 cards, 1,028 reviewed speech keys
and 1,027 recordings: 377 at speed 1.0 and 650 at 0.85. The input review corrects
気に入る to きにいる, grammar terms to ますけい and たけい, and unconverted
間に and 嫌い to あいだに and きらい, with contextual particle checks.
Batch 51: `particle-drill`, Particle Drill, 80 cards, 266 reviewed speech keys
and recordings: 160 sentence/dialogue and explanation clips at speed 1.0,
and 106 particle/short-choice clips at 0.85. The review preserves lexical は
and checks particle combinations such as へは → えわ and をは → おわ.
Batch 52: `conjugation-drill`, Conjugation Drill, 150 cards, 445 reviewed speech keys
and recordings: 150 sentence/cloze prompts at speed 1.0, and 295 standalone
forms or short conjugation pairs at 0.85. The review corrects 話させる to
はなさせる and 来させる to こさせる, verifies all answer inputs against the
deck's accepted hiragana forms, and preserves lexical は and へ.
Batch 53: `mimetic-words`, Mimetic Words, 41 cards, 150 reviewed speech keys
and recordings: 82 sentence/cloze and explanation clips at speed 1.0, and
68 standalone mimetic words or short choice groups at 0.85. The review checks
particles in context, preserves lexical はっきり, はっと, はっこう, はなす,
はいる, へや and へいてん, and uses ひとばん for overnight 一晩.
Batch 54: `real-conversation-400-1`, 会話でよく使う言葉 ①, 100 cards,
418 reviewed speech keys and recordings: 199 sentence/cloze and explanation
clips at speed 1.0, and 219 vocabulary or short-choice clips at 0.85. The review
corrects explanation readings 外国人 to がいこくじん and 道 to みち using
the accepted vocabulary readings, with contextual particle checks.
Batch 55: `real-conversation-400-2`, 会話でよく使う言葉 ②, 100 cards,
451 reviewed speech keys and 450 recordings: 200 sentence/cloze and explanation
clips at speed 1.0, and 250 vocabulary or short-choice clips at 0.85. The review
supplies かんじ for three exported keys containing 感じ, preserves lexical は
in 支払い, 発音 and 発表, and checks all particles in context.
Batch 56: `real-conversation-400-3`, 会話でよく使う言葉 ③, 100 cards,
442 reviewed speech keys and recordings: 199 sentence/cloze and explanation
clips at speed 1.0, and 243 vocabulary or short-choice clips at 0.85. The review
uses わいふぁい for Wi-Fi, checks contextual particles, and preserves lexical
ごはん, はんぶん, はいれる, はっぴょう and はんだん.
Batch 57: `real-conversation-400-4`, 会話でよく使う言葉 ④, 100 cards,
502 reviewed speech keys and recordings: 200 sentence/cloze and explanation
clips at speed 1.0, and 302 vocabulary or short-choice clips at 0.85. The review
corrects 社会人 to しゃかいじん and 人手不足 to ひとでぶそく in explanations
using the accepted vocabulary readings, with contextual particle checks.
Batch 58: `standard-vs-spoken`, Standard vs Spoken, 120 cards, 709 reviewed
speech keys and recordings: 411 sentence, explanation or complete reply clips
at speed 1.0, and 298 vocabulary, short verb form or grammar-fragment clips
at 0.85. Combined choices containing complete replies use 1.0. The review
preserves spoken contractions and checks particles without changing lexical kana.
Batch 59: `adjectives`, 形容詞, 64 cards, 348 reviewed speech keys and recordings:
143 sentence/explanation or complete answer clips at speed 1.0, and 205 adjective
or short-form clips at 0.85. Residual kanji readings are supplied explicitly;
the review corrects おちついています, せかいじゅう, ひとでした and いっしゅう.
Batch 60: `adverbs`, 副詞, 56 cards, 238 reviewed speech keys and recordings:
112 sentence/explanation clips at speed 1.0, and 126 adverb/short-choice clips
at 0.85. The review corrects 三十人 to さんじゅうにん, contextual 入れない
to はいれない, and the duplicated 菜の花 speech input to なのはな.
All prioritized 日本語で話す batches are now generated.
Batch 61: `page38`, 塩麹・醤油麹, 20 cards, 115 reviewed speech keys and
recordings: 77 sentence/explanation or procedural-answer clips at speed 1.0,
and 38 vocabulary/short-fragment clips at 0.85. Quantities and ranges use
explicit hiragana readings; lexical は and contextual particles are reviewed.
Batch 62: `page28-29-culinary`, 発酵と料理, 20 cards, 129 reviewed speech
keys and recordings: 85 sentence/explanation or complete-answer clips at speed
1.0, and 44 vocabulary/short-group clips at 0.85. The review explicitly reads
pH as ぴーえいち and preserves lexical はっこう, はたらき and はんのう.
Batch 63: `page52`, 火入れ, 30 cards, 120 reviewed speech keys and recordings:
73 sentence/explanation clips at speed 1.0 and 47 vocabulary/short phrases
at 0.85. The review corrects とろ火 to とろび, removes trailing English from
one input, and preserves lexical はごたえ and はなして.
Batch 64: `page68`, 料理の失敗と改善, 20 cards, 140 reviewed speech keys and
recordings, all at speed 1.0: sentences, explanations and complete procedural
answers. Contextual particle checks preserve lexical はいき, はんだん,
はなします and へらす.
Batch 65: `page69`, 評価の言葉, 60 cards, 269 reviewed speech keys and
recordings: 191 sentence/explanation, combined-choice and complete-suggestion
clips at speed 1.0; 78 short evaluation/paired-phrase clips at 0.85.
The review corrects 平面的 to へいめんてき, explicitly reads A/B as
えー/びー, and preserves lexical はぎれ, はごたえ and はっこう.
Batch 66: `page70-71`, 食に関わる人, 100 cards, 391 reviewed speech keys and
391 generated recordings: 200 sentence/question/explanation inputs at speed 1.0
and 191 role-name/short vocabulary-choice inputs at 0.85. The review corrects
和菓子職人 to わがししょくにん and 竹細工職人 to たけざいくしょくにん,
checks contextual particles, preserves lexical kana and loanword long vowels,
and reads A/B/C explicitly. Recording files and input/speed hashes verified;
listening verification has not been performed.
Batch 67: `page72`, 肉の基礎知識, 40 cards, 227 reviewed speech keys and
227 generated recordings: 158 sentence/explanation, complete-answer and
procedural inputs at speed 1.0; 69 vocabulary/very short phrase inputs at 0.85.
The review restores しもふり in three explanations, checks 歯へ as はえ,
preserves lexical kana and explicit source 肉汁 readings, and supplies
hiragana loanwords, A/B and page-number readings. All recording files and
input/speed hashes have been verified; listening verification has not been performed.
Next batch to generate: `page73` (batch 68).

Reading checks are not a certification of audible pitch accent or articulation.
