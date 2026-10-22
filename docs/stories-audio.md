# Stories audio

Stories 1–11 have audio: 238 messages, using Marin at generation speed 1.0.

## Story 1 — Making shio koji

`story-shiokoji-01` has 16 enabled messages, all Marin (`gpt-4o-mini-tts`) at generation speed **1.0**. Story titles are silent. Stories 2–5 are documented below; all original story text is retained. No playback-rate adjustment is used.

Exact lookup keys, separate phonetic inputs, contextual particle checks, sentence phrasing and pitch guidance are recorded in `scripts/lesson-audio-reviews/stories-cards.json`. Input review preserves こうじ / こめこうじ, 量ってある → はかってある, 袖をまくる, long vowels, doubled consonants, and lexical は. Topic は is spoken わ and object を is お. Pauses follow complete phrase groups and sentence punctuation, never precede a particle. Marin is instructed to use normal connected conversation rather than syllable-by-syllable demonstration.

Reading/context references include the user's explicit furigana, the [Marukome koji product page](https://www.marukome.co.jp/product/koji/shiokoji/all/), [Hanamaruki's salt-koji terminology](https://www.hanamaruki.co.jp/shiokoji-lineup.html), and [Kanjipedia's 量る entry](https://www.kanjipedia.jp/kotoba/0007173000). Exact lexical pitch matches and their variants come from the pinned [Kanjium accent dictionary](https://raw.githubusercontent.com/mifunetoshiro/kanjium/9ebca4589565c696e7c39e089e2e928ad65f678c/data/source_files/raw/accents.txt), SHA-256 `8bd0dd127dab32ceec94cb03ab1ba6b68858ea73421dfa1731af2f373deb4f20`. Full-sentence intonation and unconfirmed specialist-compound targets remain provisional under the user's standing authorization; component sources are retained without claiming a verified phrase contour.

All 16 final files decode with non-silent signal and no measured clipped samples. Automated transcripts (without expected-text prompting), file hashes, durations and low-energy-gap measurements are in `docs/stories-audio-audit.json`. Two initial transcription ambiguities (そうです and 水) and several longer gaps prompted six targeted rerenders. Final transcript content matches the intended messages, allowing script, particle-spelling and punctuation normalization.

These checks are **not actual listening verification**. Audible pitch, voice consistency, naturalness and smoothness have not been listening-verified. Gap measurements include legitimate sentence breaks and cannot establish smoothness. Use `python3 scripts/audit-story-audio.py --card story-shiokoji-01 --transcribe` to repeat the automated checks.

## Story 2 — Filleting horse mackerel

The 21 messages in `story-aji-02` use the same Marin model and generation speed 1.0. Contextual reading review distinguishes fish 鰺/アジ from the homophone 味, retains 三枚 → さんまい, 中骨 → なかぼね, 尾 → お, and the knife-angle sense of 寝かせる. In 指は刃から離して, the topic particle is わ while lexical 刃 and 離して keep は. 向こう側 and 反対側 retain their full readings; 反対側は is はんたいがわわ. The distinction between rotating the fish on the board and flipping it over is preserved.

Cooking context was cross-checked with [Ajinomoto's three-piece filleting guide](https://park.ajinomoto.co.jp/contents/basic/vege_handling/azi/) and the [Kikkoman guide](https://www.kikkoman.co.jp/homecook/basic/seafood/aji.html). Exact lexical pitch references (including fish 鰺, not an unrelated homophone) are retained from the same pinned accent dictionary. Full sentences and unconfirmed phrase targets remain provisional natural Tokyo intonation. Context, inputs, variants and phrase guidance are stored with the Story 2 review entries.

The audit JSON retains file hashes, raw automated transcripts and PCM measurements. These are automated content/signal checks, not listening verification of naturalness, audible pitch, voice quality or smoothness.

Story 2 completion: all 21 recordings enabled. Seven initial content/word-grouping flags received targeted rerenders; final transcripts preserve all intended messages. All files decode with non-silent signal and zero measured clipping. Playback mapping and navigation are checked in the browser. None of these checks constitutes listening verification.

## Story 3 — A first knife-forging lesson

The 22 messages in `story-forging-03` use Marin (`gpt-4o-mini-tts`) at generation speed 1.0. Context review checks 保護 → ほご, 鉄 → てつ, 合図 → あいず, 幅 → はば, and the long vowel/gemination in はんまー and ほうちょう. Greeting こんにちは is spoken こんにちわ; the topic in 今日は is きょうわ. Lexical は in ハンマー, 幅 and はい is retained while the topics ハンマーは and 手は are はんまーわ and てわ.

The [Sakai cutlery guild's forging process](https://www.sakaihamono.or.jp/hamono06_a.html) supplies the material/hammer context. Exact lexical pitch entries and listed variants are retained in the review; unconfirmed compound and sentence contours remain provisional Tokyo Japanese. Recording-level content/signal checks and any rerenders are recorded separately in the audit JSON; none establishes listening verification.

Story 3 completion: 22 final recordings enabled. Five messages received targeted rerenders, with an additional grip-question retry to preserve the object particle. All final transcripts match the intended content allowing script/punctuation normalization; all files decode non-silently with no measured clipping. Existing Story 1–2 recordings are retained. Playback mapping and navigation are browser-checked; audible pitch and smoothness remain unverified by listening.

## Story 4 — Choosing a nakiri at a knife shop

The 18 `story-knife-shop-04` messages use Marin (`gpt-4o-mini-tts`) at generation speed 1.0. Reading/context review distinguishes 柄 → え (handle) from がら/つか; uses 鋼材 → こうざい, 炭素鋼 → たんそこう, 両刃 → りょうば, 水気 → みずけ and 砥石 → といし; and preserves lexical 刃 は alongside topic わ. 家では remains connected いえでわ. The supplied short knife names 菜切 and 三徳 retain なきり and さんとく.

Knife/material context references are [KAI's blade and handle construction page](https://www.kai-group.com/products/special/hocho/learn/material/) and [Ichimonji's nakiri description](https://www.ichimonji.co.jp/collections/all/products/kiyoshin). Exact lexical accent references and variants are retained from the pinned dictionary. The shorter 菜切 is not assigned the accent of the longer 菜切り包丁; an unqualified 三徳 dictionary entry is not used as proof of the knife-sense contour. These knife-name and full-sentence targets remain provisional natural Tokyo Japanese under the standing authorization.

Exact phonetic inputs and phrase guidance are stored in the review. File hashes, raw transcripts, decoding/signal and internal-gap measurements are stored in the audit. Audible pitch, smoothness and timbre are not listening-verified.

Story 4 completion: 18 final clips enabled. Five messages received targeted rerenders; three received follow-up refinements for 菜切, topic grouping and pacing. Final transcripts preserve intended content with script/particle/punctuation normalization. All files decode non-silently with zero measured clipping. Story 1–3 recordings are retained,. Playback mappings and navigation are checked in the browser; audible pitch and smoothness are not listening-verified.

## Story 5 — Cooking Japanese food in Switzerland

The 20 `story-swiss-ingredients-05` messages use Marin (`gpt-4o-mini-tts`) at generation speed 1.0. The review retains しそ / みょうが, こうじ / しおこうじ, パセリ → ぱせり, チャイブ → ちゃいぶ, ハーブ → はーぶ and 生 → なま. It distinguishes food-dressing 和える from other あえる homophones, and taste 味 from the horse-mackerel 鰺 in Story 2. Lexical は remains in ハーブ, 手に入らない and はい; topic particles are reviewed separately, including まずは → まずわ and パンは → ぱんわ. スイスでは stays continuous すいすでわ.

[S&B's chives terminology](https://www.sbfoods.co.jp/products/detail/09204.html), the previously reviewed koji producer references, the user-provided furigana and exact pinned lexical dictionary entries support the reading/context review. Dictionary variants and selected lexical accents remain in the review. Full-sentence and unconfirmed compound contours, including whole 塩麹 phrases, remain provisional natural Tokyo Japanese.

The audit records raw ASR transcripts without expected-text prompting, file hashes and PCM measurements. These checks do not constitute listening verification of audible pitch or smoothness.

Story 5 completion: 20 final recordings enabled. Four messages received targeted rerenders, plus a further daikon-availability refinement. Final transcripts preserve intended words/particles with script and punctuation normalization. All final files decode non-silently with zero measured clipping. Stories 1–4 and the visible story text are preserved. Browser checks cover all 97 message buttons, playback at 1x and audio cleanup. None establishes actual listening verification of pitch or smoothness.

## Story 6 — Meeting the teacher for the first time

All 23 messages enabled with Marin (`gpt-4o-mini-tts`) at generation speed 1.0. User furigana, contextual readings, phrase boundaries and exact lexical dictionary accent matches were reviewed before rendering. Full-sentence pitch remains provisional. Automated transcription checked all lines; lines 4 and 11 were regenerated to resolve unclear initial transcripts. Final transcripts retain the intended dialogue. All clips decode as non-silent PCM with no measured clipping. Actual audible pitch and smoothness have not been listening-verified.

## Story 7 — Chatting over tea

All 20 messages enabled with Marin (`gpt-4o-mini-tts`) at generation speed 1.0. User furigana, contextual readings and phrase boundaries reviewed before rendering, including 29日 にじゅうくにち, 夫 おっと, lexical は in 話せる, and 長居 ながい. Exact lexical accent matches and variants retained from the pinned dictionary; whole-sentence intonation provisional. Automated transcripts compared with all dialogue; lines 9, 10 and 18 regenerated to resolve extra/missing wording. Final transcripts retain the intended content. Non-silent PCM, zero measured clipping. Audible pitch and smoothness have not been listening-verified.

## Story 8 — Talking about the trip

All 22 messages enabled with Marin (`gpt-4o-mini-tts`) at generation speed 1.0. Reviewed supplied furigana, contextual particles, contracted spoken forms, phrase boundaries and lexical dictionary accent matches before rendering. Whole-sentence pitch remains provisional. Retained スイス すいす, 香港 ほんこん, 新潟 にいがた, 三条 さんじょう, 29日 にじゅうくにち and 入れて はいれて. Line 10 regenerated with light phrase boundaries after complete phrases to resolve extra-word grouping in transcription; final ASR writes the place name as 山城, a possible homophonic spelling. Input remains explicitly さんじょう; exact audible proper-name/date reading is not independently verified by ASR. All clips decode as non-silent PCM with zero measured clipping. Audible pitch and smoothness have not been listening-verified.

## Story 9 — The new restaurant by the station

All 26 messages enabled with Marin (`gpt-4o-mini-tts`) at generation speed 1.0, including Play all. Reviewed supplied furigana, casual contractions, contextual particles, long vowels, doubled consonants and phrase boundaries before rendering. Preserved 美咲 みさき, 温かい あったかい, 空いてる あいてる and lexical は in 半分 はんぶん. Exact lexical dictionary accent matches and variants retained; full-sentence intonation provisional. Lines 4, 14, 15 and 19 regenerated to resolve transcript omissions/changes. Final transcripts retain intended content; ASR spelling 作んだ for つくんだ and expansion じゃ to じゃあ remain recorded as transcription ambiguities. All clips decode as non-silent PCM with zero measured clipping. Audible pitch and smoothness have not been listening-verified.

## Story 10 — Chores before dinner

All 24 messages enabled with Marin (`gpt-4o-mini-tts`) at generation speed 1.0, including Play all. Reviewed supplied furigana, contextual particles, casual contractions, long vowels, doubled consonants and phrase boundaries before rendering. Preserved lexical は in ご飯/ハンガー/入ってる/箸, 片付ける かたづける, and 明日 あした. Exact lexical dictionary accent matches retained, including 箸 in the chopsticks sense; whole-sentence intonation provisional. Lines 4–9, 22 and 23 regenerated after unclear or omitted wording. Primary ASR still substitutes 片付けて on line 9, while independent whisper-1 without expected-text prompting recognizes かかってない. Line 22 primary ASR omits うん; secondary recognizes it but inserts an object particle in its transcript. Both raw results retained as recognition disagreements. Casual ありがと/じゃ expand to ありがとう/じゃあ in primary ASR. All clips decode as non-silent PCM with zero measured clipping. Audible pitch and smoothness have not been listening-verified.

## Story 11 — Husbands and birthday plans

All 26 messages enabled with Marin (`gpt-4o-mini-tts`) at generation speed 1.0, including Play all. Reviewed user furigana, contextual particles, contractions, phrase boundaries, long vowels and doubled consonants before rendering. Preserved 香織 かおり, negative ううん versus affirmative うん, 四つ よっつ, 二人 ふたり, 一人二個 ひとりにこ and 今日中 きょうじゅう. Exact lexical dictionary accent matches and variants retained; full-sentence intonation provisional. Lines 5, 8, 14, 15 and 24 regenerated after unclear or missing wording. Independent whisper-1 without expected-text prompting retains the initial うん in lines 5 and 8 omitted by primary ASR; both results recorded. Primary ASR normalizes line 9 そっか to そうか. Non-silent PCM and zero measured clipping for every clip. Audible pitch and smoothness have not been listening-verified.
