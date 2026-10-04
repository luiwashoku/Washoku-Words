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
    if (lesson.gameMode === 'vocabulary-cards') {
      data.entries.forEach(function(entry) {
        rows.push({lesson: lessonId, card: entry.id, field: 'vocabulary', key: window.getJapaneseSpeechText(entry.japanese)});
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
