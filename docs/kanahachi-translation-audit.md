# かなハチ vocabulary meaning audit — 2026-10-14

## Confirmed importer error

The game assigned `Number ${word.number}` to every counting-table row without an `english` field. All 455 existing rows lacked that field, so valid Japanese words acquired misleading English labels. The source `number` field was a table label, not a complete word translation. For example, `10年 / じゅうねん` has table value `10`; its meaning is **10 years**.

Added an explicit context-aware `english` field to every counting row and removed the generic fallback from `extractVocabulary`. Future number-table entries without an English meaning are omitted rather than given an invented label. Readings, spellings, speech lookup keys, and recordings are preserved.

Examples after correction:

| Reading | Meaning |
| --- | --- |
| じゅうねん | 10 years |
| じゅうがつ | October |
| じゅっかげつ | 10 months |
| じゅうにん | 10 people |
| じゅっさい | 10 years old |
| ついたち | 1st day of the month |
| いちにち | 1 day |
| とおか | 10th day of the month; 10 days — separate source senses |
| げつようび | Monday |
| いっかい | Once; Floor 1 (Japanese floor numbering) — separate source senses |

Plain-number labels remain in the actual Numbers card. Number/position labels remain in the `〜番` table. Dates, calendar months, calendar years, clock times, durations, people, objects, books, drinks, ages, frequencies, money, animals, floors, servings, and other cooking measures have their own contextual meanings. Calendar dates and duration readings are not conflated. Japanese first-floor numbering is made explicit to avoid the ground-floor/first-floor convention difference.

The Japan Foundation's [Irodori word list](https://www.irodori.jpf.go.jp/assets/data/wordlist_Y.pdf) confirms the distinction between months/years as duration units and calendar labels, including `〜年` as “for ～ years.”

## Other vocabulary clarification

- `data/washoku-cards.json`: 甘味 → **Sweetness**, 酸味 → **Sourness**, 苦味 → **Bitterness**, replacing adjective labels Sweet/Sour/Bitter. These now agree with the noun meanings in the food-reference and topic vocabulary decks. [MAFF's basic-taste material](https://www.maff.go.jp/j/keikaku/syokubunka/syokuiku/pdf/sry.pdf) identifies these as taste qualities.
- `data/taste-words.json`: ねぎ → **Japanese bunching onion / Welsh onion**, replacing the less precise “Japanese leek.” The [Japan Tourism Agency's shiro-negi description](https://www.mlit.go.jp/tagengo-db/en/R1-02596.html) identifies it as Welsh onion; [MAFF's variety-testing material](https://www.hinshu2.maff.go.jp/info/sinsakijun/kijun/1036.pdf) uses “Welsh Onion, Japanese Bunching Onion.”

## Scope and limitations

The audit inspected the import paths for all 20 contributing source IDs and compared exact spelling/reading pairs across their 3,031 usable readings. It reviewed 36 cross-source gloss discrepancies flagged by different English keywords. Most were legitimate synonyms or domain-specific senses: 柔らかい soft/tender, 傘 mushroom cap/umbrella, 腹 fish belly/blade face, and animal-specific ハラミ cuts. These are retained as separate meanings rather than forced into one gloss.

This is an importer and cross-source vocabulary-consistency audit. It does not certify every specialist term or every example sentence, grammar explanation, quiz answer, or separate 図鑑 translation. No additional translation error was confirmed by this focused comparison beyond the counting fallback; four noun/name glosses were clarified as described above.

Current dictionary: **3,031 readings / 3,365 spelling-and-meaning variants**. Reading exclusions remain 4 unsupported/ambiguous readings and 27 one-kana occurrences.

## Validation

`tests/kanahachi.test.js` checks all counting rows have explicit meanings; years/months/date/duration/people/age/frequency/floor meanings survive aggregation; counter homophones retain their senses; and a future counter with no meaning never gets an invented “Number” label. Existing normalization, scoring, puzzle generation, persistence, and audio-resolution checks pass.

`tests/reading-card.test.js` passes for all 230 food cards, including source wording, readings, bilingual titles, audio, and navigation. No audio was generated or replaced for this audit.

## Reading-import follow-up

Corrected 24 ingredient entries whose whole-word furigana had been attached to only their kanji suffix, doubling a kana prefix during import. For example, `かいわれ大根(かいわれだいこん)` is now `かいわれ大根(だいこん)`, with an explicit complete reading `かいわれだいこん`. The game prioritizes that explicit reading. Original displayed spellings, English meanings, and reviewed speech keys are preserved. The same correction covers entries such as ほうれん草, ひよこ豆, サラダ菜, and ムール貝.

Rechecked imported reading-versus-speech differences: only 11 intentional written を versus spoken お differences remain in the heat-control vocabulary. No global kana deduplication or particle replacement was applied. The current dictionary has 3,028 usable readings.
