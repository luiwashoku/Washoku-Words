/* Run with: osascript -l JavaScript tests/response-practice.test.js */
ObjC.import("Foundation");
function read(path) {
  return $.NSString.stringWithContentsOfFileEncodingError(path, $.NSUTF8StringEncoding, null).js;
}
function assert(value, message) { if (!value) throw new Error(message); }
const source = read("app.js");
new Function(source);
function extract(start, end) { return source.slice(source.indexOf(`  function ${start}(`), source.indexOf(`  function ${end}(`)); }
const validate = new Function(extract("isValidQuestion", "renderCurrentQuestion") + "return isValidQuestion;")();
const cards = JSON.parse(read("data/three-second-replies.json"));
const catalog = JSON.parse(read("data/catalog.json"));
assert(cards.length === 300 && new Set(cards.map(q => q.id)).size === 300, "300 unique cards");
assert(cards.every(q => validate(q) && q.answers.length === 3 && !("correct" in q)), "All examples load without correct-answer indexes");
assert(catalog.find(l => l.id === "three-second-replies").questionCount === cards.length, "Catalog count matches");
function element() {
  const classes = new Set(["hidden"]);
  return {
    children: [], handlers: {},
    classList: { add: c => classes.add(c), remove: c => classes.delete(c), contains: c => classes.has(c) },
    append(...children) { this.children.push(...children); },
    appendChild(child) { this.children.push(child); },
    replaceChildren(...children) { this.children = children; },
    addEventListener(type, handler) { this.handlers[type] = handler; },
    scrollIntoView() {}
  };
}
const elements = Object.fromEntries(["answerContainer", "resultTitle", "grammarDetails", "conjugationFeedback", "resultCard"].map(key => [key, element()]));
elements.explanations = [element(), element()];
const state = { answerLocked: false, stats: { answered: 0, correct: 0 } };
const render = new Function("document", "elements", "state", "setFuriganaAwareText", "createExampleSpeechButton", "playSound", extract("renderResponsePractice", "renderConjugationReveal") + "return renderResponsePractice;")(
  { createElement: element }, elements, state,
  (target, text) => { target.textContent = text; },
  text => ({ audioText: text }), () => {}
);
for (const card of cards) {
  state.answerLocked = false;
  elements.answerContainer.replaceChildren();
  elements.resultCard.classList.add("hidden");
  render(card);
  assert(elements.answerContainer.children.length === 1, "Front contains only the reveal control");
  const reveal = elements.answerContainer.children[0];
  assert(reveal.textContent === "答えを見る" && elements.resultCard.classList.contains("hidden"), "Examples hidden before reveal");
  reveal.handlers.click();
  const rows = elements.conjugationFeedback.children[0].children;
  assert(rows.length === 3 && !elements.resultCard.classList.contains("hidden"), "Reveal shows all examples");
  rows.forEach((row, i) => assert(row.children[0].textContent === card.answers[i] && row.children[1].audioText === card.answers[i], "Every example has its own audio control"));
  assert(state.stats.answered === 0 && state.stats.correct === 0, "No grading");
}
console.log("PASS: 300 response cards load, hide and reveal all examples, provide example audio, and leave scores unchanged.");
