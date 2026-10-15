/* Run: osascript -l JavaScript tests/kanahachi-dictionary.test.js <project-root> */
ObjC.import("Foundation");
function run(args) {
  const root = args[0], window = {};
  const read = path => $.NSString.stringWithContentsOfFileEncodingError(root + "/" + path, $.NSUTF8StringEncoding, null).js;
  const assert = (value, message) => { if (!value) throw Error(message); };
  eval(read("js/games/kanahachi-core.js"));
  const core = window.KanahachiCore;
  eval(read("js/games/kanahachi-dictionary.js"));
  const game = window.KanahachiDictionary, base = window.KanahachiCore;
  const data = JSON.parse(read(game.DATA_FILE));
  const store = {data, appDictionary: base.aggregate([
    {reading:"おもしろい",spelling:"面白い",english:"interesting",source:"app"},
    {reading:"しろ",spelling:"白",english:"white",source:"app"}
  ]).dictionary};
  const board = {kana:["あ","お","い","ろ","ん","も","し"],center:"し"};
  const started = Date.now(), dictionary = game.dictionaryForBoard(store, board);
  assert(dictionary.has("おいしい"), "Real JMdict covers the reported missing word");
  assert(dictionary.get("おいしい").variants.some(v=>v.english.includes("delicious")), "Correct dictionary meaning");
  assert(game.validateAnswer("オイシイ",board,dictionary).reading === "おいしい", "Katakana input accepted");
  assert(game.validateAnswer("おいしい",board,dictionary,["おいしい"]).error.includes("already"), "Duplicates rejected");
  assert(game.validateAnswer("おい",board,dictionary).error.includes("centre"), "Centre is required");
  assert(game.validateAnswer("おいしいが",board,dictionary).error.includes("only"), "Unavailable voiced kana rejected");
  assert(!game.validateAnswer("しろ",board,dictionary).error, "Existing app words accepted too");
  assert(game.hintCandidates(dictionary,[]).every(r=>["しろ","おもしろい"].includes(r)), "Hints prefer app revision");
  assert(game.progressLabel(9).includes("9 / 10") && game.progressLabel(10) === "10 / 10 found" && game.progressLabel(11) === "11 / 10 found", "Fixed ten-word goal supports continued play");
  assert(game.SAVE_KEY !== "washoku-kanahachi-v1", "Progress has an independent save key");
  assert(!core.mount && !core.generateBoards, "Retired game UI and generator are not shipped in the shared core");
  const priorityStore = {
    data: {boards:[["あおいろんもし","し",10],["あいうえおかき","か",10],["あいえおきしん","し",10]]},
    appDictionary:base.aggregate(["しろ","おし","あし","もし","しお"].map(reading=>({reading,spelling:reading,english:reading,source:"app"}))).dictionary
  };
  const preferred = game.prioritizeBoards(priorityStore);
  assert(preferred.length === 1 && preferred[0].appAnswerCount === 5, "New puzzles favour at least five app readings");
  assert(game.prioritizeBoards({data:priorityStore.data,appDictionary:new Map()}).length === 3, "Dictionary-only offline fallback remains playable");
  assert(data.readings > 100000 && data.commonReadings > 10000 && data.boards.length >= 100, "Broad dictionary and real common-word boards");
  for (const [kana, center, count] of data.boards) {
    assert([...kana].length === 7 && new Set(kana).size === 7 && kana.includes(center) && count >= 10, "Seven distinct kana / ten common targets");
  }
  const restored = base.restorePuzzle({...board,version:1,found:["おいしい"],input:"しろ",finished:false},dictionary);
  assert(restored.found[0] === "おいしい" && restored.input === "しろ", "New dictionary progress restores");
  return `PASS: ${data.readings} dictionary readings, ${data.boards.length} boards, おいしい, matching rules, app hints, ten-word goal, separate saves; board lookup ${Date.now()-started} ms.`;
}
