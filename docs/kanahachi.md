# かなハチ

The single orange bee on the main menu opens the dictionary-backed game. Find any ten valid readings using the seven kana and required centre, then continue playing if you like. New puzzles favour at least five app-vocabulary answers while retaining ten common dictionary answers.

See [current game documentation](kanahachi-dictionary.md) for rules, vocabulary sources, offline use, dictionary licensing and verification.

The earlier app-only game and its UI were removed. Its normalization, vocabulary extraction, homophone handling, answer validation, save restoration and audio lookup helpers are retained in `js/games/kanahachi-core.js` because the current game uses them. The old UI, random board generator and old loader are not shipped.

Existing dictionary-game progress remains under `washoku-kanahachi-dictionary-v1`; it is not reset or overwritten with app-only progress. Both `#kanahachi` and previous `#kanahachi-dictionary` links open the retained game, using `#kanahachi` as the current route. Historical app-only save data is left untouched but no longer read.

Earlier implementation notes are retained in [historical-kanahachi-v1.md](historical-kanahachi-v1.md).
