/* Run with: osascript -l JavaScript tests/furigana.test.js */
ObjC.import("Foundation");
function read(path) {
  return $.NSString.stringWithContentsOfFileEncodingError(path, $.NSUTF8StringEncoding, null).js;
}
function assert(condition, message) {
  if (!condition) throw new Error(message);
}
const root = $.NSFileManager.defaultManager.currentDirectoryPath.js + "/";
const source = read(root + "app.js");
const speechSource = source.slice(source.indexOf("  function getJapaneseSpeechText("), source.indexOf("  function setSpeechButtonState("));
const speechText = new Function(`${speechSource}\nreturn getJapaneseSpeechText;`)();
const grammar = JSON.parse(read(root + "data/golden-grammar.json"));
assert(grammar.length === 189, "Grammar drill keeps all 189 questions");
const first = grammar.find((question) => question.id === "golden-grammar-q01");
assert(speechText(first.question) === "いま、えきでともだちを …… 。", "Speech uses explicit readings and removes the verb hint and English translation");
const reason = grammar.find((question) => question.id === "golden-grammar-q07");
assert(reason.question.includes("明日(あした)"), "Tomorrow has the intended everyday reading");
assert(speechText(reason.question).includes("あした"), "Tomorrow is passed to speech as ashita");
const time = grammar.find((question) => question.id === "golden-grammar-q46");
assert(speechText(time.question).includes("じゅっぷん"), "Ten minutes is distinguished from sufficient");
const desire = grammar.find((question) => question.id === "golden-grammar-q02");
assert(speechText(desire.formation).includes("はなします"), "Verb formation does not read hanashi-shimasu");
for (const question of grammar) {
  for (const text of [question.question, ...question.answers, question.formation, question.casualForm, question.jpExplanation]) {
    if (/[一-龯]/.test(text)) assert(/[（(][ぁ-ゖー]+[）)]/.test(text), `${question.id} has readings in each Japanese field`);
  }
}
const conjugation = JSON.parse(read(root + "data/conjugation-drill.json"));
for (const question of conjugation) {
  assert(question.acceptedAnswers.includes(question.answers[0]), `${question.id} keeps its accepted answer`);
}
const bank = JSON.parse(read(root + "data/game-prototype.json"));
const normalize = (text) => text.replace(/[（(][ぁ-ゖァ-ヺー・\s]+[）)]/g, "").replace(/[、。！？?\s]/g, "");
for (const question of bank) {
  assert(question.acceptedSequences.some((sequence) => {
    assert(new Set(sequence).size === sequence.length, `${question.id} never reuses a physical tile`);
    assert(sequence.every((index) => Number.isInteger(index) && index >= 0 && index < question.chunks.length), `${question.id} has valid tile indexes`);
    return normalize(sequence.map((index) => question.chunks[index]).join("")) === normalize(question.answers[0]);
  }), `${question.id} can still build its canonical sentence`);
}
console.log("PASS: grammar readings, speech output, conjugation accepted answers, and all 100 sentence-building exercises.");
