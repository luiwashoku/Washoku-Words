# Tests

Run from the repository root. Tests remain together so their `../index.html` and project-root references stay consistent.

- `*.test.py`: Python data, source coverage, audio provenance and file-layout checks. Run `python3 tests/<name>.test.py`.
- `*.test.js` using `ObjC.import`: macOS JavaScript for Automation checks. Run `osascript -l JavaScript tests/<name>.test.js`. The かなハチ test additionally takes `"$PWD"` as its project-root argument.
- `*-browser.html`: browser integration pages. Start the root HTTP server, then open `/tests/<name>-browser.html`. Each reports PASS or FAIL and exercises the real app in an iframe.
- `money-cat-audio.test.js` and `zukan-offline.test.js`: asynchronous browser test helpers; they require the game or offline source to be supplied by a harness.

Useful checks after a file move: `project-layout.test.py`, `topic-vocabulary-cards.test.py`, `grammar-example-coverage.test.py`, `kanahachi.test.js`, and the home icon, vocabulary, grammar, game, and offline browser pages.

Some older tests describe previous deck sizes, positions or voices. Their pre-existing failures are recorded in `docs/file-organization.md`; they were compared against the original files rather than silently removed or weakened.
