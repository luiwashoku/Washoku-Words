// macOS JavaScript runner: reuse the app's exact speech preprocessing.
ObjC.import('Foundation');
function read(path) {
  return ObjC.unwrap($.NSString.stringWithContentsOfFileEncodingError(path, $.NSUTF8StringEncoding, null));
}
var window = {};
function run(args) {
  var root = args[0];
  eval(read(root + '/japanese-speech.js'));
  var card = JSON.parse(read(root + '/data/taste-words.json'))[0];
  return JSON.stringify([{ label: '名前', text: card.question }].concat(card.sections.map(function (s) {
    return { label: s.title.replace(/\([^)]*\)/g, ''), text: s.japanese };
  })).map(function (s) {
    return { label: s.label, text: window.getJapaneseSpeechText(s.text) };
  }));
}
