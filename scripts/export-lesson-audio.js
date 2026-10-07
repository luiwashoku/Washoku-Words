ObjC.import('Foundation');
function read(path) { return ObjC.unwrap($.NSString.stringWithContentsOfFileEncodingError(path, $.NSUTF8StringEncoding, null)); }
var window = {};
function run(args) {
  var root = args[0], lessonId = args[1];
  eval(read(root + '/japanese-speech.js'));
  var catalog = JSON.parse(read(root + '/data/catalog.json'));
  var lesson = catalog.filter(function(l) { return l.id === lessonId; })[0];
  if (!lesson) throw new Error('Unknown lesson: ' + lessonId);
  var rows = [];
  (lesson.files || [lesson.file]).forEach(function(file) {
    var data = JSON.parse(read(root + '/' + file));
    if (lesson.gameMode === 'families-of-doom') {
      data.questions.forEach(function(card) {
        rows.push({lesson: lessonId, card: card.id, field: 'sentence', key: window.getJapaneseSpeechText(card.sentence)});
        Object.keys(card.variants || {}).forEach(function(answer) {
          rows.push({lesson: lessonId, card: card.id, field: 'alternative', key: window.getJapaneseSpeechText(card.variants[answer])});
        });
      });
      return;
    }
    if (lesson.gameMode === 'vocabulary-cards') {
      data.entries.forEach(function(entry) {
        if (args[2] && entry.id !== args[2]) return;
        if (lesson.conjugationCards) {
          (entry.sections || []).forEach(function(section) {
            section.rows.forEach(function(row) {
              rows.push({lesson: lessonId, card: entry.id, field: row.label, key: window.getJapaneseSpeechText(row.example.japanese)});
            });
          });
          return;
        }
        rows.push({lesson: lessonId, card: entry.id, field: 'vocabulary', key: window.getJapaneseSpeechText(entry.japanese)});
        (entry.blocks || []).forEach(function(block) {
          if (block.pairs && block.speech) rows.push({lesson: lessonId, card: entry.id, field: 'subtitle', key: window.getJapaneseSpeechText(block.speech)});
          var parts = block.numberRows || (block.pairs ? block.pairs.reduce(function(all, pair) { return all.concat([pair.vocabulary, pair.food]); }, []) : (block.items || [block]));
          parts.forEach(function(part) {
            rows.push({lesson: lessonId, card: entry.id, field: 'chunk', key: window.getJapaneseSpeechText(part.speech || part.japanese)});
            if (part.explanation) rows.push({lesson: lessonId, card: entry.id, field: 'explanation', key: window.getJapaneseSpeechText(part.explanation.speech || part.explanation.japanese)});
          });
        });
        if (entry.example) rows.push({lesson: lessonId, card: entry.id, field: 'example', key: window.getJapaneseSpeechText(entry.example.japanese)});
        (entry.examples || []).forEach(function(example) {
          rows.push({lesson: lessonId, card: entry.id, field: example.label, key: window.getJapaneseSpeechText(example.japanese)});
        });
      });
      return;
    }
    var dynamicChoices = data.kind === 'rice-varieties';
    if (dynamicChoices) {
      // Reuse the app's question text; choice order does not affect individual clips.
      var app = read(root + '/app.js');
      var start = app.indexOf('  function buildRiceVarietyQuestions(items) {');
      var end = app.indexOf('  function buildChoices(', start);
      if (start < 0 || end < 0) throw new Error('Rice question builder not found');
      eval(app.slice(start, end));
      data = buildRiceVarietyQuestions(data.items);
    }
    if (data.kind === 'seafood-profiles') {
      var app = read(root + '/app.js');
      var start = app.indexOf('  function buildSeafoodQuestions(');
      var end = app.indexOf('  function buildRiceVarietyQuestions(', start);
      var questionStart = app.indexOf('  function buildSeafoodQuestion(');
      var questionEnd = app.indexOf('  function getCurrentQuestion()', questionStart);
      if (start < 0 || end < 0 || questionStart < 0 || questionEnd < 0) {
        throw new Error('Seafood question builders not found');
      }
      eval(app.slice(start, end));
      eval(app.slice(questionStart, questionEnd));
      data = buildSeafoodQuestions(data.items, lesson.quizMode);
    }
    (Array.isArray(data) ? data : data.questions).forEach(function(card) {
      function add(text, field) {
        var key = window.getJapaneseSpeechText(text);
        if (key) rows.push({lesson: lessonId, card: card.id, field: field, key: key});
      }
      add(card.question, 'question');
      if (card.answers) {
        if (!dynamicChoices) add(card.answers.join('。 \n'), 'answers');
        card.answers.forEach(function(answer) { add(answer, 'answer'); });
      }
      add(card.jpExplanation, 'explanation');
      (card.sections || []).forEach(function(section) { add(section.japanese, 'section'); });
    });
  });
  return JSON.stringify(rows);
}
function buildChoices(correctValue, values, correctIndex) {
  var answers = values.filter(function(value, index) {
    return value !== correctValue && values.indexOf(value) === index;
  }).slice(0, 3);
  answers.splice(Math.min(correctIndex, answers.length), 0, correctValue);
  return {answers: answers, correct: answers.indexOf(correctValue)};
}
