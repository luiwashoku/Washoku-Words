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
