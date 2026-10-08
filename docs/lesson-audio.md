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
Batch 68: `page73`, 鶏の部位, 20 cards, 75 reviewed speech keys and
75 generated recordings: 24 question/explanation inputs at speed 1.0 and
51 vocabulary/short-group inputs at 0.85. Readings checked against lesson
furigana, preserving lexical はつ/はつもと and loanword long vowels.
Mixed English glosses use Japanese-only speech; display and lookup keys stay intact.
Recording files and reviewed input/speed hashes verified; no listening verification.
Batch 69: `page74`, 鶏について, 20 cards, 124 reviewed speech keys and
124 generated recordings: 90 sentence/explanation or reasoned-answer inputs
at speed 1.0 and 34 vocabulary/short-group inputs at 0.85. The review resolves
duplicated 平飼い/放し飼い readings and residual 脂のり/強い, corrects
銘柄鶏 and 世界中, and verifies ケージ飼い as けーじがい against a
poultry terminology reading source. Contextual particles and lexical kana checked.
Recording files and reviewed input/speed hashes verified; no listening verification.
Batch 70: `page75`, 卵の部位, 7 cards, 23 reviewed speech keys and
23 generated recordings: 9 question/explanation inputs at speed 1.0 and
14 vocabulary/short-group inputs at 0.85. All egg-part names checked against
lesson furigana; contextual particles preserve lexical はし and read 気室側へ
as きしつがわえ. Recording files and reviewed input/speed hashes verified;
no listening verification performed.
Batch 71: `page75-about-eggs`, 卵について, 20 cards, 127 reviewed speech keys
and 125 generated recordings: 95 sentence/explanation inputs at speed 1.0
and 32 vocabulary/short-fragment inputs at 0.85 (30 distinct recordings).
The review resolves duplicated 放し飼い, supplies cooking-term readings,
corrects contextual 何を to なにお, and checks particles while preserving
lexical kana and loanword long vowels. Recording files and reviewed input/speed
hashes verified; no listening verification performed.
Batch 72: `page76`, 牛の部位, 16 cards, 62 reviewed speech keys and
62 generated recordings: 17 question/explanation clips at speed 1.0 and
45 cut-name/short vocabulary-group clips at 0.85. Readings checked against
lesson furigana, including anatomy terms and long vowels in cut names.
Contextual particles reviewed while preserving lexical はらみ/はらがわ.
Recording files and reviewed input/speed hashes verified; no listening verification.
Batch 73: `page76-organs-others`, 牛の内臓・その他, 24 cards, 168 reviewed
speech keys and recordings: 139 sentence/definition/explanation inputs at
speed 1.0 and 29 vocabulary/very short noun-fragment inputs at 0.85.
Organ names, cooking terminology and cattle names checked against lesson
furigana; corrected 四つ to よっつ and 一歳 to いっさい. Residual English
glosses removed from speech, with explanatory cow/bull read as かう/ぶる.
Contextual particles and lexical kana checked; recording files and reviewed
input/speed hashes verified. No listening verification performed.
Batch 74: `page77`, 牛について, 20 cards, 127 reviewed speech keys and
127 recordings: 90 sentence/explanation inputs at speed 1.0 and 37
vocabulary/short noun-fragment inputs at 0.85. Readings checked against
lesson vocabulary/furigana, restoring 霜降り to しもふり, removing duplicated
ホルモン, and correcting contextual 何を to なにお. Topic/directional/object
particles checked while preserving lexical kana and loanword long vowels.
Recording files and reviewed input/speed hashes verified; no listening verification.
Batch 75: `page78`, 魚の外部構造, 16 cards, 57 reviewed speech keys and
recordings: 20 question/explanation inputs at speed 1.0 and 37 anatomy-name
and short vocabulary-group inputs at 0.85. Readings checked against lesson
furigana, correcting 一対 to いっつい and supplying fin names and 血合い.
Embedded English terminology uses reviewed hiragana approximations; operculum
pronunciation checked against https://www.dictionary.com/browse/operculum.
Contextual particles preserve lexical はら/はいそく/はしる. Recording files
and reviewed input/speed hashes verified; no listening verification performed.
Batch 76: `page79`, 魚の内部, 11 cards, 44 reviewed speech keys and
recordings: 21 question/explanation inputs at speed 1.0 and 23 anatomy-name
and short vocabulary-group inputs at 0.85. Readings checked against lesson
furigana, supplying 血合い as ちあい and correcting contextual オレンジ色
to おれんじいろ. Embedded fish frame uses ふぃっしゅ ふれーむ.
Contextual particles and lexical kana checked. Recording files and reviewed
input/speed hashes verified; no listening verification performed.
Batch 77: `page79-three-piece`, 三枚おろし, 5 cards, 21 reviewed speech
keys and recordings: 9 question/explanation inputs at speed 1.0 and 12
vocabulary/short vocabulary-group inputs at 0.85. All fillet/anatomy names
checked against lesson furigana; contextual particles preserve lexical
はらみ/はらがわ and loanword long vowels. Recording files and reviewed
input/speed hashes verified; no listening verification performed.
Batch 78: `page82-three-piece-2`, 三枚おろし II, 40 cards, 264 reviewed speech
keys and 263 recordings: 166 sentence/explanation or extended-action inputs at
speed 1.0 and 98 vocabulary/very short fragment/group inputs at 0.85.
Readings checked against lesson furigana and catalog vocabulary, resolving
duplicated 切り身/浮き袋 and residual anatomy kanji. Corrected 骨際 to
ほねぎわ, 一晩 to ひとばん, and 一切れずつ to ひときれずつ.
Contextual particles preserve lexical kana, including はらみ/はいそく/はさき
and びへい. Recording files and reviewed input/speed hashes verified;
no listening verification performed.
Batch 79: `page80-about-fish`, 魚について, 32 cards, 187 reviewed speech
keys and 186 recordings: 109 sentence/explanation or extended-answer inputs
at speed 1.0 and 78 vocabulary/very short phrase/group inputs at 0.85.
Readings checked against lesson vocabulary/furigana, resolving residual kanji
and duplicate cooking-name readings. Corrected いけじめ/しんけいじめ/
こんぶじめ, 即殺 そくさつ, miso 床 とこ, 甘辛い あまからい,
品がある ひんがある and contextual 何が なにが. Contextual particles
preserve lexical はり/はらみ/はさみ and へこんだ/へんしょく.
Recording files and reviewed input/speed hashes verified; no listening verification.
Batch 80: `page81-tuna`, まぐろについて, 20 cards, 103 reviewed speech
keys and recordings: 47 sentence/explanation inputs at speed 1.0 and 56
vocabulary/very short noun-fragment/group inputs at 0.85. Tuna cut names
checked against lesson vocabulary/furigana, resolving duplicated 分かれ身
and ヒレ上 and residual kanji. Corrected contextual 何を to なにお and
positional 上手側 to かみてがわ. Contextual particles preserve lexical
はらぶし/はいそく/はらいちばん and しゅうへん; loanword long vowels retained.
Recording files and reviewed input/speed hashes verified; no listening verification.
Batch 81: `page83`, 豚肉の部位, 22 cards, 86 reviewed speech keys and
85 recordings: 29 question/explanation inputs at speed 1.0 and 57 vocabulary
or short vocabulary-group inputs at 0.85. Readings checked against lesson
furigana, including 鞍下 くらした and 背脂 せあぶら. Preserved distinct
ぶたとろ/とんとろ readings and lookup keys. Contextual particles reviewed,
lexical はらがわ and loanword long vowels retained. Recording files and
reviewed input/speed hashes verified; no listening verification performed.
Batch 82: `page83-pork-organs`, 豚の内臓・ホルモン, 19 cards, 132 reviewed
speech keys and recordings: 113 extended answer-description/list and explanation
inputs at speed 1.0 and 19 standalone organ-name inputs at 0.85. Readings
checked against lesson vocabulary/furigana, correcting 横隔膜 to おうかくまく
and 昆布締め to こんぶじめ. Removed residual English Fat from speech while
preserving the key. Contextual particles checked, preserving lexical
はな/はい/はらみ/はぎれ/はごたえ and loanword long vowels. Recording files
and reviewed input/speed hashes verified; no listening verification performed.
Batch 83: `page84-about-pork`, 豚について, 20 cards, 131 reviewed speech
keys and 130 recordings: 100 sentence/explanation or extended-answer inputs
at speed 1.0 and 31 vocabulary/very short phrase/group inputs at 0.85.
Readings checked against lesson vocabulary/furigana, restoring しもふり,
correcting 四つ to よっつ and contextual 何を to なにお, and resolving
duplicated SPF reading. English expansion uses a reviewed hiragana approximation.
Contextual particles preserve lexical はし/はごたえ/はいって and こうはい;
loanword long vowels retained. Recording files and reviewed input/speed hashes
verified; no listening verification performed.
All 83 batches in the current queue are marked generated.

