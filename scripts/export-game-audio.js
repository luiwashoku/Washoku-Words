ObjC.import('Foundation');
function read(path) { return ObjC.unwrap($.NSString.stringWithContentsOfFileEncodingError(path, $.NSUTF8StringEncoding, null)); }
var window = {};
function run(args) {
  var root = args[0];
  eval(read(root + '/japanese-speech.js'));
  eval(read(root + '/word-explosion.js'));
  var overrides = JSON.parse(read(root + '/scripts/taste-speech-overrides.json'));
  var gameOverrides = JSON.parse(read(root + '/scripts/game-speech-overrides.json'));
  var rows = [];
  if (args[1] === '--vocab-only') {
    return JSON.stringify(window.WordExplosionGame.parseVocabulary(read(root + '/word explosion.txt')).map(function(word) {
      return {key: window.getJapaneseSpeechText(word.japanese), text: word.japanese, english: word.english, kanji: word.kanji};
    }));
  }
  function add(text) {
    var key = window.getJapaneseSpeechText(text);
    if (!key) return;
    rows.push({key: key, text: gameOverrides[key] || overrides[key] || key.replace(/^さいしょは/, 'さいしょわ')});
  }
  ['game-prototype', 'three-second-replies'].forEach(function(id) {
    JSON.parse(read(root + '/data/' + id + '.json')).forEach(function(card) {
      add(card.question);
      card.answers.forEach(add);
      if (card.jpExplanation) add(card.jpExplanation);
    });
  });
  window.WordExplosionGame.parseVocabulary(read(root + '/word explosion.txt')).forEach(function(word) { add(word.japanese); });
  var examples = JSON.parse(read(root + '/data/word-explosion-examples.json'));
  Object.keys(examples).forEach(function(key) { add(examples[key].japanese); });
  return JSON.stringify(rows);
}
