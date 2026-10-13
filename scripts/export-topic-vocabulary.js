/* Export the existing word-card content and active audio without rendering speech.
 * Run: osascript -l JavaScript scripts/export-topic-vocabulary.js <project-root>
 */
ObjC.import('Foundation');
function read(path) { return ObjC.unwrap($.NSString.stringWithContentsOfFileEncodingError(path, $.NSUTF8StringEncoding, null)); }
function run(args) {
  var root = args[0], window = {};
  eval(read(root + '/japanese-speech.js'));
  eval(read(root + '/word-explosion.js'));
  eval(read(root + '/word-explosion-audio-manifest.js'));
  eval(read(root + '/game-audio-manifest.js'));
  eval(read(root + '/lesson-audio-manifest.js'));
  var financeAudio = window.lessonAudioFiles['household-finance-cards'];
  var examples = JSON.parse(read(root + '/data/word-explosion-examples.json'));
  var rows = window.WordExplosionGame.parseVocabulary(read(root + '/word explosion.txt')).map(function(word) {
    var id = word.japanese + '|' + word.kanji;
    var example = examples[id] || examples[word.japanese];
    if (!example || !example.japanese || !example.english) throw Error('Missing example: ' + id);
    var exampleKey = window.getJapaneseSpeechText(example.japanese);
    var wordAudio = window.wordExplosionAudioFiles[id] || window.wordExplosionAudioFiles[word.japanese] || window.gameAudioFiles[word.japanese];
    var exampleAudio = window.wordExplosionAudioFiles[exampleKey] || window.gameAudioFiles[exampleKey];
    if (!wordAudio || !exampleAudio || example.audioPending) throw Error('Missing published recording: ' + id);
    return { key: id, english: word.english, reading: word.japanese, display: word.kanji || word.japanese,
      example: example, exampleKey: exampleKey,
      wordSpeech: window.wordExplosionAudioFiles[id] ? id : word.japanese,
      wordAudio: wordAudio, exampleAudio: exampleAudio };
  });
  var supplement = JSON.parse(read(root + '/data/household-finance-cards.json'));
  supplement.entries.forEach(function(card) { card.blocks.forEach(function(block) { block.pairs.forEach(function(pair) {
    var index = rows.findIndex(function(row) { return row.key === pair.sourceKey; });
    if ((index >= 0) !== !!pair.overrideExisting) throw Error('Unexpected supplemental override: ' + pair.sourceKey);
    var parts = pair.sourceKey.split('|');
    var speech = window.wordExplosionAudioFiles[pair.sourceKey] ? pair.sourceKey : pair.vocabulary.speech;
    function audio(text) {
      var key = window.getJapaneseSpeechText(text);
      var path = window.wordExplosionAudioFiles[key] || financeAudio[key] || window.gameAudioFiles[key];
      if (!path) throw Error('Missing finance recording: ' + key);
      return path;
    }
    function checkExample(example) {
      audio(example.japanese);
      if (example.explanation) checkExample(example.explanation);
    }
    checkExample(pair.example);
    var row = {key: pair.sourceKey, reading: parts[0], display: parts[1], label: pair.vocabulary.japanese,
      english: pair.vocabulary.english, example: pair.example, exampleKey: window.getJapaneseSpeechText(pair.example.japanese),
      wordSpeech: speech, wordAudio: audio(speech), exampleAudio: audio(pair.example.japanese), contextOverride: !!pair.overrideExisting};
    if (index >= 0) rows[index] = row; else rows.push(row);
  }); }); });
  return JSON.stringify(rows);
}
