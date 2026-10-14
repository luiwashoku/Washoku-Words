/* Run: osascript -l JavaScript tests/kanahachi.test.js <project-root> */
ObjC.import("Foundation");
function read(path) { return ObjC.unwrap($.NSString.stringWithContentsOfFileEncodingError(path, $.NSUTF8StringEncoding, null)); }
function assert(value, message) { if (!value) throw Error(message); }
function run(args) {
  const root = args[0], window = {};
  eval(read(root + "/kanahachi.js"));
  eval(read(root + "/word-explosion.js"));
  eval(read(root + "/japanese-speech.js"));
  eval(read(root + "/lesson-audio-manifest.js"));
  eval(read(root + "/word-explosion-audio-manifest.js"));
  eval(read(root + "/game-audio-manifest.js"));
  eval(read(root + "/taste-audio-manifest.js"));
  const k = window.Kanahachi;
  assert(k.normalizeReading("ｷｬｯﾌﾟ") === "きゃっぷ", "Half-width katakana and small kana");
  assert(k.normalizeReading("ガハバパヴー") === "がはばぱゔー", "Voicing and long-vowel mark preserved");
  assert(k.normalizeReading("か\u3099") === "が", "Decomposed voicing normalizes");
  assert(k.annotatedReading("焼(や)き色(いろ)") === "やきいろ", "Explicit partial furigana");
  assert(k.annotatedReading("未知") === "未知", "Unreviewed kanji is not guessed");
  const mock = k.aggregate([
    { spelling: "橋", reading: "はし", english: "bridge", source: "one" },
    { spelling: "箸", reading: "ハシ", english: "chopsticks", source: "two" },
    { spelling: "箸", reading: "はし", english: "chopsticks", source: "two" },
    { spelling: "未知", reading: "未知", english: "unknown", source: "one" },
    { spelling: "目", reading: "め", english: "eye", source: "one" }
  ]);
  assert(mock.dictionary.size === 1 && mock.dictionary.get("はし").variants.length === 2, "Homophones retain meanings and spellings, duplicates collapse");
  assert(mock.audit.missingReading === 1 && mock.audit.tooShort === 1, "Reading exclusions counted");
  const duplicates=k.aggregate([
    {spelling:"炊飯器",reading:"すいはんき",english:"rice cooker",source:"one",speech:"すいはんき"},
    {spelling:"炊飯器",reading:"すいはんき",english:"Rice cooker",source:"two",speech:"すいはんき"},
    {spelling:"タン",reading:"たん",english:"tongue",source:"one",speech:"たん"},
    {spelling:"タン（舌）",reading:"たん",english:"Tongue",source:"two",speech:"たん"},
    {spelling:"タン",reading:"たん",english:"Tan / Tongue",source:"three",speech:"たん"}
  ]);
  const cooker=duplicates.dictionary.get("すいはんき");
  assert(cooker.variants.length===1&&cooker.variants[0].sources.length===2,"Capitalization duplicates merge while preserving source audio");
  const tongue=k.displayVariants(duplicates.dictionary.get("たん"));
  assert(tongue.length===1&&tongue[0].spellings.join()==="タン（舌）"&&tongue[0].variants.length===3,"Tongue is one row with informative spelling and retained variants");
  assert(k.displayVariants(mock.dictionary.get("はし")).length===2,"Bridge and chopsticks remain separate meanings");
  const explicit = k.extractVocabulary({ id: "test", gameMode: "vocabulary-cards", readingCards: true }, { entries: [{
    japanese: "れいぶん", english: "Example", blocks: [
      { japanese: "これは例文(れいぶん)です。", english: "This is a sentence.", speech: "これわれいぶんです。" },
      { heading: true, japanese: "説明(せつめい)", english: "Explanation" },
      { pairs: [{ sourceKey: "はし|箸", vocabulary: { japanese: "箸", english: "chopsticks", speech: "はし|箸" }, example: { japanese: "箸(はし)を使(つか)う。", english: "Use chopsticks." } }] }
    ]
  }] });
  assert(explicit.length === 1 && explicit[0].reading === "はし", "Only explicit words; lookup keys separate from readings and examples");
  const prefixed = k.extractVocabulary({ id: "prefix-test", gameMode: "vocabulary-cards" }, {entries:[{blocks:[
    {japanese:"かいわれ大根(かいわれだいこん)",reading:"かいわれだいこん",speech:"かいわれだいこん",english:"daikon sprouts"},
    {japanese:"火(ひ)を止(と)める",speech:"ひおとめる",english:"Turn off the heat"}
  ]}]});
  assert(prefixed[0].reading === "かいわれだいこん", "Explicit lexical reading overrides ambiguous mixed-kana annotation");
  assert(prefixed[1].reading === "ひをとめる" && prefixed[1].speech === "ひおとめる", "Written reading stays separate from contextual spoken particle");
  const catalog = JSON.parse(read(root + "/data/catalog.json"));
  let records = [];
  catalog.filter(l => l.gameMode === "vocabulary-cards" || l.answerMode === "reading-card").forEach(l => {
    (l.files || [l.file]).forEach(file => records.push(...k.extractVocabulary(l, JSON.parse(read(root + "/" + file)))));
  });
  window.WordExplosionGame.parseVocabulary(read(root + "/word explosion.txt"), { includeDuplicates: true }).forEach(w => records.push({
    spelling: w.kanji || w.japanese, reading: w.japanese, english: w.english, speech: w.japanese,
    sourceKey: `${w.japanese}|${w.kanji || ""}`, source: "word-explosion"
  }));
  const { dictionary, audit } = k.aggregate(records);
  assert(dictionary.size > 2000, "Shared dictionary includes far more than the selected topic");
  const ingredients = JSON.parse(read(root + "/data/ingredient-cards.json"));
  let prefixFixes=0;
  ingredients.entries.forEach(card=>card.blocks.forEach(block=>(block.items||[block]).forEach(word=>{
    if(word.reading){
      assert(k.annotatedReading(word.japanese)===word.reading,"Partial furigana agrees with explicit complete reading");
      assert(word.speech===word.reading,"Existing ingredient audio key preserved");prefixFixes++;
    }
  })));
  assert(prefixFixes>=24,"All identified ingredient-prefix annotations corrected");
  assert(dictionary.has("かいわれだいこん") && !dictionary.has("かいわれかいわれだいこん"),"Daikon sprouts reading has no duplicated prefix");
  ["ほうれんほうれんそう","ひよこひよこまめ","さらださらだな"].forEach(reading=>assert(!dictionary.has(reading),"No bogus repeated reading: "+reading));
  ["ingredient-cards", "fermentation-cards", "hiire-cards", "fish-cards", "topic-vocabulary-cards", "word-explosion", "taste-words", "household-finance-cards"].forEach(source => assert(audit.sources[source] > 0, "Included source: " + source));
  assert(!audit.sources["grammar-cards"] && !audit.sources["adult-sentences"], "Grammar and sentence decks do not become words");
  const initial = { kana: ["だ", "い", "こ", "ん", "お", "ろ", "し"], center: "ん" };
  const answers = k.validAnswers(dictionary, initial.kana, initial.center);
  assert(answers.includes("だいこん") && answers.includes("だいこんおろし"), "Board answers come from full shared dictionary");
  assert(k.validateAnswer("ダイコン", initial, dictionary).word, "Katakana input accepted");
  assert(k.validateAnswer("だいこん", initial, dictionary, ["だいこん"]).error.includes("already"), "Duplicate feedback");
  assert(k.validateAnswer("おろし", initial, dictionary).error.includes("centre"), "Centre required");
  assert(k.validateAnswer("だいこんが", initial, dictionary).error.includes("only"), "Unavailable kana rejected");
  assert(k.validateAnswer("んんん", initial, dictionary).error.includes("dictionary"), "Not in dictionary rejected");
  assert(k.validateAnswer("ん", initial, dictionary).error.includes("two"), "Minimum two kana");
  assert(k.pointsFor("だいこんおろし", initial) === 14 && k.pointsFor("だいこん", initial) === 4, "Length scoring and optional seven-kana bonus");
  let seed = 12345; const random = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
  const start = Date.now(), boards = k.generateBoards(dictionary, random);
  assert(boards.length > 10, "Enough real seven-kana boards");
  boards.forEach(board => {
    assert(board.kana.length === 7 && new Set(board.kana).size === 7 && board.kana.includes(board.center), "Exactly seven distinct kana");
    assert(board.answers.length >= 5 && new Set(board.answers).size === board.answers.length, "At least five distinct readings");
    assert(board.kana.every(c => board.answers.some(r => r.includes(c))), "Every tile participates in a valid answer");
    assert(JSON.stringify(board.answers) === JSON.stringify(k.validAnswers(dictionary, board.kana, board.center).sort()), "Every valid answer calculated before play");
  });
  assert(boards.some(board => !board.answers.some(r => board.kana.every(c => r.includes(c)))), "Pangram not mandatory");
  const saved = { ...initial, version: 1, found: ["だいこん", "だいこん", "invalid"], outer: initial.kana.filter(c => c !== "ん"), input: "だい", hint: "だいこんおろし", hintStage: 2, finished: false };
  const restored = k.restorePuzzle(JSON.parse(JSON.stringify(saved)), dictionary);
  assert(restored.found.join() === "だいこん" && restored.input === "だい" && restored.hintStage === 2, "Restore sanitizes progress and retains input and hint stage");
  assert(!k.restorePuzzle({ ...saved, kana: ["ん", "ん"] }, dictionary), "Corrupt board rejected");
  assert(k.restorePuzzle({ ...saved, finished: true }, dictionary).finished, "Finished state preserved");
  function hasMeaning(reading, meaning) {
    return dictionary.get(reading)?.variants.some(v => v.english === meaning);
  }
  assert(hasMeaning("じゅうねん", "10 years") && !hasMeaning("じゅうねん", "Number 10"), "Years retain their unit");
  assert(hasMeaning("じゅうがつ", "October") && hasMeaning("じゅっかげつ", "10 months"), "Calendar month and duration distinguished");
  assert(hasMeaning("ついたち", "1st day of the month") && hasMeaning("いちにち", "1 day"), "Date versus day duration");
  assert(hasMeaning("とおか", "10th day of the month") && hasMeaning("とおか", "10 days"), "Same reading retains date and duration senses");
  assert(hasMeaning("じゅうにん", "10 people") && hasMeaning("じゅっさい", "10 years old"), "People and ages retain context");
  assert(hasMeaning("げつようび", "Monday") && !hasMeaning("げつようび", "Number Monday"), "Non-number labels have no invented prefix");
  assert(hasMeaning("いっかい", "Once") && hasMeaning("いっかい", "Floor 1 (Japanese floor numbering)"), "Counter homophones retain distinct meanings");
  assert(hasMeaning("あまみ", "Sweetness") && hasMeaning("さんみ", "Sourness") && hasMeaning("にがみ", "Bitterness"), "Taste qualities are noun meanings");
  const counting = JSON.parse(read(root + "/data/counting-cards.json"));
  counting.entries.forEach(card => card.blocks.forEach(block => (block.numberRows || []).forEach(row => {
    assert(typeof row.english === "string" && row.english.length > 0, "Every counting row has an explicit source meaning");
    if (row.english.startsWith("Number ")) assert(card.id === "counting-card-01" || card.id === "counting-card-12", "Number label limited to actual numbers and numbered positions");
  })));
  const unsupportedMeaning = k.extractVocabulary({ id: "future-counter", gameMode: "vocabulary-cards" }, { entries: [{blocks:[{numberRows:[{number:"10", japanese:"十年", reading:"じゅうねん"}]}]}] });
  assert(unsupportedMeaning.length === 0, "Missing counter meanings never fall back to an invented Number label");
  assert(k.displayVariants(dictionary.get("すいはんき")).length===1,"Real rice-cooker sources display once");
  assert(k.displayVariants(dictionary.get("たん")).length===1,"Real tongue sources display once");
  assert(k.displayVariants(dictionary.get("いっかい")).length>=2,"Real frequency/floor homophones remain distinct");
  const variant = dictionary.get("だいこん").variants[0];
  assert(k.resolveAudio(variant)?.startsWith("audio/"), "Existing term audio resolves across source manifests");
  new Function(read(root + "/app.js"));
  return `PASS: ${dictionary.size} usable readings; ${audit.missingReading} unsupported readings; ${audit.tooShort} one-kana entries. ${boards.length} valid boards in ${Date.now() - start} ms. Aggregation, homophones, no sentence scraping, normalization, validation, scoring, persistence and audio checked.`;
}
