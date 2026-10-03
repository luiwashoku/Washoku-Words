ObjC.import('Foundation');
function read(path) { return ObjC.unwrap($.NSString.stringWithContentsOfFileEncodingError(path, $.NSUTF8StringEncoding, null)); }
var window = {};
function run(args) {
  var root = args[0];
  eval(read(root + '/japanese-speech.js'));
  var source = read(root + '/favorites.html');
  var pages = new Function(source.slice(source.indexOf('    const rolloverPages ='), source.indexOf('    const test =')) + '; return rolloverPages;')();
  var speech = new Function(source.slice(source.indexOf('    function getVocabularySpeechText('), source.indexOf('    function speakJapanese(')) + '; return getVocabularySpeechText;')();
  var overrides = JSON.parse(read(root + '/scripts/zukan-speech-overrides.json'));
  var rows = [];
  pages.forEach(function(page) {
    page.items.forEach(function(item) {
      var key = window.getJapaneseSpeechText(speech(item[1], item[4]));
      // Written-context overrides remain lookup keys; TTS receives checked readings.
      var spoken = overrides[key] || (/[㐀-鿿々]/.test(key) ? speech(item[1]) : key);
      spoken = window.getJapaneseSpeechText(spoken).replace(/[ァ-ヶ]/g, function(c) {
        return String.fromCharCode(c.charCodeAt(0) - 0x60);
      });
      if (!spoken || /[㐀-鿿々ァ-ヺ]/.test(spoken)) {
        throw new Error('Hiragana reading required for ' + item[0]);
      }
      rows.push({key: key, text: spoken});
    });
  });
  return JSON.stringify(rows);
}
