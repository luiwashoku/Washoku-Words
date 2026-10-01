# 図鑑 kanji-input audit

Audit date: 2026-10-01. All 1,524 entries across 56 pages were checked against the generator inputs and saved manifest. Each manifest path matches the hash of the current input and Nova settings.

The initial audit found 36 entries (34 unique speech inputs) sending kanji to Nova. This is a text/input audit, not a listening audit: the table identifies candidates to review, not confirmed pronunciation errors. Intended readings below come from the deck.

Peach (桃), persimmon (柿), and shiitake (椎茸) now use hiragana-only replacement inputs. Several earlier replacements introduced kanji instead of retaining the explicit reading.

| Page | Entry | Intended reading | Actual Nova input | Review focus |
| --- | --- | --- | --- | --- |
| 2 | 笹の葉 | ささのは | 笹の葉 | Check 葉 is pronounced は rather than treated as a particle |
| 2 | 柿の葉 | かきのは | 柿の葉 | Check 葉 is pronounced は rather than treated as a particle |
| 2 | 桜の葉 | さくらのは | 桜の葉。 | Check 葉 is pronounced は rather than treated as a particle |
| 2 | 朴の葉 | ほおのは | ほおの葉 | Check 葉 is pronounced は rather than treated as a particle |
| 3 | フェンネルの葉 | ふぇんねるのは | フェンネルの葉 | Check 葉 is pronounced は rather than treated as a particle |
| 3 | ローリエ／月桂樹の葉 | ろーりえ／げっけいじゅのは | ローリエ。月桂樹の葉 | Check 葉 is pronounced は rather than treated as a particle |
| 4 | 梨 | なし | 梨。 | Short standalone kanji: check chosen reading |
| 7 | 牡蠣 | かき | 牡蠣。 | Check word reading and pitch; kana alone does not guarantee pitch |
| 8 | 牡蠣 | かき | 牡蠣。 | Check word reading and pitch; kana alone does not guarantee pitch |
| 9 | 絞る | しぼる | 絞る。 | Kanji input; check against explicit reading |
| 9 | わたを取る | わたをとる | わたを取る。 | Kanji input; check against explicit reading |
| 11 | えらを取る | えらをとる | えらを取る。 | Kanji input; check against explicit reading |
| 12 | 締める | しめる | 締める。 | Kanji input; check against explicit reading |
| 13 | 煮干し | にぼし | 煮干し。 | Kanji input; check against explicit reading |
| 14 | 塩昆布 | しおこんぶ | 塩昆布。 | Kanji input; check against explicit reading |
| 14 | 茎わかめ | くきわかめ | 茎わかめ。 | Kanji input; check against explicit reading |
| 14 | 海ぶどう | うみぶどう | 海ぶどう。 | Kanji input; check against explicit reading |
| 15 | 煮干し | にぼし | 煮干し。 | Kanji input; check against explicit reading |
| 15 | 焼きあご | やきあご | 焼きあご。 | Kanji input; check against explicit reading |
| 17 | 白だし | しろだし | 白だし。 | Kanji input; check against explicit reading |
| 17 | ラー油 | らーゆ | ラー油。 | Kanji input; check against explicit reading |
| 19 | 深鉢 | ふかばち | 深鉢。 | Kanji input; check against explicit reading |
| 19 | 箸 | はし | 箸 | Check word reading and pitch; kana alone does not guarantee pitch |
| 19 | 箸置き | はしおき | 箸置き | Kanji input; check against explicit reading |
| 20 | 豆味噌 | まめみそ | 豆味噌。 | Kanji input; check against explicit reading |
| 24 | 柿の葉寿司 | かきのはずし | 柿の葉寿司 | Check 葉 is pronounced は rather than treated as a particle |
| 35 | 鷲 | わし | 鷲 | Short standalone kanji: check chosen reading |
| 36 | 蛾 | が | 蛾 | Short standalone kanji: check chosen reading |
| 36 | 蚊 | か | 蚊 | Short standalone kanji: check chosen reading |
| 36 | 蝿 | はえ | 蝿 | Short standalone kanji: check chosen reading |
| 40 | 栗 | くり | 栗 | Short standalone kanji: check chosen reading |
| 42 | 歯ブラシ | はブラシ | 歯ブラシ | Kanji input; check against explicit reading |
| 42 | 歯磨き粉 | はみがきこ | 歯磨き粉 | Kanji input; check against explicit reading |
| 54 | 歯医者 | はいしゃ | 歯医者 | Kanji input; check against explicit reading |
| 55 | 辺 | へん | 辺 | Short standalone kanji: check chosen reading |
| 55 | 幅 | はば | 幅 | Short standalone kanji: check chosen reading |

After the audit, the user requested replacement of all remaining kanji inputs and hiragana-only input for future Nova recordings. The exporter now derives hiragana from the explicit readings, and both exporter and generator reject kanji/katakana before API calls. All 1,524 current inputs were checked: zero retain kanji. Oyster uses かき。 and scallop uses ほたて。. The table above records the pre-replacement findings. Removing kanji from speech inputs would prevent kanji reading selection, but cannot guarantee correct pitch accent, vowel length, or clear articulation. Words already generated from kana can still be pronounced poorly.