Reading checks are not a certification of audible pitch accent or articulation.

## Knife-making cards

`knife-making-steps` uses Marin (`gpt-4o-mini-tts`) at speed 1.0, as requested. Generate with `python3 scripts/generate-lesson-audio.py --lesson knife-making-steps`. The reviewed hiragana inputs and dictionary accent targets are in `scripts/lesson-audio-reviews/knife-making-steps.json`. Specialist compounds without an exact dictionary entry remain provisional; none of these recordings has been marked listening-verified. The twelve numbered cards and unnumbered 完成！ card retain source order.

`knife-forms-cards` contains 25 illustrated flashcards in source order, with the knife name as vocabulary and the correct source answer as the function sentence. Its 50 Marin clips use the reviewed name/function readings from the original knife quiz. Regenerate with `python3 scripts/generate-lesson-audio.py --lesson knife-forms-cards`. Individual SVGs are extracted by `scripts/export-knife-card-illustrations.py` (requires `svgpathtools`); the files contain only the selected knife artwork and omit numeric labels.

Batch 86: `chicken-parts-cards`, 鶏カード, 22 individual part cards derived from
`page73`, with 22 Marin vocabulary recordings at 1.0 and 17 unique answer
explanations at 1.0. Reuses `assets/chicken_parts.svg` with distinct highlighted
fragment URLs. The review records seven dictionary-backed pitch targets, four
metaphorical-name candidates, and eleven specialty names without a reliable exact
pitch entry; unconfirmed targets are not forced. No listening verification is
claimed. The new ハラミ card corrects the source description to abdominal-wall
muscle, with the reference recorded in its review file.

Batch 87: `beef-parts-cards`, 牛カード, 23 individual parts from `page76`,
with 23 Marin vocabulary clips at 1.0 and 16 answer-explanation clips at 1.0.
Reuses the highlighted `assets/cow_4.svg` regions, directly below 牛の部位.
Ten vocabulary pitch targets match dictionary readings; thirteen specialist or
ambiguous names remain unconfirmed and are not forced.

Batch 88: `pork-parts-cards`, 豚カード, 25 individual parts from `page83`,
with 25 Marin vocabulary clips at 1.0 and 22 answer-explanation clips at 1.0.
Reuses the highlighted `assets/pig-106.svg` regions, directly below 豚肉の部位.
Seventeen vocabulary pitch targets match dictionary readings; eight remain
unconfirmed and are not forced. 豚トロ uses とんとろ, matching the source
explanation and the producer reading linked in the review, while preserving
the display label. Both decks retain the chicken deck's compact layout and
240px illustration setting. No audible pitch/listening verification is claimed.

Animal-card vocabulary uses normal Marin generation speed 1.0 at the user’s
request, following reported buzzing in the 0.85 recordings. Explanations stay
at 1.0; playback speed is unchanged.

Batch 89: `fish-cards`, 魚カード, combines 魚の外部構造 (`page78`),
魚の内部 (`page79`), and 三枚おろし (`page79-three-piece`) into 33
ordered cards directly below 三枚おろし. Thirty unique vocabulary clips
and 32 description clips use Marin at normal generation speed 1.0. Original
fish SVGs and alternate views are preserved, using distinct highlight URLs.
New-card annotations correct 一対 to いっつい, retain 左右 as さゆう
in 左右一対, and read オレンジ色 as おれんじいろ. All hiragana inputs
and contextual particles were reviewed against the source batches. Twenty-two
vocabulary pitch targets match dictionary readings, with variants recorded;
eight specialty fish terms have no reliable exact pitch entry and are not
forced. Non-fish homonyms are excluded. No audible listening/pitch verification
is claimed. The compact layout and 240px illustration setting match 鶏カード.

Batch 90: `grammar-cards`, 文法カード, adds 189 flashcards beside Grammar
Drill in 日本語で話す. Each preserves its source question ID, grammar meaning
and formation, with a completed formal/polite example and a casual example.
Polite counterparts are supplied for casual source sentences; the blunt な
command is quoted inside a polite sentence and explained on the card.
Grammar headings autoplay once; both sentences have replay controls, and
formation is silent. All 557 unique speech keys use Marin at generation
speed 1.0, explicitly requested for grammar headings as well as sentences.
Reviewed inputs are in `scripts/lesson-audio-reviews/grammar-cards.json`.
Annotations correct 日本人 to にほんじん, 今日中 to きょうじゅう,
話そう to はなそう, and 間に to あいだに. Contextual particles are
reviewed separately from display labels and audio lookup keys. Audio generation
and complete file coverage are verified; no audible pitch/listening verification
is claimed. `tests/grammar-cards-browser.html` checks all 189 cards, autoplay,
378 sentence controls, silent formation, phone layout and playback cleanup.

Batch 91: `families-of-doom` adds 70 word families and 828 questions to
日本語で話す, with three questions per word. The approved 戻る / 戻す /
帰る / 返す family remains first. Each family shuffles its questions and advances
only when the next-question button is pressed. One hundred eighty-seven questions accept an
additional natural answer and reveal the matching conjugated sentence.
The meaning popup explains overlapping usage; register cues distinguish formal
and casual choices where appropriate. The clothing example uses 替える rather
than 着替える so the conjugated answer matches its button.

All 1,022 distinct completed-sentence keys have Marin recordings at generation
speed 1.0, including accepted-answer variants. Exact hiragana and contextual
particle readings are recorded in
`scripts/lesson-audio-reviews/families-of-doom.json`; display text stays separate.
Audio file coverage is verified; no audible pitch/listening verification is
claimed. `tests/families-of-doom-browser.html` checks all families and questions,
accepted alternatives, replay controls, manual progression, family navigation,
furigana, and fixed card height at normal and narrow phone widths.

