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
    JSON.parse(read(root + '/' + file)).forEach(function(card) {
      function add(text, field) {
        var key = window.getJapaneseSpeechText(text);
        if (key) rows.push({lesson: lessonId, card: card.id, field: field, key: key});
      }
      add(card.question, 'question');
      if (card.answers) {
        add(card.answers.join('。 \n'), 'answers');
        card.answers.forEach(function(answer) { add(answer, 'answer'); });
      }
      add(card.jpExplanation, 'explanation');
      (card.sections || []).forEach(function(section) { add(section.japanese, 'section'); });
    });
  });
  return JSON.stringify(rows);
}
