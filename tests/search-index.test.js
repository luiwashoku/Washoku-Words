/* Run with: osascript -l JavaScript tests/search-index.test.js */
ObjC.import("Foundation");
const read = path => $.NSString.stringWithContentsOfFileEncodingError(path, $.NSUTF8StringEncoding, null).js;
const assert = (value, message) => { if (!value) throw Error(message); };
class Element {
  constructor() { this.children = []; this.events = {}; this.value = ""; }
  replaceChildren(...children) { this.children = children; }
  appendChild(child) { this.children.push(child); }
  addEventListener(name, callback) { this.events[name] = callback; }
  showModal() {}
  close() {}
  focus() {}
}
async function check() {
  const elements = {};
  const document = {
    getElementById(id) { return elements[id] || (elements[id] = new Element()); },
    createElement() { return new Element(); },
    querySelector() { return null; }
  };
  const catalog = JSON.parse(read('data/catalog.json'));
  const requested = [], opened = [];
  const host = { WordExplosionGame: {
    async loadVocabulary(file) {
      assert(file.endsWith('.txt'), 'Only word games use the text vocabulary loader');
      requested.push(file);
      return { entries: [{ japanese: 'げーむ', english: 'game-only-match', example: { english: 'game-example-match' } }] };
    }
  } };
  const fetch = async file => {
    requested.push(file);
    return { ok: true, json: async () => JSON.parse(read(file)) };
  };
  new Function('window', 'document', 'fetch', read('js/ui/search.js'))(host, document, fetch);
  const fixtures = [
    { id: 'quiz', title: 'Quiz', file: 'quiz.json' },
    ...catalog.filter(l => l.gameMode)
  ];
  host.WashokuSearch.init({ catalog: fixtures,
    loadQuestions: async lesson => lesson.id === 'quiz' ? [{ id: 'q1', question: 'Quiz prompt', grammarPoint: 'として', enExplanation: 'explanation-only-match', answers: ['answer-only-match'] }] : JSON.parse(read(lesson.file)).questions,
    getQuestionTitle: question => question.grammarPoint || question.question,
    openResult: async entry => opened.push(entry)
  });
  const search = elements.searchInput, results = elements.searchResults;
  async function query(text) {
    search.value = text;
    elements.openSearch.events.click();
    // Drain the asynchronous loader and its final render without timers.
    for (let i = 0; i < 40; i++) await Promise.resolve();
    return results.children.filter(e => e.children.length);
  }
  let hits = await query('として');
  assert(hits.length >= 2, 'Grammar is found in both decks and quizzes');
  assert(hits[0].children[1].textContent.includes('Open card'), 'Flash cards rank ahead of earlier catalog quizzes');
  const target = hits.find(h => h.children[0].textContent.includes('～として'));
  assert(target, 'The actual として flash card appears');
  await target.events.click();
  assert(opened.at(-1).word.id === 'grammar-card-069', 'Result preserves the exact card target');
  assert((await query('explanation-only-match')).length === 1, 'Quiz explanations are searchable');
  assert((await query('answer-only-match')).length === 1, 'Quiz answers are searchable');
  assert((await query('game-example-match')).length === 2, 'Game examples are searchable');
  assert(requested.filter(f => f.endsWith('.txt')).length === 1, 'Shared game vocabulary loads once');
  for (const id of ['topic-vocabulary-cards', 'household-finance-cards', 'families-of-doom']) {
    const lesson = fixtures.find(l => l.id === id);
    assert(requested.includes(lesson.file) || id === 'families-of-doom', 'Deck included: ' + id);
    hits = await query(lesson.title);
    assert(hits.some(h => h.children.at(-1).textContent.startsWith(lesson.title)), 'Search finds ' + id);
  }
  await query('');
  await query('文法');
  const more = results.children.find(e => e.textContent === 'Show more results');
  assert(more, 'More than 100 results can be accessed');
  more.events.click();
  assert(results.children.filter(e => e.children.length).length === 200, 'Show more reveals the next 100');
  assert(!elements.searchStatus.textContent.includes('could not load'), 'Every fixture loads');
  console.log('PASS: real decks, として, deck-first ranking, exact targets, full-content search, Families of Doom, shared vocabulary, and pagination.');
}
check().catch(error => { console.log('FAIL: ' + error.stack); throw error; });
