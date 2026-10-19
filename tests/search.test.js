/* Run with: osascript -l JavaScript tests/search.test.js */
ObjC.import("Foundation");
function read(path) {
  return $.NSString.stringWithContentsOfFileEncodingError(path, $.NSUTF8StringEncoding, null).js;
}
function assert(condition, message) {
  if (!condition) throw new Error(message);
}
const root = $.NSFileManager.defaultManager.currentDirectoryPath.js + "/";
const host = {};
for (const file of ["js/app.js", "js/ui/search.js", "js/games/word-explosion.js", "js/games/word-explosion-2.js"]) {
  const script = new Function("window", read(root + file));
  if (["js/ui/search.js", "js/games/word-explosion.js"].includes(file)) script(host);
}
const search = host.WashokuSearch;
const text = search.searchableText({ question: "御飯(ごはん)を食(た)べる", enExplanation: "Eat RICE", chunks: ["ゴハン"] });
assert(text.includes(search.normalize("御飯を食べる")), "Find kanji across furigana annotations");
assert(text.includes(search.normalize("ごはん")), "Find readings");
assert(search.searchableText("日本(にほん)語(ご)").includes("にほんご"), "Find complete readings across adjacent furigana");
assert(text.includes(search.normalize("rice")), "English is case insensitive");
assert(search.normalize("ゴハン") === search.normalize("ごはん"), "Match katakana and hiragana");
assert(search.normalize("ＲＩＣＥ") === "rice", "Normalize full-width English");
const game = host.WordExplosionGame;
const entries = game.parseVocabulary(read(root + "data/word-explosion.txt"));
for (let i = 0; i < 100; i++) {
  const target = entries[i % entries.length];
  const round = game.createRound(entries, target);
  assert(round.words.some((word) => word.japanese === target.japanese && word.kanji === target.kanji), "Search target is in the round");
  assert(new Set(round.words.map((word) => word.japanese)).size === 3, "Targeted rounds have distinct answers");
}
console.log("PASS: script syntax, English/Japanese search normalization, and 100 targeted game rounds.");
