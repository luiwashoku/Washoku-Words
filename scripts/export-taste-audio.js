ObjC.import('Foundation');
function read(path) { return ObjC.unwrap($.NSString.stringWithContentsOfFileEncodingError(path, $.NSUTF8StringEncoding, null)); }
var window = {};
function run(args) {
  var root = args[0];
  eval(read(root + '/japanese-speech.js'));
  var cards = JSON.parse(read(root + '/data/taste-words.json'));
  var overrides = JSON.parse(read(root + '/scripts/taste-speech-overrides.json'));
  var rows = [];
  cards.forEach(function(card) {
    [card.question].concat(card.sections.map(function(s) { return s.japanese; })).forEach(function(text, i) {
      var cleaned = window.getJapaneseSpeechText(text);
      // Speech-only pronunciation hint for the topic particle in 最初は.
      // Keep the lookup key and displayed Japanese unchanged.
      var spoken = cleaned.replace(/^さいしょは/, 'さいしょわ');
      // Exact, reviewed sentence overrides; never replace は inside words globally.
      if (Object.prototype.hasOwnProperty.call(overrides, cleaned)) spoken = overrides[cleaned];
      rows.push({key: cleaned, text: card.id === 'taste-words-koshihikari' && i === 0 ? 'こしひかり' : spoken});
    });
  });
  return JSON.stringify(rows);
}
