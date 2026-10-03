/* Run: osascript -l JavaScript tests/money-cat.test.js */
ObjC.import('Foundation');
const read = path => $.NSString.stringWithContentsOfFileEncodingError(path, $.NSUTF8StringEncoding, null).js;
function assert(value, message) { if (!value) throw new Error(message); }
const host = {};
new Function('window', read('word-explosion.js'))(host);
new Function('window', read('money-cat.js'))(host);
new Function('window', read('game-audio-manifest.js'))(host);
new Function('window', read('japanese-speech.js'))(host);
const entries = host.WordExplosionGame.parseVocabulary(read('word explosion.txt'));
const pool = entries.filter(word => host.gameAudioFiles[host.getJapaneseSpeechText(word.japanese)]);
assert(pool.length >= 10, 'Existing recorded vocabulary is available');
let seed = 12345;
const random = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
const game = host.MoneyCatGame.createSession(pool, random);
const state = game.state;
game.nextSection();
assert(state.section.length === 10 && new Set(state.section.map(word => word.japanese)).size === 10, 'Ten unique spoken targets');
const initialWords = [...state.section];
assert(game.answer('a meaning outside the vocabulary') === false && state.moneyTotal === -1, 'Wrong answers allow negative money');
assert(game.answer(state.section[0].english) === null && state.moneyTotal === -1, 'One collision is scored only once');
assert(state.sectionAnswers[0].selectedMeaning === 'a meaning outside the vocabulary', 'Review remembers the chosen wrong meaning');
assert(state.sectionWrongAnswers[0] === initialWords[0], 'Review retains the original vocabulary entry');
game.advance();
for (let i = 1; i < 10; i++) {
  assert(game.answer(state.section[i].english) === true, 'Correct answer increments money');
  assert(game.advance() === (i < 9), 'Review only after ten answers');
}
assert(state.moneyTotal === 8, 'Money includes both gains and losses');
const last = state.recentVocabulary.at(-1);
game.nextSection();
assert(state.moneyTotal === 8 && state.sectionQuestionIndex === 0 && state.sectionWrongAnswers.length === 0, 'NEXT resets section but preserves money');
assert(!state.section.some(word => `${word.japanese}|${word.kanji || ''}` === last), 'Last answered word cannot immediately return');
assert(state.wrongAnswerWeights.get(`${initialWords[0].japanese}|${initialWords[0].kanji || ''}`) === 1, 'Mistakes retain future selection weight');
for (let section = 0; section < 100; section++) {
  game.nextSection();
  assert(new Set(state.section.map(word => word.japanese)).size === 10, 'No repeated target readings within sections');
  for (const word of state.section) {
    const options = host.MoneyCatGame.chooseAnswers(word, pool, 3, random);
    assert(options.length === 3 && options.includes(word), 'Each question has three choices and its target');
    assert(new Set(options.map(option => option.english.toLowerCase())).size === 3, 'No duplicate meanings');
    assert(options.every(option => pool.includes(option)), 'Distractors reuse original entries');
    assert(options.filter(option => option.japanese === word.japanese).length === 1, 'Distractors cannot share the spoken target reading');
    game.answer(word.english); game.advance();
  }
}
assert(state.recentVocabulary.length <= 40, 'History is bounded');
const svg = read('assets/cat-03.svg');
assert(svg === read('nopush/cat-03.svg'), 'Source cat artwork is preserved exactly');
assert(/<rect class="st3"/.test(svg), 'Held coin can be targeted separately from the collar bell');
new Function(read('app.js'));
console.log('PASS: Money Cat reuses recorded vocabulary, preserves money across sections, reviews mistakes and produces unique choices.');

// Audio mode and silent-buffer activation must happen synchronously in a gesture.
const source = read('money-cat.js');
const unlockSource = source.slice(source.indexOf('    function unlockAudio()'), source.indexOf('    // Unlock audio during the launch gesture'));
let resumed = 0, warmed = 0, connected = 0;
const audioContext = {
  state: 'suspended', sampleRate: 48000, destination: {},
  resume() { resumed++; return {catch(){}}; },
  createBuffer(channels, frames, rate) {
    assert(channels === 1 && frames === 1 && rate === 48000, 'Unlock buffer is minimal and silent');
    return {};
  },
  createBufferSource() { return {connect(){connected++;},start(){warmed++;},disconnect(){}}; }
};
const audioHost = {navigator:{audioSession:{type:'auto'}}};
const unlock = new Function('window','audioContext', 'let previousAudioSessionType;\n' + unlockSource + '; return {run:unlockAudio, previous:()=>previousAudioSessionType};')(audioHost,audioContext);
unlock.run();
assert(audioHost.navigator.audioSession.type === 'playback' && unlock.previous() === 'auto', 'iPhone uses playback mode while preserving previous mode');
assert(resumed === 1 && warmed === 1 && connected === 1, 'Gesture resumes and starts silent buffer synchronously');
unlock.run();
assert(unlock.previous() === 'auto' && warmed === 2, 'Repeated gestures preserve original audio mode and unlock again');
const unsupported = new Function('window','audioContext','let previousAudioSessionType;\n'+unlockSource+'; return unlockAudio;')({},audioContext);
unsupported();
assert(warmed === 3, 'Browsers without audioSession still unlock Web Audio');
const rejectedSession = {navigator: {audioSession: {
  get type() { return 'auto'; },
  set type(value) { throw new Error('Unsupported session setting'); }
}}};
const unlockRejectedSession = new Function('window','audioContext','let previousAudioSessionType;\n'+unlockSource+'; return unlockAudio;')(rejectedSession,audioContext);
unlockRejectedSession();
assert(warmed === 4, 'Rejected audioSession settings still allow Web Audio activation');
console.log('PASS: iPhone playback audio mode, synchronous gesture activation, repeated touches, and unsupported audioSession fallback.');
