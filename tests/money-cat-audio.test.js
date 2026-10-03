// Load money-cat.js first. Result is available as window.moneyCatAudioTestResult.
(async () => {
  function assert(value, message) { if (!value) throw new Error(message); }
  const elements = [], requests = [], plays = [];
  let abort;
  const signal = {aborted: false, addEventListener(type, listener) { abort = listener; }};
  let fail = false, delayed = null;
  const createAudio = src => {
    const audio = {
      src, currentTime: 0, paused: true,
      getAttribute() { return this.src; },
      pause() { this.paused = true; },
      play() {
        this.paused = false;
        plays.push({audio: this, src: this.src, time: this.currentTime});
        if (delayed) return delayed;
        return fail ? Promise.reject(new Error('Playback blocked')) : Promise.resolve();
      }
    };
    elements.push(audio);
    return audio;
  };
  const fetchFile = file => {
    requests.push(file);
    return Promise.resolve({ok: true, arrayBuffer: () => Promise.resolve({})});
  };
  const player = window.MoneyCatGame.createVocabularyPlayer(text => typeof text === 'boolean' ? (text ? 'correct.wav' : 'wrong.wav') : text === 'missing' ? null : text + '.mp3', createAudio, fetchFile, signal);
  player.unlock();
  assert(plays.length === 1 && plays[0].src.startsWith('data:audio/wav;'), 'Launch gesture plays real silent samples synchronously');
  const first = player.play('first');
  assert(plays.length === 2 && plays[1].src === 'first.mp3', 'Speaker playback begins synchronously before yielding user activation');
  await first;
  assert(!elements[0].paused, 'Late warmup completion cannot pause the first word');
  player.preload(['first', 'second', 'second']);
  await player.play('second');
  assert(elements.length === 1 && plays[2].audio === plays[1].audio, 'Timed next word reuses the launch-unlocked native element');
  elements[0].currentTime = 1;
  await player.play('second');
  assert(plays[3].time === 0 && requests.length === 2, 'Replay restarts the word and section preloads are deduplicated');
  await player.play(false);
  assert(plays.at(-1).src === 'wrong.wav', 'Wrong-answer feedback plays on the same player');
  await player.play('third');
  assert(elements.length === 1 && plays.at(-1).src === 'third.mp3' && !elements[0].paused,
    'Vocabulary after wrong feedback reuses the unlocked audio element');
  await player.play(true);
  await player.play('fourth');
  assert(elements.length === 1 && plays.at(-1).src === 'fourth.mp3',
    'Vocabulary after correct feedback also reuses the unlocked audio element');
  const count = plays.length;
  player.unlock();
  assert(plays.length === count, 'Movement taps do not interrupt or replay the word');
  let blocked = false;
  fail = true;
  try { await player.play('first'); } catch (_) { blocked = true; }
  assert(blocked, 'Playback denial reaches the UI instead of silently succeeding');
  fail = false;
  await player.play('first');
  assert(!elements[0].paused, 'Speaker can retry after a blocked playback');
  let rejectPending;
  delayed = new Promise((resolve, reject) => { rejectPending = reject; });
  const pending = player.play('second');
  player.stop();
  rejectPending(new Error('Interrupted'));
  await pending;
  assert(elements[0].paused, 'Cancellation pauses playback and ignores stale rejection');
  delayed = null;
  signal.aborted = true;
  abort();
  const beforeAbortPlay = plays.length;
  await player.play('first');
  player.unlock();
  assert(plays.length === beforeAbortPlay && elements[0].paused, 'Navigation abort prevents any further playback');
  window.moneyCatAudioTestResult = 'PASS: synchronous native audio activation, timer reuse, replay, preload, blocked retry, cancellation, and navigation cleanup.';
})().catch(error => { window.moneyCatAudioTestResult = 'FAIL: ' + error.message; });
