/* Run with: osascript -l JavaScript tests/word-explosion.test.js */
ObjC.import("Foundation");
function read(path) {
  return $.NSString.stringWithContentsOfFileEncodingError(path, $.NSUTF8StringEncoding, null).js;
}
const root = $.NSFileManager.defaultManager.currentDirectoryPath.js + "/";
const host = {};
new Function("window", read(root + "word-explosion.js"))(host);
const game = host.WordExplosionGame;
function assert(condition, message) {
  if (!condition) throw new Error(message);
}
function rejects(text) {
  let failed = false;
  try { game.parseVocabulary(text); } catch (_) { failed = true; }
  assert(failed, "Malformed vocabulary should be rejected");
}
const entries = game.parseVocabulary(read(root + "word explosion.txt"));
assert(entries.length >= 3, "Vocabulary supports a complete round");
const examples = JSON.parse(read(root + "data/word-explosion-examples.json"));
assert(Object.keys(examples).length === entries.length, "Example bank matches the vocabulary");
entries.forEach((entry) => {
  const example = examples[entry.japanese];
  assert(example && typeof example.japanese === "string" && example.japanese.trim(), `Japanese example for ${entry.english}`);
  assert(typeof example.english === "string" && example.english.trim(), `English translation for ${entry.english}`);
  assert(!/[{}]|<\/?(?:ruby|rt)>/.test(example.japanese), "Examples use parenthetical readings");
});
const extended = game.parseVocabulary(read(root + "word explosion.txt") + "\nred | あか\n");
assert(extended.length === entries.length + 1, "New text lines become vocabulary without code changes");
const tolerant = game.parseVocabulary("\uFEFF# words\r\nApple | りんご\r\n\r\nfox | きつね\r\ncat | ねこ\r\nAPPLE | あか\r\nfruit | りんご\r\n");
assert(tolerant.length === 3, "Ignore blank/comment lines and duplicate prompts/answers");
rejects("apple | りんご\nfox | きつね");
rejects("apple | apple\nfox | きつね\ncat | ねこ");
rejects("apple | りんご | extra\nfox | きつね\ncat | ねこ");
const fixed = game.parseVocabulary("apple | りんご\nfox | きつね\ncat | ねこ");
let round = game.createRound(fixed);
function tileFor(round, char) {
  return round.tiles.find((tile) => tile.character === char && !tile.used && !round.selected.includes(tile.id));
}
const first = tileFor(round, "り");
assert(game.selectTile(round, first.id).type === "pending", "Valid prefix remains selected");
assert(game.selectTile(round, first.id).type === "ignored", "Cannot select one physical tile twice");
assert(game.selectTile(round, tileFor(round, "き").id).type === "wrong", "Reject impossible prefix");
assert(round.selected.length === 0 && round.tiles.every((tile) => !tile.used), "Mistakes return every selected tile");
assert(game.selectTile(round, -1).type === "ignored", "Ignore unknown tile IDs");
function solve(round, word) {
  let result;
  Array.from(word.japanese).forEach((char) => {
    const tile = tileFor(round, char);
    assert(Boolean(tile), "Required character remains in the shared pool");
    result = game.selectTile(round, tile.id);
  });
  assert(result.type === "correct", "Exact word completes automatically");
  return result;
}
const apple = round.words.find((word) => word.english === "apple");
assert(!solve(round, apple).complete, "One word does not clear the round");
assert(round.tiles.filter((tile) => tile.used).length === 3, "Consume exactly the matched word's tiles");
assert(game.selectTile(round, first.id).type === "ignored", "Consumed tiles cannot be used again");
for (let run = 0; run < 200; run += 1) {
  round = game.createRound(entries);
  assert(new Set(round.words.map((word) => word.english)).size === 3, "Three distinct prompts");
  assert(new Set(round.tiles.map((tile) => tile.id)).size === round.tiles.length, "Repeated characters have distinct tile IDs");
  assert(round.tiles.map((tile) => tile.character).sort().join("") ===
    Array.from(round.words.map((word) => word.japanese).join("")).sort().join(""), "Tile multiset exactly matches answers");
  // Exact prefixes complete immediately, so solve shorter words first.
  const order = [...round.words].sort((a, b) => a.japanese.length - b.japanese.length);
  order.forEach((word, index) => assert(solve(round, word).complete === (index === 2), "Clear only after all three matches"));
  assert(round.tiles.every((tile) => tile.used), "No leftover characters after clearing");
  assert(round.selected.length === 0, "Selection clears after matching");
}
assert(entries.every((entry) => entry.completed === undefined), "Round generation does not mutate vocabulary");
new Function(read(root + "app.js"));
"PASS: example coverage, parsing, extensibility, wrong-prefix recovery, duplicate tiles, consumption, and 200 complete rounds.";