The second supplied set adds 22 grammar families, with 264 questions. Ongoing
ようにしてる accepts both ようにする and ようにしている; other natural
overlaps have completed-sentence variants and usage notes. A few source examples
are aligned to their intended category: 見てばかりいないで and してばかりいる
for ばかりいる, 電話するところ for the action about to start, and
予定が急に変わることがある for occasional occurrence. Numerals are displayed
as 九時, 十時, and 三十分 with reviewed readings. Context-dependent readings
include 来ない／来なく (こ), 着いた (つ), 着てる (き), 入れて (い),
遅く (おそ), 急に (きゅう), and 話す／話せる (はな).
The recency distinction was checked against the Japan Foundation's
[ところ teaching notes](https://www.kyozai.jpf.go.jp/kyozai/material/BMA00036/ja/render.do).


The third supplied set adds 28 families and 330 questions, including five
families for giving, receiving, desired favors, respectful/humble forms, and
requests. Two families have three words and nine questions; the other 26 have
four words and twelve questions. English cues preserve the intended meaning or
register; natural overlapping answers have conjugated sentence variants.
The 頼む example uses 頼んで instead of お願いして to match its answer button.
Existing questions and reviewed speech inputs are preserved. Repeated sentence
keys reuse their existing recordings.

Additional reading checks include 出汁 (だし), 鰹節 (かつおぶし), 生姜
(しょうが), 柚子 (ゆず), 揉む (もむ), 十分 as a duration (じゅっぷん),
百七十度 (ひゃくななじゅうど), 思い出せない (おもいだせない),
verb-方 (かた), 上から (うえから), 混む (こむ), 間に合う (まにあう),
and 笑った (わらった). Particle は is reviewed separately from lexical kana.
Giving/receiving usage was checked against the Japan Foundation's
[giving and receiving notes](https://www.jpf.go.jp/j/project/japanese/teach/tsushin/grammar/201409.html)
and [respectful and humble forms](https://www.kyozai.jpf.go.jp/kyozai/material/BMA00094/ja/render.do).
No audible listening or pitch-accent verification is claimed.

The new learning family uses a 2px smaller gap at widths up to 360px so its
longest example fits the 540px card with furigana shown. Font sizes match all
other families; canonical and accepted-answer sentences are checked separately.


Grammar Drill and 文法カード now each contain 221 entries after a
[45-expression conversational coverage audit](conversational-grammar-audit.md).
Thirteen expressions already had teaching coverage; 32 dedicated entries were
added to each deck. Grammar Drill has 1,212 speech keys and 1,211 Nova clips;
文法カード has 652 Marin clips. New drill prompts and explanations use speed
1.0, while answer fragments and choice lists use 0.85. Flashcard headings and
formal/casual samples remain Marin 1.0, and formation stays silent.
`tests/conversational-grammar-browser.html` checks all 221 drill questions and
new audio controls; `tests/grammar-cards-browser.html` checks all 221 flashcards
and 442 sample speakers. Audio file coverage is verified; no audible listening
or pitch verification is claimed.

`knife-structure-cards` begins 包丁の形・構造・素材カード with one numbered reading card, 刃の部分 (Parts of the Blade), containing all 17 terms from the supplied master deck. It uses the same reference-card renderer as 味・香り・食感カード, with furigana, English meanings, and separate term speakers. It sits immediately after the knife-making steps. The 18 Marin clips (heading plus terms) use reviewed hiragana at generation speed 1.0, as requested. Dictionary accent targets are recorded for exact matches; specialist terms without matches remain unconfirmed. Lexical は is retained and マチ is spoken まち. Regenerate with `python3 scripts/generate-lesson-audio.py --lesson knife-structure-cards`. Audible pitch accent has not been listening-verified. The existing knife-type deck is labelled 包丁種類カード.

Page 2 of `knife-structure-cards`, 刃の形 (Blade Shape), adds 14 vocabulary terms in the same two-column reading-card layout. Its 15 new clips use Marin at generation speed 1.0. Seven vocabulary accent targets match the pinned dictionary; the heading, 刃形, 切付型, 刃幅, and four longer phrases use provisional pronunciation with the user’s explicit authorization on 2026-10-06. The review file preserves sources and distinguishes provisional entries; none is listening-verified.

Page 3, 厚さ・テーパー (Thickness & Taper), adds 11 terms in two columns and 12 Marin clips at generation speed 1.0. Seven terms have dictionary accent targets; the heading, 刃厚, 峰厚, ディスタルテーパー, and 先端が薄い use provisional targets explicitly authorized by the user on 2026-10-06. Hiragana preserves lexical は, long vowels, and でぃ. No audible verification is claimed. The deck now contains three pages and 45 recorded speech keys.

For 刃厚 only, the user explicitly requested kanji input after rejecting hiragana-input takes. Its review entry retains key はあつ, reviewed hiragana はあつ, user-provided L-H-H pitch guidance, and a documented kanji-input authorization. The generator permits this explicit Marin exception while retaining the default hiragana validation. No audible verification is claimed.

Page 4, 刃付け (Edge Geometry), adds 16 terms in two columns; its heading reuses はつけ. All new recordings use Marin at generation speed 1.0 with reviewed hiragana. 両刃 and 片刃 have exact dictionary pitch targets; the remaining fourteen entries use provisional targets explicitly authorized by the user on 2026-10-06. Source readings preserve こばづけ and lexical は. No audible verification is claimed. The deck now has four pages and 61 recorded speech keys.

Page 5, 片刃の構造 (Single-Bevel Structure), contains seven terms in two columns. Six recordings reuse existing reviewed keys; 表（おもて） adds a dictionary type-3 target, and the heading uses component guidance with provisional whole-phrase intonation explicitly authorized by the user on 2026-10-06. Both new clips use Marin at generation speed 1.0. No audible verification is claimed. The deck now has five pages and 63 recorded speech keys.

Page 6, 柄と構造 (Handle & Construction), contains 12 terms in two columns and reuses 中子 audio. Twelve new clips including the heading use Marin at generation speed 1.0 with reviewed hiragana. 柄（え）, 口金, and リベット have dictionary pitch targets; the heading and eight other terms use provisional guidance explicitly authorized by the user on 2026-10-06. D型ハンドル is spoken でぃーがたはんどる. No audible verification is claimed. The deck now has six pages and 75 recorded speech keys.

Page 7, 鋼材の基本 (Basic Steel Materials), contains eight materials with seven bilingual property explanations in the two-column layout. Each explanation has its own speaker; exporter coverage includes nested explanation speech. Sixteen new clips use Marin at generation speed 1.0 with reviewed contextual hiragana. Four vocabulary terms have dictionary targets; other terms, heading and explanation intonation are provisional with explicit user authorization on 2026-10-06. Object を is spoken お and clause pauses preserve particle grouping. No audible verification is claimed. The deck now has seven pages and 91 recorded speech keys.

Page 8, 炭素鋼の種類 (Carbon Steels), contains nine steel names and three bilingual explanations in two columns. Thirteen new Marin clips use generation speed 1.0 and reviewed contextual hiragana. White Steel is しろがみ, not はくし; grade numbers retain ごう, and スーパー retains both long vowels. All new targets are provisional with explicit user authorization on 2026-10-06; no listening verification is claimed. The deck now has eight pages and 104 recorded speech keys.

Page 9, ステンレス・高性能鋼 (Stainless & High-Performance Steels), contains eleven terms and four bilingual explanations in two columns. 粉末鋼 reuses existing audio; fifteen new clips use Marin at generation speed 1.0. Alloy codes use Japanese letter names and numeric values with explicit user authorization; no trade-name alias reading is asserted. モリブデン鋼 has a dictionary target; other new targets remain provisional as authorized on 2026-10-06. The ordinary 銀紙 silver-paper accent was not assumed for its steel-grade sense. No audible verification is claimed. The deck now has nine pages and 119 recorded speech keys.

Page 10, 鋼の成分 (Steel Components), contains eight element names in two columns, all with exact dictionary pitch targets and reviewed hiragana. Nine new clips use Marin at generation speed 1.0. The heading はがねのせいぶん uses component guidance and provisional phrase intonation explicitly authorized on 2026-10-06. No audible verification is claimed. The deck now has ten pages and 128 recorded speech keys.

Page 11, 鋼の性質 (Steel Properties), contains sixteen terms in two columns. Seventeen new clips use Marin at generation speed 1.0 with reviewed contextual hiragana. 硬度, 靭性, 脆い, and 切れ味 have dictionary pitch targets; the other twelve terms and heading use provisional guidance explicitly authorized by the user on 2026-10-06. HRC is read えいちあーるしー. No audible verification is claimed. The deck now has eleven pages and 145 recorded speech keys.

Page 12, 合わせ・積層構造 (Laminated Construction), contains thirteen terms and three bilingual explanations in two columns. Seventeen new clips use Marin at generation speed 1.0 with reviewed contextual hiragana. Five terms have exact dictionary pitch targets; the remaining eight terms, heading, and explanations use provisional intonation explicitly authorized on 2026-10-06. Object を is spoken お and lexical は is preserved. No audible verification is claimed. The deck now has twelve pages and 162 recorded speech keys.

Page 13, ダマスカス・積層模様 (Damascus & Layer Patterns), contains seven terms in two columns. Eight new clips use Marin at generation speed 1.0 with reviewed hiragana. 模様 has a dictionary pitch target; the remaining six terms and heading use provisional intonation explicitly authorized on 2026-10-06. Long vowels in こう, そう, and もよう are preserved. No audible verification is claimed. The deck now has thirteen pages and 170 recorded speech keys.

Page 14, 表面仕上げ (Blade Finishes), contains ten terms in two columns. Eleven new clips use Marin at generation speed 1.0 with reviewed hiragana. 仕上げ, 磨き, 梨地, and 霞 have exact dictionary pitch targets; other terms and heading use provisional intonation under the standing AGENTS.md authorization. Lexical へ in へあらいん is preserved. No audible verification is claimed. The deck now has fourteen pages and 181 recorded speech keys.

Page 15, 柄の素材 (Handle Materials), contains fourteen vocabulary/group entries and seven bilingual explanations in two columns, preserving supplied source order and group labels. Twenty-two new clips use Marin at generation speed 1.0 with reviewed contextual hiragana. Nine individual terms have exact dictionary targets; remaining entries use provisional intonation under standing authorization. 朴 is ほお in magnolia context, 水牛角 is すいぎゅうづの, and 柄 is え. Object を is spoken お; lexical へ in へんけい is retained. Guidance requests fluent whole words rather than syllable recitation. No audible verification is claimed. The deck now has fifteen pages and 203 recorded speech keys.

Page 16, その他の素材 (Other Materials), contains six terms and two bilingual explanations in two columns. Nine new clips use Marin at generation speed 1.0 with reviewed hiragana. Five terms have exact dictionary pitch targets; 研磨剤, heading, and explanation intonation remain provisional under standing authorization. Long vowels and the doubled consonant in せっちゃくざい are preserved. No audible verification is claimed. The deck now has sixteen pages and 212 recorded speech keys.

Page 17, 錆・変色 (Rust & Patina), contains ten terms in two columns. Eleven new clips use Marin at generation speed 1.0 with reviewed contextual hiragana. Five terms have exact dictionary pitch targets; other entries use provisional intonation under standing authorization. パティナ is ぱてぃな; lexical へ in へんしょく is retained, while object を in 錆を落とす is spoken お. No audible verification is claimed. The deck now has seventeen pages and 223 recorded speech keys.

Page 18, 刃の状態 (Edge Condition), contains ten terms in two columns. Eleven new clips use Marin at generation speed 1.0 with reviewed contextual hiragana. Five terms have exact dictionary pitch targets; other entries use provisional intonation under standing authorization. 鈍い/鈍る are にぶい/にぶる in the edge context, and lexical 刃 は is preserved. Guidance requests connected phrases without internal breaks. No audible verification is claimed. The deck now has eighteen pages and 234 recorded speech keys.

Page 19, 重さ・バランス (Weight & Balance), contains ten terms in two columns. Eleven new clips use Marin at generation speed 1.0 with reviewed contextual hiragana. Six terms have dictionary pitch targets; remaining phrases and heading use provisional intonation under standing authorization. 重量 is じゅうりょう, 重心 is じゅうしん, and 後ろ is うしろ. Guidance requests connected phrases without internal breaks. No audible verification is claimed. The deck now has nineteen pages and 245 recorded speech keys.

Page 20, 寸法 (Measurements), contains eight terms in two columns. Seven vocabulary clips reuse existing reviewed keys, retaining the user-supplied pitch and authorized kanji-input recording for 刃厚. The two new clips, heading 寸法 and vocabulary 角度, use Marin at generation speed 1.0 with exact dictionary pitch targets. No audible verification is claimed. The deck now has twenty pages and 247 recorded speech keys.

Page 21, 包丁を比較する言葉 (Comparing Knives), completes the supplied master deck with seventeen terms in two columns. Five clips are reused; thirteen new clips use Marin at generation speed 1.0 with reviewed contextual hiragana. Eight new vocabulary terms have exact dictionary pitch targets; other new phrases and heading use provisional intonation under standing authorization. Lexical は in はばひろい is retained and heading object を is spoken お. No audible verification is claimed. The complete deck now has 21 pages and 260 recorded speech keys.

The 80-point grammar coverage audit adds 54 cards (222–275) to 文法カード: 48 missing points plus dedicated さえあれば, emphatic まで, にしか～ない, discovery/result たところ, ずに済む, and ても仕方がない. Every card has formation notes and polite/plain examples using daily-life situations; five formal constructions label their second example as plain form with formal wording. All 221 original cards remain unchanged. Explicit speech inputs review contextual は/を, lexical kana, and complete-clause pauses; no pauses are inserted immediately before particles. New clips use Marin at generation speed 1.0 and standing provisional-intonation authorization. Formation remains silent. Actual audible pitch/pause quality is not listening-verified. The deck now contains 275 cards and 812 recorded speech keys.

活用カード (`conjugation-cards`) now has 138 recorded sample sentences across its eight conjugation/reference cards. Its exporter includes section-row examples only: headings, conjugated forms, formations, word lists, and the connection-guide fragments remain silent. Inputs are manually reviewed hiragana with context-specific particle pronunciations and speech-only pauses after complete phrases/clauses. 来る readings vary with the conjugation; lexical 刃 は and はなした are preserved. All clips use Marin (`gpt-4o-mini-tts`) at generation speed 1.0 and natural provisional sentence intonation under standing authorization. Speaker controls appear beside every sample; navigation does not autoplay. No audible pitch or pause verification is claimed.

数え方カード (`counting-cards`) starts with page 1, 数字: sixty number/variant rows in eight groups, two short sample sentences and the 101 building example, plus heading audio. Its 64 Marin clips use generation speed 1.0 with reviewed hiragana. Irregular hundreds/thousands are highlighted; contextual し/しち/く alternatives are separate. Speech-only lookup keys retain display labels separately; 番号は is spoken ばんごうわ. Exact dictionary pitch targets are supplied where matched, provisional natural intonation elsewhere under standing authorization. No audible listening verification is claimed.

Page 2, 日付 (Dates), adds all 31 calendar days, 何日 and five examples. Readings follow the Japan Foundation Irodori date chart; 17/27 use しち, 19/29 use く, and 14/20/24 retain irregular forms. Date/duration distinctions are explained. Thirty-eight new Marin clips use generation speed 1.0 with reviewed contextual hiragana and connected phrasing. The complete 102-clip counting manifest passes Chrome offline-decoded signal checks, with no silent clips detected; signal checks do not establish audible pronunciation or pitch correctness. Browser checks cover date layout and recorded playback. No listening verification is claimed.

### Counting cards — page 3: 月・年

Added twelve month names, five calendar-year examples, eight relative month/year terms, two question words, and five translated daily-life examples. All 33 new inputs reviewed in hiragana, with contextual particles and connected date/year phrasing; Marin at generation speed 1.0. Exact dictionary accent targets used for month names and relative terms; heading, years and sentences retain provisional intonation under standing authorization. Browser checks pass for three pages, phone width, and recorded audio lookup. All 135 counting clips decoded with non-silent signal; this is not listening or audible pitch verification.

### Counting cards — page 4: 曜日

Added seven weekdays, six relative day terms, four useful day words and five translated daily-life sentences. All 23 new hiragana inputs reviewed; 市場 is いちば in the food-market example, topic は becomes わ, and the sole sentence comma follows the complete 明日 phrase. All standalone entries have exact dictionary pitch targets; sentences use authorized provisional Tokyo intonation. Marin generation speed 1.0. Four-page browser checks passed, including mobile width and audio lookup. All 158 clips decoded with non-silent signal; no audible pitch or listening verification claimed.

Regenerated standalone 週末（しゅうまつ）at Marin 1.0 after user reported drawn-out delivery. Guidance requests compact conversational timing, ordinary しゅう vowel length, connected short まつ and no internal pauses. Retained heiban target from exact 週末 source; corrected prior source metadata that had matched homophone 終末. MP3 decoding metadata checked; no listening verification claimed.

### Counting cards — page 5: 時刻

Added 12 clock hours, minutes 1–10, six useful minute marks, five AM/PM/question terms, three combined times and five translated examples. Checked readings and pitch targets against Japan Foundation Irodori Starter wordlist pages 27–28 and 44–45; exact 時刻 and 何分 accent sources retained separately. Compound times and sentence intonation marked provisional. Contextual は → わ, lexical はん preserved, particles attached, compact time phrasing. Generated 42 new Marin clips at 1.0. Five-page mobile/audio lookup checks passed; all 200 clips decoded with non-silent signal. No audible pitch/listening verification claimed.

### Counting cards — page 6: 期間

Added 1–10 hours/days/weeks/months/years, half-duration terms, questions and five translated examples. All 52 new speech inputs reviewed against the Japan Foundation duration chart; exact spelling/reading accent matches retained, remaining targets provisional under standing authorization. Explicit six-month sentence speech avoids mixed kanji/kana annotation ambiguity. Object を → お and topic は → わ reviewed. Marin at 1.0. Six-page mobile/audio lookup checks passed; all 252 recordings decoded with non-silent signal. No listening or audible pitch verification claimed.

### Counting cards — page 7: 人数

Added person counts 1–10, larger counts 11/12/14/20, 何人, three group phrases and five translated everyday examples. All 24 new inputs reviewed against Japan Foundation counting materials, including irregular ひとり/ふたり/よにん. Exact spelling-and-reading accent matches retained; remaining targets provisional under standing authorization. Topic は → わ in 今日は and uninterrupted 人で phrasing reviewed. Marin generation speed 1.0. Seven-page mobile/audio-button checks passed; all 276 clips decoded with non-silent signal. No listening or audible pitch verification claimed.

### Counting cards — page 8: 物の数

Added 〜つ and 〜個 1–10, questions/larger counts and five translated daily-life ordering examples. Reviewed 30 new speech inputs against Japan Foundation counter chart BTS00010; exact spelling/reading dictionary targets retained, other intonation provisional. Explicit sentence speech keys keep contextual を → お and は → わ separate from display. Marin at 1.0. Eight-page mobile and audio-button checks passed. Signal validation caught silent ろっこ; regenerated it, then all 306 clips passed decoded non-silence checks. No listening or audible pitch verification claimed.

### Counting cards — page 9: 本・杯

Added 本/杯 counts 1–10, 何本/何杯 and five translated food/drink examples. All 28 new inputs reviewed against Japan Foundation counter chart BTS00010. Exact spelling/reading matches retained and 一杯 noun/counter pitch selected separately from adverb sense; remaining targets provisional. Speech-only particle readings and long vowels reviewed. Marin generation speed 1.0. Nine-page mobile/audio lookup checks passed; all 334 recordings decoded with non-silent signal. No listening or audible pitch verification claimed.

### Counting cards — page 10: 枚・冊・台

Added 1–10 for 枚/冊/台, three question words and five translated everyday examples. Reviewed all 39 new inputs against Japan Foundation counter chart BTS00010; exact spelling/reading dictionary targets retained, others provisional under standing authorization. Explicit speech keys preserve context-specific を → お and は → わ; long vowels and satsu gemination reviewed. Marin at 1.0. Ten-page mobile/audio lookup checks passed; all 373 recordings decoded with non-silent signal. No listening or audible pitch verification claimed.

Regenerated 二杯（にはい）with explicit lexical ha guidance, connected compact timing and Marin 1.0 after user reported incorrect pronunciation. Reading checked against Japan Foundation counter reference; pitch remains provisional. All 373 clips pass decoded non-silence checks; no listening verification claimed.

Regenerated お皿を四枚用意します。at Marin 1.0 after user reported unnatural delivery. Retained reviewed おさらおよんまいよういします。and added explicit connected object/predicate guidance, normal ようい vowel timing and compact natural sentence intonation. All 373 clips pass non-silent decoding checks; no listening verification claimed.

### Counting cards — page 11: 年齢

Added ages 1–10, teens/twenties including はたち and にじゅっさい, decades and age questions, plus five translated examples. All 33 new inputs reviewed against Japan Foundation Irodori Lesson 4 and counter chart BTS00010. Exact dictionary targets retained; other intonation provisional under standing authorization. Contextual topic は → わ and lexical はたち/はっさい preserved; phrase boundaries reviewed. Marin generation speed 1.0. Eleven-page mobile/audio lookup checks passed; all 406 clips decoded with non-silent signal. No listening or audible pitch verification claimed.

### Counting cards — page 12: 回数・順番

Added 回/番 1–10, questions and sequence expressions, plus five translated everyday examples. All 33 new speech inputs reviewed against Japan Foundation counter chart BTS00010. Exact dictionary targets retained; remaining intonation provisional under standing authorization. Contextual を → お and は → わ reviewed, gemination preserved, frequency phrase kept together. Marin generation speed 1.0. Twelve-page mobile/audio lookup checks passed; all 439 recordings decoded with non-silent signal. No listening or audible pitch verification claimed.

### Counting cards — page 13: 金額

Added yen 1–10, common price components, composite prices and questions, plus five translated shopping examples. Reviewed all 32 new inputs: よえん, place-value sound changes and connected price expressions; sentence topic は → わ, lexical はち preserved. Exact dictionary targets retained; remaining intonation provisional under standing authorization. Marin generation speed 1.0. Thirteen-page mobile/audio lookup checks passed; all 471 recordings decoded with non-silent signal. No listening or audible pitch verification claimed.

### Counting cards — final page 14: 匹・階

Added animal/floor counts 1–10, question words, basement level and five translated examples. All 29 new inputs reviewed against Japan Foundation counter chart BTS00010. Floor keys retain distinct punctuation to separate 階 from homophone 回 and preserve sense-specific pitch targets. Exact dictionary targets retained; remaining intonation provisional under standing authorization. Marin at 1.0. Fourteen-page mobile and audio-button checks passed, including distinct floor playback; all 500 recordings decoded with non-silent signal. This completes the current everyday counting deck. No listening or audible pitch verification claimed.

### Counting cards — cooking extension page 15: 料理で数える

Added servings, plated dishes, slices, spoon measures, rice/cup measures and small amounts, plus seven translated cooking examples. Reviewed all 34 new inputs for culinary context; source references include Kikkoman measuring guidance and UT Austin JOSHU counters. Exact dictionary targets retained; other intonation provisional under standing authorization. Object を → お reviewed individually; long vowels and measures stay connected. Marin at 1.0. Fifteen-page mobile/audio lookup checks passed; all 534 recordings decoded with non-silent signal. No listening or audible pitch verification claimed.

### Auto Response — page 1: Basic reactions

Generated only card 01: 13 reactions plus heading, Marin at 1.0. Reviewed hiragana and connected phrasing; sense-matched whole-word targets and lexical component targets retained, remaining phrase intonation provisional under standing authorization. Exporter/generator now support an explicit --card scope, requiring complete selected-card review and preserving previously generated cards. Full existing counting export remains 534 keys; Auto Response manifest contains exactly the 14 page-1 keys. All 14 clips pass decoded non-silence checks. No listening or audible pitch verification claimed.

### Auto Response — page 2: Understanding

Generated eight realization responses plus heading with reviewed hiragana, phrase boundaries and provisional Tokyo intonation at Marin 1.0. Checked しくみ/いみ and connected そういう; retained brief pauses after complete interjections only. Card-scoped generation preserved all page-1 keys. The manifest contains exactly 23 keys for pages 1–2, all passing decoded non-silence checks. No listening or audible pitch verification claimed.

### Auto Response — page 3: New information

Generated ten reactions plus heading with reviewed hiragana, connected phrase guidance and authorized provisional Tokyo intonation at Marin 1.0. Checked はじめて, きづき, かんがえた and geminated なかった; lexical は preserved. Card-scoped generation retained pages 1–2. Manifest contains exactly the 34 keys for pages 1–3; all pass decoded non-silence checks. No listening or audible pitch verification claimed.

### Auto Response — page 4: Misunderstanding

Generated six responses plus heading at Marin 1.0. Reviewed lexical readings and accent component targets for 勘違い/逆/意味/違う/なるほど; whole-phrase pitch provisional. Template 〜だと思ってました uses spoken example そうだと思ってました, labelled in the English line. Card-scoped generation preserved prior pages. All 41 manifest keys match pages 1–4 and pass decoded non-silence checks. No listening or audible pitch verification claimed.

### Auto Response — page 5: Clarification

Generated eight clarification expressions plus heading at Marin 1.0. Reviewed context readings, heading object を → お, contractions and geminated あって. Four templates use labelled natural examples with 明日/同じ/これ; display templates remain. Whole-phrase pitch provisional under standing authorization. Earlier pages retained; all 50 keys match pages 1–5 and pass decoded non-silence checks. No listening or audible pitch verification claimed.

### Auto Response — page 6: Didn’t understand

Generated nine requests plus heading at Marin 1.0. Reviewed readings and phrase boundaries, retained lexical accent targets, guided repeated vowels in もう一回いいですか and connected どういう. Template 〜って何ですか uses labelled だしって何ですか example. Whole-phrase pitch provisional where unavailable. Earlier pages retained; manifest exactly matches 60 keys for pages 1–6, all passing decoded non-silence checks. No listening or audible pitch verification claimed.

### Auto Response — page 7: Partial understanding

Generated six responses plus heading at Marin 1.0. Reviewed contextual topic は → わ, lexical readings and gemination. Retained sourced component pitch targets with provisional whole-phrase intonation. Guidance keeps particles attached and pauses after the complete clause. Earlier pages retained; all 67 keys match pages 1–7 and pass decoded non-silence checks. No listening or audible pitch verification claimed.

### Auto Response — page 8: Buying time

Generated nine expressions plus heading at Marin 1.0. Reviewed hiragana, heading object を → お, gemination and connected なんていう/なんて言えば phrasing. Guidance requests brief natural hesitation with no drawn-out syllables. Component targets sourced where available; full-phrase pitch provisional. Previous recordings retained; manifest exactly matches 77 keys for pages 1–8, all passing decoded non-silence checks. No listening or audible pitch verification claimed.

### Auto Response — page 9: Keeping them talking

Generated eight follow-up questions plus heading at Marin 1.0. Reviewed lexical readings, heading object を → お and 日本では → にほんでわ with uninterrupted でわ. Retained exact lexical component pitch sources; whole-question intonation provisional. Earlier pages preserved; manifest exactly matches 86 keys for pages 1–9, all passing decoded non-silence checks. No listening or audible pitch verification claimed.

### Auto Response — page 10: Useful information

Generated eight responses plus heading at Marin 1.0. Reviewed readings, long vowels in 聞いて/参考/勉強 and gemination in やって/よかった; connected predicate guidance and brief pauses after それ. Sourced lexical component targets retained; whole-phrase pitch provisional. Previous pages retained; all 95 keys match pages 1–10 and pass decoded non-silence checks. No listening or audible pitch verification claimed.

Regenerated それからどうなったんですか？at Marin 1.0 with explicit connected question phrasing, normal どう vowel length and doubled t in なった. Earlier page clips preserved; all 95 Auto Response recordings pass decoded non-silence checks. No listening verification claimed.

### Auto Response — page 11: Soft disagreement / uncertainty

Generated seven responses plus heading at Marin 1.0. Reviewed contextual は → わ and を → お, long vowels and gemination; guidance requests gentle reflective endings and brief unfinished phrases. Sourced lexical component targets retained; full-phrase pitch provisional. Prior clips preserved; all 103 keys match pages 1–11 and pass decoded non-silence checks. No listening or audible pitch verification claimed.

### Auto Response — page 12: Emotional reactions

Generated thirteen reactions plus heading at Marin 1.0. Reviewed hiragana, appearance-form そう, gemination and heading を → お. Retained sourced whole-word/component pitch targets, with provisional phrase intonation where unavailable. Guidance requests compact natural emotional delivery. Earlier recordings retained; all 117 keys match pages 1–12 and pass decoded non-silence checks. No listening or audible pitch verification claimed.

### Auto Response — final page 13: Short reactions

Generated ten short reactions plus heading at Marin 1.0. Reviewed contextual readings, short あ interjections, geminated そっか and connected そういう. Component accent sources retained; full reaction intonation provisional where unavailable. All 13 pages are now generated. The 128 review/manifest keys exactly match the full deck export, and all clips pass decoded non-silence checks. No listening or audible pitch verification claimed.

### Ingredient cards — page 1: Aromatics, condiments and herbs

Added 食材カード as the first deck in 食材の基本 (food-culture category). First card contains all supplied page-1 vocabulary, with separate alias entries (61 terms) in two columns. Reviewed all 62 heading/term speech keys; exact dictionary targets retained where available, other targets provisional under standing authorization. Reused 31 existing 図鑑 Marin 1.0 paths directly through explicit reviewed reuse_audio entries, without copying MP3s. Generated only 31 missing clips. Signal check caught quiet newly generated しそ, then regeneration passed. Browser verifies first position, 61 entries, two columns, phone width and audio lookup; all 62 clips pass decoded non-silence checks. No listening or audible pitch verification claimed.

### Ingredient cards — page 2: 葉物野菜

Added all 30 supplied leafy-vegetable terms in two columns. Reviewed each hiragana input, lexical は and katakana long vowels/gemination; exact dictionary targets retained, remaining intonation provisional under standing authorization. Reused 10 existing 図鑑 Marin 1.0 file paths directly and generated 20 missing clips. Page heading shares the exact 葉物野菜 vocabulary key. Browser verifies both pages, first category position, mobile width and recorded audio lookup. All 92 keys match full export, shared paths remain unchanged, and every clip passes decoded non-silence checks. No listening or audible pitch verification claimed.

### Ingredient cards — page 3: 根菜・芋類

Added all 27 supplied root/tuber terms in two columns. Reviewed all readings for culinary context, including cultivar names and じねんじょ. Reused ten exact 図鑑 Marin 1.0 file paths and generated 18 missing recordings including heading. Exact dictionary targets retained where available; remaining intonation provisional under standing authorization. Browser verifies three pages, phone width and recorded playback. All 120 keys match the full export and pass decoded non-silence checks; shared paths remain unchanged. No listening or audible pitch verification claimed.

### Ingredient cards — page 4: 実を食べる野菜

Added all supplied fruit-vegetable terms, with separate ゴーヤ/苦瓜 aliases (24 entries), in two columns. Reviewed each reading, cultivar names, katakana gemination/long vowels and heading object を → お. Reused 12 exact 図鑑 Marin 1.0 paths and generated 13 missing clips including heading. Dictionary targets retained where available; remaining intonation provisional. Four-page mobile/audio lookup checks passed; all 145 keys match full export, retain shared paths, and pass decoded non-silence checks. No listening or audible pitch verification claimed.

### Ingredient cards — page 5: 豆類

Added all supplied bean/pea terms with separate いんげん/さやいんげん aliases (20 entries), in two columns. Reviewed all readings, including 十六ささげ and 小豆, katakana long vowels and gemination. Reused four exact 図鑑 Marin 1.0 paths and generated sixteen missing clips. Exact dictionary targets retained; remaining intonation provisional under standing authorization. Five-page mobile/audio lookup checks passed; all 165 keys match full export and pass decoded non-silence checks. Shared file paths remain unchanged. No listening or audible pitch verification claimed.

Regenerated 米なす（べいなす）and ししとう at Marin 1.0 with complete-word articulation, normal vowel length and no internal pauses. Replaced any shared reuse only in the ingredient deck, leaving original 図鑑 paths intact. All 165 ingredient clips pass decoded non-silence checks. No listening verification claimed.

### Ingredient cards — page 6: 花・茎・芽を食べる野菜

Added all 12 supplied flower/stem/shoot terms in two columns. Reviewed 食用菊 しょくようぎく, lexical はな, heading を → お, long vowels and gemination. Reused five exact 図鑑 Marin 1.0 paths and generated eight missing clips including heading. Dictionary targets retained where available; remaining intonation provisional under standing authorization. Six-page mobile/audio lookup checks passed; all 178 keys match full export and pass decoded non-silence checks, with shared paths unchanged. No listening or audible pitch verification claimed.

Regenerated アーティチョーク（あーてぃちょーく）at Marin 1.0 after user reported broken delivery. Guidance requests a single compact connected word, particularly てぃちょー, with normal long vowels and no internal pauses. All 178 ingredient clips pass decoded non-silence checks. No listening verification claimed.

### Ingredient cards — page 7: 山菜

Added all 11 supplied wild-vegetable terms in two columns. Reviewed each culinary reading, including 行者にんにく and 根曲がり竹. Reused two exact 図鑑 Marin 1.0 paths and generated nine missing clips; heading shares 山菜 vocabulary key. Dictionary targets retained where available; other intonation provisional under standing authorization. Seven-page mobile/audio lookup checks passed; all 189 keys match full export and pass decoded non-silence checks, with shared paths unchanged. No listening or audible pitch verification claimed.

### Ingredient cards — page 8: もやし・スプラウト

Added all seven supplied sprouts/microgreens in two columns. Reviewed each reading, including 緑豆もやし and 豆苗, and katakana long vowels/gemination. No exact reviewed 図鑑 matches available; generated eight new Marin 1.0 clips including heading. Dictionary targets retained where available; remaining intonation provisional. Eight-page mobile/audio lookup checks passed; all 197 keys match full export and pass decoded non-silence checks. Existing shared file paths remain unchanged. No listening or audible pitch verification claimed.

### Ingredient cards — page 9: きのこ

Added all 17 supplied mushroom/preparation terms in two columns. Reviewed readings and sense-specific cap/stem terms, long vowels/gemination, and 石づきを落とす → いしづきおおとす with contextual object particle. Reused eleven exact 図鑑 Marin 1.0 paths and generated seven missing clips including heading. Dictionary targets retained where available; remaining intonation provisional. Nine-page mobile/audio lookup checks passed; all 215 keys match full export and pass decoded non-silence checks. Shared file paths unchanged. No listening or audible pitch verification claimed.

Regenerated 山菜（さんさい）, かいわれ大根（かいわれだいこん）and えのき at Marin 1.0. Guidance requests compact complete-word timing, no syllable gaps and normal volume. Shared reuse detached only for requested replacements; original 図鑑 files retained. All 215 ingredient recordings pass decoded non-silence checks. No listening verification claimed.

Regenerated culinary えのき with explicit heiban low-high-high (え low, の/き high) guidance at Marin 1.0, keeping the word continuous. Target remains provisional because exact mushroom-abbreviation primary accent evidence was not confirmed; local 榎/朴 tree entries were not used as sense verification. All 215 ingredient clips pass decoded non-silence checks; generated pitch not listening-verified.

Retried えのき at user request with explicit mushroom/榎茸 context, short-form-only instruction and low-high-high heiban guidance. Marin at 1.0; all 215 ingredient recordings pass decoded non-silence checks. No audible pitch or listening verification claimed.

### Ingredient cards — page 10: 大豆製品

Added all 27 supplied soy-product/preparation terms in two columns. Reviewed each reading, long vowels/gemination, and 豆腐を崩す → とうふおくずす with contextual object particle. Reused twenty exact 図鑑 Marin 1.0 paths and generated eight missing clips including heading. Dictionary targets retained where available; remaining intonation provisional. Ten-page mobile/audio lookup checks passed; all 243 keys match full export and pass decoded non-silence checks, shared paths unchanged. No listening or audible pitch verification claimed.

Regenerated 水煮（みずに）and 味噌（みそ）at Marin 1.0. Retained exact dictionary targets: 水煮 heiban low-high-high, 味噌 accent 1 high-low. Guidance requests short vowels, compact continuous articulation and no stretching. Detached 味噌 reuse only in ingredient deck; original 図鑑 file unchanged. All 243 ingredient clips pass decoded non-silence checks. No listening verification claimed.

Ingredient page 11 — 魚の名前: 33 vocabulary entries plus heading; 22 existing Marin recordings reused directly and 12 new Marin 1.0 recordings. Fish-context readings reviewed. Near-silent reused 鰤 replaced; full PCM check plus replacement recheck passed. Mobile two-column layout and audio lookup passed. Audible pitch was not listening-verified. Cumulative coverage: 277 keys across 11 pages.

Ingredient page 12 — 魚以外の魚介: 37 vocabulary terms plus heading. Reused 18 existing 図鑑 Marin recordings directly and generated 20 new Marin 1.0 clips. Supplied readings individually reviewed; exact dictionary accent matches recorded, others provisional under standing authorization. All 315 cumulative clips passed PCM silence checks; twelve-page mobile layout and speaker lookup passed. No audible pitch verification claimed.

Page 12 correction: 魚介類 and 車海老 regenerated with explicit compact connected mora timing and retained dictionary accents 2 and 3, using Marin 1.0. Replacement file durations: 1.608 s and 1.368 s. All 315 clips passed decoded PCM silence checks; no audible listening verification claimed.

Ingredient page 13 — 魚の下処理: 14 vocabulary/action phrases plus heading. Six existing 図鑑 Marin clips reused directly, nine new clips generated at 1.0. Contextual object を inputs reviewed as お; short action phrases kept continuous. Exact dictionary accents retained where available, phrase intonation provisional. All 330 cumulative clips passed decoded PCM silence checks; mobile two-column layout and speaker lookup passed. No audible listening verification claimed.

Page 13 correction: 頭を落とす regenerated after user reported a male-sounding voice, with guidance for consistent normal Marin register and connected あたまおおとす input at 1.0. Replacement passed targeted decoded PCM check. Voice timbre and audible pitch not listening-verified.

Ingredient page 14 — 魚料理: 19 terms plus heading, 9 recordings reused directly and 11 new Marin 1.0 recordings. Supplied readings reviewed, including こぶじめ and しめさば; dictionary accents where available, provisional intonation otherwise. All 350 cumulative clips passed decoded PCM checks. Fourteen-page mobile layout and speaker lookup passed; no audible pitch verification claimed.

Ingredient page 15 — 海藻: 28 terms plus heading, 13 existing recordings reused directly and 16 new Marin 1.0 recordings. All supplied readings reviewed, including らうすこんぶ and えんぞうわかめ; exact dictionary accents retained where available, others provisional. All 379 cumulative clips passed decoded PCM silence checks; fifteen-page mobile layout and speaker lookup passed. No audible pitch verification claimed.

Ingredient page 16 — 米の基本・種類: 24 terms including 米/お米 aliases plus heading. Two existing recordings reused directly, 23 new Marin 1.0 recordings. All supplied readings reviewed in rice context; lexical は preserved, exact dictionary accent matches retained, remaining compounds provisional. All 404 cumulative clips passed decoded PCM silence checks. Sixteen-page mobile layout and speaker lookup passed; no audible pitch verification claimed.

Page 16 corrections: もち米, 胚芽米 and 無洗米 regenerated at Marin 1.0 with explicit compact connected delivery. Dictionary heiban targets retained for もちごめ/はいがまい; むせんまい intonation remains provisional. Replacement durations 1.320 s, 1.320 s and 1.608 s respectively. All 404 clips passed decoded PCM silence checks; audible pitch/timbre not listening-verified.

Ingredient page 17 — 米の品種・産地: 21 terms plus heading, 22 new Marin 1.0 recordings; no matching 図鑑 clips available. Supplied readings reviewed in rice/cultivar context; exact dictionary accents retained, other compounds provisional. All 426 cumulative clips passed decoded PCM silence checks. Seventeen-page mobile layout and speaker lookup passed; no audible pitch verification claimed.

Page 17 corrections: 新潟県産, 魚沼産 and 精米 regenerated at Marin 1.0 with compact connected timing guidance. 精米 dictionary accent 0 retained; region compounds remain provisional. All 426 clips passed decoded PCM silence checks; audible pacing and pitch not listening-verified.

Second page 17 pacing retry: 魚沼産 and 精米 regenerated at Marin 1.0 with explicit brief everyday delivery targets. File durations 2.160 s and 1.560 s; duration alone does not verify audible pacing. All 426 clips passed decoded PCM checks. No listening verification claimed.

魚沼産 context retry: supplied Uonuma as a geographical region in Niigata Prefecture and 産 as rice-origin suffix. Speech input remains reviewed うおぬまさん; Marin 1.0. Targeted PCM check passed; audible pronunciation not listening-verified.

Ingredient page 18 — 米の炊き方: 23 terms/actions plus heading, 24 new Marin 1.0 recordings. All contextual readings and object particles reviewed, lexical は retained. Exact dictionary targets recorded where available; phrase intonation provisional. All 450 cumulative clips passed decoded PCM silence checks; mobile two-column layout and speaker lookup passed. No audible pitch verification claimed. Accepted 魚沼産 context recording preserved.

Page 18 correction: 米を研ぐ regenerated with dictionary component accents 米 2 and 研ぐ 1, rice-washing context and connected object particle. Whole-phrase intonation remains provisional. 炊飯 regenerated with compact connected delivery and dictionary accent 0. Marin 1.0; all 450 clips passed PCM silence checks; audible pitch not listening-verified.

Ingredient page 19 — 炊飯の道具・計量: 14 terms plus heading, six 図鑑 recordings reused directly and nine new Marin 1.0 recordings. Contextual readings reviewed, including rice-volume 合 and serving 膳. Exact dictionary targets retained, others provisional. All 465 cumulative clips passed decoded PCM silence checks; nineteen-page mobile layout and speaker lookup passed. No audible pitch verification claimed.

三合 regenerated at Marin 1.0 after reported buzzing, with clear steady voice guidance and rice-counter context. Targeted PCM check passed; audible timbre not listening-verified. Ingredient deck scope saved: finish at page 26, skip source pages 27–28.

Ingredient page 20 — 米料理・寿司: 44 terms including aliases plus heading, nine recordings reused directly and 36 new Marin 1.0 recordings. Supplied readings reviewed in culinary context; exact dictionary targets retained, remaining compounds provisional. All 510 cumulative clips passed decoded PCM silence checks; twenty-page mobile layout and speaker lookup passed. No audible pitch verification claimed. Stop at page 26; source pages 27–28 remain excluded.

Page 20 corrections: 赤飯 and 炊き込みご飯 replaced with new Marin 1.0 clips after user reported unnatural sound. Specific dish context and compact connected timing supplied, dictionary accents 0 and 5 retained. Original 図鑑 files untouched. All 510 clips passed decoded PCM checks; no audible pitch/timbre verification claimed.

Ingredient page 21 — ご飯のお供: 12 vocabulary terms, with heading sharing the first term audio key. One recording reused directly and 11 new Marin 1.0 recordings. Supplied readings reviewed, including salmon and seasoned-enoki context; supplied voiced ちりめんざんしょう retained and MAFF unvoiced variant documented. All 522 cumulative clips passed decoded PCM checks; mobile two-column layout and speaker lookup passed. No audible pitch verification claimed.

ちりめん山椒 regenerated with supplied ちりめんざんしょう reading, explicit rice-accompaniment context and continuous delivery without internal breaks. Marin 1.0; targeted PCM check passed. Audible pauses not listening-verified.

Page 21 egg-rice dish regenerated at Marin 1.0 with continuous delivery guidance. Replacement MP3 metadata validated; browser PCM check did not complete. No audible pause verification claimed.

Ingredient page 22 — 漬物・乾燥野菜: 16 terms plus heading; twelve recordings reused directly and five new Marin 1.0 recordings. Supplied contextual readings and dictionary targets reviewed, unconfirmed compounds provisional. All 539 cumulative clips passed decoded PCM silence checks; mobile layout and speaker lookup passed. No audible pitch verification claimed.

Ingredient page 23 — 野菜の部位: 15 terms plus heading; two recordings reused directly and fourteen new Marin 1.0 recordings. Supplied contextual readings reviewed, including lexical は/へた. Dictionary accents retained where available, remaining targets provisional. All 555 cumulative clips passed decoded PCM silence checks; mobile two-column layout and audio lookup passed. No audible pitch verification claimed.

Ingredient page 24 — 野菜の下処理: 22 terms/actions plus heading; seven recordings reused directly and sixteen new Marin 1.0 clips. All contextual readings, particles and phrase boundaries reviewed. Exact dictionary targets retained, other phrases provisional. All 578 cumulative clips passed decoded PCM checks; mobile two-column layout and audio lookup passed. No audible pitch verification claimed.

Page 24 corrections: 洗う, 筋を取る, 塩茹でする and 塩もみする regenerated with compact connected kitchen-action guidance at Marin 1.0. Reviewed inputs retained, object particle attached in すじおとる. All 578 clips passed decoded PCM checks; audible smoothness not listening-verified.

洗う retried with compact everyday washing-vegetables context, connected final vowel and retained accent 0, Marin 1.0. Targeted PCM check passed; audible delivery not listening-verified.

Ingredient page 25 — 切り方: 19 terms plus heading; sixteen existing recordings reused directly and four new Marin 1.0 recordings. Supplied cutting-style readings reviewed, dictionary targets retained where available, others provisional. All 598 cumulative clips passed decoded PCM checks; mobile two-column layout and audio lookup passed. No audible pitch verification claimed. One remaining page, ending at 26.

Ingredient final page 26 — 調理法・野菜料理: 26 terms/actions plus heading. Initially fourteen recordings reused and thirteen new; near-silent 素揚げ replaced, final thirteen reused and fourteen new Marin 1.0 clips. All supplied readings reviewed, dictionary accents where available and provisional compounds otherwise. Full 625-clip PCM check plus targeted replacement check passed; mobile layout and audio lookup passed. Deck complete at 26 pages; 27–28 excluded. No audible pitch verification claimed.

New flour page 1 (deck page 27) — 小麦粉: six terms and English protein-strength note. Six new Marin 1.0 clips; heading shares 小麦粉 audio. Reviewed readings and available dictionary targets, provisional where unavailable. Exporter omits English-only note from speech keys. Mobile layout/note/audio lookup passed; all 631 clips passed PCM checks. Original source pages 27–28 remain skipped; new flour pages append as 27–31. No listening verification claimed.

Six page 26 clips regenerated: 煮物, 炒め物, 蒸し野菜, 温野菜, 和え物, 火が通る. Marin 1.0, reviewed inputs and cooking context with compact connected timing. Reused original files preserved. Nonempty replacement MP3s and afinfo validated; browser check blocked by automatic review timeout. No audible listening verification claimed.

Flour page correction: 強力粉 regenerated with connected ingredient-name guidance at Marin 1.0. English-only protein-strength note now has Japanese explanation and reviewed contextual hiragana recording, fixing empty text beside its speaker. Particle わ and phrase boundaries checked. Replacement MP3 metadata validated; no audible listening verification claimed.

New flour page 2 (deck page 28) — 衣・とろみ用の粉: nine terms plus heading. Existing ingredient 米粉 recording reused directly; nine new Marin 1.0 clips generated. All supplied readings reviewed; dictionary targets where available, provisional otherwise. All 641 clips passed decoded PCM checks; mobile two-column layout and speaker lookup passed. No audible listening verification claimed.

唐揚げ粉 and コーンスターチ regenerated with reviewed hiragana, ingredient context and compact connected delivery at Marin 1.0. All 641 clips passed decoded PCM checks; audible listening verification not claimed.

コーンスターチ retried with Japanese-language katakana pronunciation instructions and reviewed こーんすたーち input, Marin 1.0. MP3 metadata validated; browser PCM check did not complete. No audible pronunciation verification claimed.

コーンスターチ smoothness retry: simplified Japanese conversational guidance without segmented mora examples, reviewed input unchanged, Marin 1.0. MP3 metadata validated; audible smoothness not listening-verified.

New flour page 3 (deck page 29) — 和菓子用の粉: six terms plus heading. Existing ingredient きなこ recording reused directly; six new Marin 1.0 clips. Supplied readings and available dictionary targets reviewed, provisional where unavailable. All 647 clips passed decoded PCM checks; mobile layout and audio lookup passed. No audible listening verification claimed.

白玉粉 regenerated with Japanese-language guidance, shiratama rice-flour context and connected ingredient-name delivery. Reviewed input しらたまこ, Marin 1.0; nonempty MP3 and metadata validated. No audible listening verification claimed.

New flour page 4 (deck page 30) — その他の粉・ミックス: six terms plus heading, seven new Marin 1.0 clips with Japanese conversational katakana guidance. Supplied readings reviewed, dictionary targets where available, provisional otherwise. All 654 clips passed decoded PCM checks; mobile layout and speaker lookup passed. Accepted 白玉粉 version preserved. No audible listening verification claimed.

ライ麦粉 and アーモンドプードル regenerated with Japanese ingredient-specific context and compact connected delivery at Marin 1.0. All 654 clips passed PCM checks; no audible listening verification claimed.

New flour page 5 (deck page 31) — 使い方: eight terms/actions plus heading; one 図鑑 recording reused directly and eight new Marin 1.0 clips. Contextual readings and particles reviewed, dictionary targets where available, other phrases provisional. All 663 clips passed decoded PCM checks; thirty-one-page mobile layout and audio lookup passed. All five new flour pages complete. Original source 27–28 still excluded. No audible listening verification claimed.

粉をふるう, 水溶き片栗粉 and 打ち粉 regenerated at Marin 1.0 with Japanese culinary context. Near-silent 打ち粉 caught and replaced. Full-set PCM check plus replacement recheck passed. No audible listening verification claimed.

打ち粉 retried with simpler baking context and explicit dictionary accent 3, reviewed うちこ input and Marin 1.0. Replacement MP3 metadata validated; audible pronunciation not listening-verified.

肉カード added first in 動物性食材. Page 1 肉の種類: 12 terms in two columns plus heading, 13 new Marin 1.0 clips. Contextual readings and dictionary targets reviewed, provisional where unavailable. First-deck ordering, mobile layout and audio lookup passed; 13 clips passed decoded PCM checks. No audible listening verification claimed. Six pages planned, generated page by page.

Meat page 2 部位: 32 terms, heading shares 部位 audio; seven recordings reused directly and 25 new Marin 1.0 clips. Meat-specific readings and targets reviewed, tenderloin ヒレ treated separately from fish fin. Mobile layout/audio lookup and all 45 cumulative PCM checks passed. No audible listening verification claimed.

Meat corrections: 脂身, 牛すじ, コラーゲン, バラ肉, すね肉, 手羽先 regenerated with Japanese meat context and compact connected delivery, Marin 1.0. All 45 clips passed PCM checks. Original reused files preserved; no audible listening verification claimed.

Meat page 3 売り方・特徴: 11 terms plus heading. Three existing meat clips and one 図鑑 clip reused, eight new Marin 1.0 recordings. Corrected 脂身 preserved. Supplied readings and targets reviewed; mobile layout/audio lookup and all 54 PCM checks passed. No audible listening verification claimed.

Meat page 3: added ひき肉 (ひきにく), minced / ground meat; directly reuses reviewed existing page 2 recording. Twelve vocabulary terms; no new audio file needed.

Meat page 4 下処理・調理: eleven terms/actions plus heading; one recording reused and eleven new Marin 1.0 clips. Contextual readings, particles and phrase boundaries reviewed; dictionary targets where available, other phrases provisional. Mobile layout/audio lookup and all 66 PCM checks passed. No audible listening verification claimed.

Meat corrections: 下味をつける and 焼き色をつける regenerated with continuous particle-attached phrasing; 余熱 regenerated with consistent normal Marin voice guidance. Marin 1.0; all 66 clips passed PCM checks. Audible pacing/timbre not listening-verified.

焼き色をつける smoothness retry: simplified Japanese kitchen-context guidance for one flowing phrase. Reviewed やきいろおつける input, Marin 1.0. Replacement MP3 metadata validated; audible smoothness not listening-verified.

Meat page 5 肉料理: ten terms plus heading; two recordings reused and nine new Marin 1.0 clips. Contextual readings reviewed, dictionary targets where available, others provisional. Mobile layout/audio lookup and all 77 PCM checks passed. No audible listening verification claimed.

Meat final page 6 肉の味・食感・香り: nineteen descriptions plus heading, twenty new Marin 1.0 recordings. Contextual readings and phrase boundaries reviewed, dictionary targets where available, other phrases provisional. All six pages complete. Mobile layout/audio lookup and all 97 PCM checks passed. No audible listening verification claimed.

旨味が強い and 香ばしい regenerated with compact everyday delivery, normal lexical vowel timing and Marin 1.0. All 97 clips passed PCM checks; audible pacing not listening-verified.

Knife anatomy: new first page uses assets/knife_anatomy2.svg with thirty accessible label buttons, orange selected state and shared lesson audio playback. Full western/Japanese vocabulary lists include aliases. Existing 21 pages renumbered to 2–22 without changing IDs or recordings. Nine new Marin 1.0 keys, reviewed supplied contextual readings; existing matching lesson recordings reused. Mobile layout, focus, selection, audio lookup, numbering and all 269 PCM checks passed. No audible listening verification claimed. SVG added to offline shell.

Anatomy refinement: ツバ（口金） and R（反り） combined into single vocabulary entries and diagram speech keys; new paired Marin 1.0 recordings with short natural alias separation. Mobile diagram restored to frame width. Replacement MP3 metadata validated; no audible listening verification claimed.

刃元 regenerated after male-sounding voice report; reviewed はもと input, knife-heel context and consistent normal Marin register guidance at 1.0. Shared key updates both anatomy labels and existing cards. MP3 metadata validated; audible timbre not listening-verified.

Anatomy 口輪（角巻） combined into one vocabulary entry and diagram playback key, reviewed くちわ、つのまき input, Marin 1.0. MP3 metadata validated; no audible listening verification claimed.
