/* Run with: osascript -l JavaScript tests/reading-card.test.js */
ObjC.import("Foundation");
function read(path) { return $.NSString.stringWithContentsOfFileEncodingError(path, $.NSUTF8StringEncoding, null).js; }
function assert(value, message) { if (!value) throw new Error(message); }
const source = read("app.js");
new Function(source);
function extract(start, end) { return source.slice(source.indexOf(`  function ${start}(`), source.indexOf(`  function ${end}(`)); }
const validate = new Function(extract("isValidQuestion", "renderCurrentQuestion") + "return isValidQuestion;")();
const cards = JSON.parse(read("data/taste-words.json"));
const catalog = JSON.parse(read("data/catalog.json"));
assert(cards.length === 230 && cards.every(validate), "All 230 reading cards load without quiz answers or grading");
assert(new Set(cards.map(card => card.id)).size === cards.length, "Unique card IDs");
assert(catalog.find(c => c.id === "taste-words").questionCount === cards.length, "Catalog count matches");
assert(catalog.find(c => c.id === "taste-words").category === "basics", "Deck is in basics");
const card = cards[0];
const stripReadings = text => text.replace(/\([ぁ-ゖ]+\)/g, "");
const lines = read("nopush/コシヒカリ.txt").split(/\r?\n/).map(line => line.trim()).filter(Boolean);
const starts = lines.map((line, index) => line === "香り" ? index - 1 : -1).filter(index => index >= 0);
assert(starts.length === 70, "Every source food is included");
cards.slice(0, starts.length).forEach((food, index) => {
  const block = lines.slice(starts[index], starts[index + 1] || lines.length);
  assert(stripReadings(food.question) === block[0], "Food titles match source order");
  assert(food.sections.length === 3, "Three descriptions per card");
  food.sections.forEach(section => {
    const position = block.indexOf(stripReadings(section.title));
    assert(position > 0 && block[position + 1] === stripReadings(section.japanese), "Japanese wording preserved in its section");
    assert(block.includes(section.english), "English keywords preserved");
    assert(!/[一-龯々]/.test(section.japanese.replace(/[一-龯々]+\([ぁ-ゖ]+\)/g, "")), "Description kanji have readings");
  });
});
const addedTitles = ["刺身", "炙り", "塩焼き", "煮魚", "干物", "天ぷら", "だし巻き卵", "茶碗蒸し", "味噌汁", "お吸い物"];
cards.slice(70, 80).forEach((food, index) => {
  assert(stripReadings(food.question) === addedTitles[index], "New foods follow supplied order");
  assert(food.sections.length === 3, "New foods use three sections");
  food.sections.forEach(section => {
    assert(!/[一-龯々]/.test(section.japanese.replace(/[一-龯々]+\([ぁ-ゖ]+\)/g, "")), "New descriptions have kanji readings");
  });
});
cards.forEach(food => {
  assert(food.sections.length === 3, "All cards retain three sections");
  for (const text of [food.question, ...food.sections.map(section => section.japanese)]) {
    assert(!/[一-龯々]/.test(text.replace(/[一-龯々]+\([ぁ-ゖ]+\)/g, "")), "All title and description kanji have readings");
  }
});
assert(stripReadings(cards[80].question) === "煮物" && stripReadings(cards[229].question) === "黒蜜", "New batch endpoints retained");
function element() {
  return { children: [], events: {}, setAttribute() {}, append(...items) { this.children.push(...items); },
    appendChild(item) { this.children.push(item); }, addEventListener(name, handler) { this.events[name] = handler; } };
}
const elements = { questionText: element(), answerContainer: element() };
const state = {currentQuestionIndex: 0, questions: [card]};
let rendered = 0;
const render = new Function("document", "elements", "state", "setFuriganaAwareText", "createExampleSpeechButton", "playSound", "renderCurrentQuestion",
  extract("renderReadingCard", "renderResponsePractice") + "return renderReadingCard;")(
    {createElement: element}, elements, state,
    (target, text) => { target.textContent = text; }, text => ({speech: text}),
    () => {}, () => { rendered++; }
  );
render(card);
assert(elements.questionText.children[0].textContent === "Koshihikari rice", "Bilingual title");
const content = elements.answerContainer.children[0];
assert(content.children.length === card.sections.length + 1, "All descriptions visible immediately with navigation");
card.sections.forEach((section, i) => {
  const panel = content.children[i];
  assert(panel.children[1].children[0].textContent === section.japanese, "Description uses furigana renderer");
  assert(panel.children[1].children[1].speech === section.japanese, "Separate Japanese audio per description");
  assert(panel.children[2].textContent === section.english, "Keyword English displayed");
});
const arrows = content.children[card.sections.length].children;
assert(arrows.length === 2 && arrows.every(button => button.disabled), "Both arrows disabled for the single-card preview");
state.questions = [card, card, card];
function navigationAt(index) {
  state.currentQuestionIndex = index;
  elements.answerContainer.children = [];
  render(card);
  return elements.answerContainer.children[0].children[card.sections.length].children;
}
const first = navigationAt(0);
assert(first[0].disabled && !first[1].disabled, "First card only advances");
first[1].events.click();
assert(state.currentQuestionIndex === 1 && rendered === 1, "Right arrow renders the next card");
const middle = navigationAt(1);
assert(middle.every(button => !button.disabled), "Middle card supports both directions");
middle[0].events.click();
assert(state.currentQuestionIndex === 0 && rendered === 2, "Left arrow renders the previous card");
const last = navigationAt(2);
assert(!last[0].disabled && last[1].disabled, "Last card only goes back");
console.log("PASS: all 230 food cards, source wording, readings, bilingual title, section audio, and navigation.");
