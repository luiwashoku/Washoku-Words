/* Run with: osascript -l JavaScript tests/japanese-speech.test.js */
ObjC.import("Foundation");
function read(path) {
  return $.NSString.stringWithContentsOfFileEncodingError(path, $.NSUTF8StringEncoding, null).js;
}
function assert(value, message) { if (!value) throw new Error(message); }
const host = {};
new Function("window", read("japanese-speech.js"))(host);
const prepare = host.getJapaneseSpeechText;
const cases = [
  ["先生：包丁(ほうちょう)を使ってみましょう（笑）。", "ほうちょうを使ってみましょう。"],
  ["食感(しょっかん)", "しょっかん"],
  ["駅員（えきいん）：右（みぎ）です(笑)。", "みぎです。"],
  ["知らない人：はい（笑）。\nB: ありがとうございます。", "はい。 ありがとうございます。"],
  ["Alex Smith: はい。\nＡ：いいですね。", "はい。 いいですね。"],
  ["ホテル：はい。（笑）\nPlease choose the correct answer.\n店員：どうぞ。", "はい。 どうぞ。"],
  ["English translation with 日本語.", ""],
  ["  先生：  はい (笑)  。 。\n店員：どうぞ、 、こちらへ。  ", "はい。 どうぞ、こちらへ。"],
  ["9:30に来てください。", "9:30に来てください。"],
  ["あれは包丁(ほうちょう)です。", "あれはほうちょうです。"],
  [null, ""], ["", ""]
];
for (const [input, expected] of cases) assert(prepare(input) === expected, `${input}: got ${prepare(input)}`);
const spoken = [];
const voice = { name: "Otoya Enhanced", voiceURI: "otoya-enhanced", lang: "ja-JP" };
const fallbackVoice = { name: "Hattori Enhanced", voiceURI: "hattori-enhanced", lang: "ja-JP" };
host.speechSynthesis = {
  speaking: false, paused: false,
  getVoices: () => [fallbackVoice, voice], cancel() {}, speak(u) { spoken.push(u); },
  pause() { this.paused = true; }, resume() { this.paused = false; }
};
function Utterance(text) { this.text = text; this.addEventListener = () => {}; }
host.SpeechSynthesisUtterance = Utterance;
const input = cases[0][0], expected = cases[0][1];
const app = read("app.js");
const mainSource = app.slice(app.indexOf("  function speakJapaneseText("), app.indexOf("  function setSpeechButtonState("));
const main = new Function("window", "SpeechSynthesisUtterance", "getJapaneseSpeechText", `
  let activeJapaneseUtterance = null, activeSpeechButton = null;
  function setSpeechButtonState() {}
  function cancelJapaneseSpeech() { window.speechSynthesis.cancel(); }
  ${mainSource}
  return speakJapaneseText;
`)(host, Utterance, prepare);
const button = {};
main(input, button, "test");
host.speechSynthesis.speaking = true;
main(input, button, "test");
assert(host.speechSynthesis.paused, "Same-button click still pauses");
main(input, button, "test");
assert(!host.speechSynthesis.paused && spoken.length === 1, "Resume does not create another utterance");
host.speechSynthesis.speaking = false;
const favorites = read("favorites.html");
const favoriteSource = favorites.slice(favorites.indexOf("    function speakJapanese("), favorites.indexOf("    function renderRolloverPage("));
new Function("window", "SpeechSynthesisUtterance", `${favoriteSource}; return speakJapanese;`)(host, Utterance)(input);
const listening = read("word-explosion-2.js");
const listeningSource = listening.slice(listening.indexOf("    function speak()"), listening.indexOf("    function reveal()"));
new Function("window", "SpeechSynthesisUtterance", "word", `
  const alive = true; let utterance = null;
  function stopSpeech() {}
  ${listeningSource}
  speak();
`)(host, Utterance, { japanese: input });
assert(spoken.length === 3, "All three TTS entry points exercised");
spoken.forEach(u => {
  assert(u.text === expected, "Each constructor receives shared, preprocessed text");
  assert(u.rate === 0.65 && u.lang === "ja-JP" && u.voice === voice, "Rate, language and preferred voice preserved");
});
for (const file of ["index.html", "favorites.html"]) {
  const html = read(file);
  assert(html.indexOf('src="japanese-speech.js"') < html.indexOf(file === "index.html" ? 'src="app.js"' : "function speakJapanese("), "Shared helper loaded before use");
}
console.log("PASS: shared Japanese preprocessing, all three TTS entry points, voice/rate, and pause/resume.");
