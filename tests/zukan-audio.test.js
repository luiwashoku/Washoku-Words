/* Run: osascript -l JavaScript tests/zukan-audio.test.js */
ObjC.import('Foundation');
function read(p) { return $.NSString.stringWithContentsOfFileEncodingError(p,$.NSUTF8StringEncoding,null).js; }
function assert(v,m) { if(!v) throw new Error(m); }
const source = read('favorites.html');
const functions = source.slice(source.indexOf('    let activeVocabularyAudio ='), source.indexOf('    function renderRolloverPage('));
const players = [];
function Audio(src) { this.src = src; this.paused = true; this.currentTime = 0; this.events = {}; players.push(this); }
Audio.prototype.addEventListener = function(name,fn) { this.events[name] = fn; };
Audio.prototype.pause = function() { this.paused = true; };
Audio.prototype.play = function() { this.paused = false; return {catch(){}}; };
const host = {getJapaneseSpeechText:t=>t,zukanAudioFiles:{'はくさい':'cabbage.mp3','かぶ':'turnip.mp3'}};
const api = new Function('window','Audio',functions + '; return {speak:speakJapanese, stop:stopVocabularyAudio};')(host,Audio);
assert(players.length === 0,'No audio before reveal');
api.speak('はくさい');
assert(players[0].src === 'cabbage.mp3' && !players[0].paused,'Recorded audio works without browser speech');
assert(players[0].playbackRate === undefined, 'Vocabulary uses normal playback speed');
players[0].currentTime = 0.5;
api.speak('かぶ');
assert(players[0].paused && players[0].currentTime === 0 && !players[1].paused,'Switching stops previous audio');
players[0].events.ended();
api.stop();
assert(players[1].paused,'Stale events cannot prevent navigation cancellation');
const manifest = JSON.parse(read('audio/zukan/manifest.json'));
const pages = new Function(source.slice(source.indexOf('    const rolloverPages ='), source.indexOf('    const test =')) + '; return rolloverPages;')();
const speech = new Function(source.slice(source.indexOf('    function getVocabularySpeechText('), source.indexOf('    let activeVocabularyAudio =')) + '; return getVocabularySpeechText;')();
const cleaner = {};
new Function('window',read('japanese-speech.js'))(cleaner);
pages.forEach(page=>page.items.forEach(item=>assert(manifest[cleaner.getJapaneseSpeechText(speech(item[1],item[4]))],'Every vocabulary item has a recording')));
Object.keys(manifest).forEach(key=>assert($.NSFileManager.defaultManager.fileExistsAtPath(manifest[key]),'Missing recording: '+key));
const rows = JSON.parse(new Function('ObjC', '$', read('scripts/export-zukan-audio.js') + '; return run(["."]);')(ObjC, $));
const review = JSON.parse(read('scripts/zukan-marin-review.json'));
assert(review.voice === 'marin' && review.model === 'gpt-4o-mini-tts' && review.speed === 1.0, 'Reviewed Marin settings match Word Explosion');
rows.forEach(row => {
  assert(review.entries[row.key]?.text === row.text, 'Exact reviewed input for ' + row.key);
  assert(manifest[row.key].indexOf('audio/zukan/marin-') === 0, 'Marin recording for ' + row.key);
});
assert(rows.some(row => row.key === 'かわをむく' && row.text === 'かわおむく'), 'Object particle corrected without changing lookup key');
rows.forEach(row=>assert(row.text && !/[㐀-鿿々ァ-ヺ]/.test(row.text),'Hiragana input required for '+row.key));
assert(rows.some(row=>row.key==='牡蠣' && row.text==='かき。'),'Oyster uses checked hiragana');
assert(rows.some(row=>row.key==='ほたて' && row.text==='ほたて。'),'Scallop uses checked hiragana');
console.log('PASS: Marin playback, switching, navigation cancellation, recording coverage, and hiragana inputs.');
