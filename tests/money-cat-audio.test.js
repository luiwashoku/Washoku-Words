// Load money-cat.js first, then this file. Result is available as window.moneyCatAudioTestResult.
(async () => {
  function assert(value, message) { if (!value) throw new Error(message); }
  let requests = 0, resumes = 0;
  const sources = [];
  const context = {
    state: 'running', destination: {},
    resume() { resumes++; return Promise.resolve(); },
    decodeAudioData(data) { return Promise.resolve({file: data}); },
    createBufferSource() {
      const source = {connect(){}, disconnect(){}, start(){this.started=true;}, stop(){this.stopped=true;}};
      sources.push(source);
      return source;
    }
  };
  const signal = {aborted:false};
  const getFile = text => text + '.mp3';
  const fetchFile = file => { requests++; return Promise.resolve({ok:true,arrayBuffer:()=>Promise.resolve(file)}); };
  const player = window.MoneyCatGame.createVocabularyPlayer(context, getFile, fetchFile, signal);
  player.preload(['first', 'second']);
  await player.play('first');
  assert(sources[0].started && sources[0].buffer.file === 'first.mp3', 'First word uses decoded recording');
  await player.play('second');
  assert(sources[0].stopped && sources[1].started && sources[1].buffer.file === 'second.mp3', 'Automatic next word uses unlocked context');
  await player.play('second');
  assert(requests === 2 && resumes === 3, 'Replay uses cached audio and resumes context');
  const before = sources.length;
  const pending = player.play('first');
  player.stop();
  await pending;
  assert(sources.length === before, 'Cancellation prevents delayed playback');
  signal.aborted = true;
  await player.play('first');
  assert(sources.length === before, 'Navigation abort prevents playback');
  signal.aborted = false;
  context.state = 'suspended';
  let blocked = false;
  try { await player.play('first'); } catch (_) { blocked = true; }
  assert(blocked && sources.length === before, 'Suspended audio asks for a gesture rather than silently playing');
  let fail = true, tries = 0;
  const retryPlayer = window.MoneyCatGame.createVocabularyPlayer(context, getFile, file => {
    tries++;
    return Promise.resolve({ok: !fail, arrayBuffer:()=>Promise.resolve(file)});
  }, signal);
  context.state = 'running';
  try { await retryPlayer.play('retry'); } catch (_) {}
  fail = false;
  await retryPlayer.play('retry');
  assert(tries === 2 && sources[sources.length-1].started, 'Failed fetch can retry');
  retryPlayer.stop();
  window.moneyCatAudioTestResult = 'PASS: automatic next-word playback, replay caching, cancellation, navigation abort, suspended context, and retry.';
})().catch(error => { window.moneyCatAudioTestResult = 'FAIL: ' + error.message; });
