# Project scripts

Run scripts from the repository root. They resolve project files from their own location and require no folder-specific working directory.

- Vocabulary: `export-topic-vocabulary.js`, `build-topic-vocabulary.py`, and `export-topic-vocabulary-list.py` build/export the 単語 deck and its readable list.
- Dictionary Bee: `build-kanahachi-dictionary.py --source /path/to/pinned-release.zip` builds the JMdict dataset and ten-common-word boards. See `docs/kanahachi-dictionary.md` for source, checksum and licence. It does not generate audio.
- Audio export: `export-lesson-audio.js`, `export-game-audio.js`, `export-taste-audio.js`, and `export-zukan-audio.js` collect display keys and readings.
- Audio generation: `generate-lesson-audio.py` and the other `generate-*-audio.py` / Marin / word-batch scripts render reviewed inputs. Read `../AGENTS.md` first. Use a generator's `--dry-run` option when available to validate without rendering.
- Review inputs: `lesson-audio-reviews/`, `vocabulary-audio-reviews/`, `word-explosion-batches/`, and the speech override / pitch review JSON files preserve pronunciation decisions and historical batches.
- Artwork: `export-knife-card-illustrations.py` extracts the existing illustrations.
- Historical comparison: `export-tts-sample.js` and `generate-tts-sample.py` belong to the older Nova/Shimmer experiment; the page lives in `tools/`. Current recordings use the preferences in `AGENTS.md`.
- Audio maintenance: `cleanup-unused-audio.py` defaults to an audit. Its `--delete` mode can prune historical records; do not use it merely because an old clip is absent from a current playback manifest. The file-organization cleanup protected both current references and historical reviews.

Playback JavaScript manifests are generated in `js/audio/`; recordings and their JSON manifests remain in `audio/`. Do not move review JSON files without updating the exporters and generators.
