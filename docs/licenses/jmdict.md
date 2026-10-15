# JMdict attribution and licence

The Japanese-English dictionary data in `data/dictionaries/kanahachi-jmdict.json` is derived from JMdict, copyright James William BREEN and the Electronic Dictionary Research and Development Group (EDRDG).

Used under the **Creative Commons Attribution-ShareAlike 4.0 International** licence. This derived dictionary data is distributed under the same licence. No endorsement by the dictionary authors is implied. The application source code and existing app vocabulary are separate from this dictionary dataset.

- Original project: https://www.edrdg.org/wiki/JMdict-EDICT_Dictionary_Project.html
- EDRDG licence statement: https://www.edrdg.org/edrdg/licence.html
- Licence: https://creativecommons.org/licenses/by-sa/4.0/
- Full licence text: [CC-BY-SA-4.0.txt](CC-BY-SA-4.0.txt)
- JSON conversion: https://github.com/scriptin/jmdict-simplified
- Pinned release: `3.6.2+20261012204142`, dictionary date 2026-10-12.
- Archive SHA-256: `9a04fc1d0facf87645f8ec7cdaa370647d4a8f59131f6e2a614bcd680f855b85`.

Modifications: normalized katakana readings to hiragana; retained reading/spelling/sense restrictions; filtered unsupported readings, one-kana entries, words requiring more than seven distinct kana, search-only/obsolete/rare kana variants, outdated kanji variants, proper-name senses, archaic/obsolete senses, X-tagged senses, and entries containing only bound affix/auxiliary/counter senses; shortened English glosses to the first three translations of up to three eligible senses; retained source entry IDs; marked common readings from the supplied reading-level common flags; compiled seven-kana boards with at least ten common answer readings.

The import does not invent readings or generate conjugations. Dictionary coverage is broad but not exhaustive of every possible Japanese word. Priority labels are an approximation of commonness. App vocabulary is added independently at runtime, using explicit entries only.

Rebuild with `python3 scripts/build-kanahachi-dictionary.py --source /path/to/pinned-release.zip`. The archive URL and checksum are stored in the generated data and builder. The original archive is not shipped with the app.
