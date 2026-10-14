(() => {
  "use strict";
  const SAVE_KEY = "washoku-kanahachi-v1";
  const kanaOnly = /^[ぁ-ゖー]+$/u;
  function normalizeReading(value) {
    return String(value || "").normalize("NFKC").trim()
      .replace(/[ァ-ヶ]/g, c => String.fromCharCode(c.charCodeAt(0) - 0x60)).normalize("NFC");
  }
  function stripReading(value) {
    return String(value || "").replace(/[（(][ぁ-ゖァ-ヶー]+[）)]/gu, "");
  }
  function annotatedReading(value) {
    const text = String(value || "").normalize("NFKC").trim();
    // Only supplied furigana; never guess unannotated kanji.
    return normalizeReading(text.replace(/[々〆一-龯]+\(([ぁ-ゖァ-ヶー]+)\)/gu, "$1"));
  }
  function isTerm(value) {
    const text = stripReading(value);
    return !!text && text.length <= 24 && !/[\s。！？!?、,;：:・／/～〜…「」『』]/u.test(text)
      && !/(です|ます|ません|ました|ましょう|ください|だった|している|になります)$/u.test(text);
  }
  function extractVocabulary(lesson, data) {
    const result = [];
    const add = (entry, spelling, reading, english) => {
      if (spelling && english && isTerm(spelling)) result.push({
        spelling: stripReading(spelling), reading: reading || annotatedReading(spelling), english,
        speech: entry.speech || reading || spelling, source: lesson.id, sourceFile: lesson.file,
        sourceKey: entry.sourceKey
      });
    };
    const rows = Array.isArray(data) ? data : data.entries || data.questions || [];
    if (lesson.gameMode === "vocabulary-cards" && !lesson.grammarCards && !lesson.sentenceCards && lesson.id !== "auto-response-cards") {
      rows.forEach(card => {
        if (!card.blocks || lesson.conjugationCards) add(card, card.kanji || card.japanese, card.reading || card.japanese, card.english);
        (card.blocks || []).forEach(block => {
          (block.pairs || []).forEach(pair => {
            const word = pair.vocabulary;
            if (word) {
              const annotated = annotatedReading(word.japanese);
              const suppliedKeyReading = pair.sourceKey?.split("|")[0];
              add({ ...word, sourceKey: pair.sourceKey }, word.japanese,
                word.reading || suppliedKeyReading || (kanaOnly.test(annotated) ? annotated : word.speech), word.english);
            }
          });
          (block.numberRows || []).forEach(word => add(word, word.japanese, word.reading, word.english));
          const words = block.items || (!block.heading && !block.pairs && !block.numberRows ? [block] : []);
          words.forEach(word => {
            if (isTerm(word.japanese) && word.english && !/[.!?]/.test(word.english)) {
              const annotated = annotatedReading(word.japanese);
              add(word, word.japanese, word.reading || (kanaOnly.test(annotated) ? annotated : word.speech), word.english);
            }
          });
        });
      });
    }
    rows.forEach(card => {
      if (card.answerMode === "reading-card" && card.englishTitle) add(card, card.question, annotatedReading(card.question), card.englishTitle);
      if (card.verb && card.verbReading && card.translation) {
        // A drill's sentence translation is not a dictionary meaning. Only explicit verb meanings qualify.
        if (card.verbMeaning) add(card, card.verb, card.verbReading, card.verbMeaning);
      }
      (card.vocabulary || []).forEach(word => add(word, word.spelling || word.japanese, word.reading, word.english));
    });
    return result;
  }
  function meaningKey(value) {
    return String(value || "").normalize("NFKC").trim().toLowerCase().replace(/\s+/g, " ");
  }
  function romanizedReading(reading) {
    const pairs = "あ:a い:i う:u え:e お:o か:ka き:ki く:ku け:ke こ:ko さ:sa し:shi す:su せ:se そ:so た:ta ち:chi つ:tsu て:te と:to な:na に:ni ぬ:nu ね:ne の:no は:ha ひ:hi ふ:fu へ:he ほ:ho ま:ma み:mi む:mu め:me も:mo や:ya ゆ:yu よ:yo ら:ra り:ri る:ru れ:re ろ:ro わ:wa を:wo ん:n が:ga ぎ:gi ぐ:gu げ:ge ご:go ざ:za じ:ji ず:zu ぜ:ze ぞ:zo だ:da ぢ:ji づ:zu で:de ど:do ば:ba び:bi ぶ:bu べ:be ぼ:bo ぱ:pa ぴ:pi ぷ:pu ぺ:pe ぽ:po";
    const kana = Object.fromEntries(pairs.split(" ").map(pair => pair.split(":")));
    let result = "", doubled = false;
    for (let i = 0; i < reading.length; i++) {
      if (reading[i] === "ー") continue;
      if (reading[i] === "っ") { doubled = true; continue; }
      let syllable = kana[reading[i]];
      if (!syllable) return null;
      const small = { "ゃ": "a", "ゅ": "u", "ょ": "o" }[reading[i + 1]];
      if (small && syllable.endsWith("i")) { syllable = syllable.slice(0, -1) + small; i++; }
      result += (doubled ? syllable[0] : "") + syllable; doubled = false;
    }
    return result;
  }
  function romanKey(text) {
    return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
      .replace(/[\s-]/g, "").replace(/([aeiou])\1/g, "$1").replace(/ou/g, "o");
  }
  function displayVariants(entry) {
    const groups = new Map(), romanized = romanizedReading(entry.reading);
    for (const variant of entry.variants) {
      let meaning = variant.english.trim();
      const parts = meaning.split(/\s*\/\s*/);
      // Omit a redundant romanized name only when it matches this exact reading.
      if (parts.length > 1 && /^[A-Za-zÀ-ž\s-]+$/.test(parts[0]) && romanized && romanKey(parts[0]) === romanKey(romanized)) meaning = parts.slice(1).join(" / ");
      const key = meaningKey(meaning);
      const group = groups.get(key) || { english: meaning, spellings: [], variants: [] };
      const base = variant.spelling.normalize("NFKC").replace(/\([^()]*\)/g, "");
      const index = group.spellings.findIndex(spelling => spelling.normalize("NFKC").replace(/\([^()]*\)/g, "") === base);
      if (index < 0) group.spellings.push(variant.spelling);
      else if (variant.spelling.length > group.spellings[index].length) group.spellings[index] = variant.spelling;
      group.variants.push(variant); groups.set(key, group);
    }
    return [...groups.values()];
  }
  function aggregate(records) {
    const dictionary = new Map();
    const audit = { candidates: records.length, missingReading: 0, tooShort: 0, sources: {}, variants: 0 };
    records.forEach(record => {
      const reading = normalizeReading(record.reading);
      if (!kanaOnly.test(reading)) { audit.missingReading++; return; }
      if (Array.from(reading).length < 2) { audit.tooShort++; return; }
      audit.sources[record.source] = (audit.sources[record.source] || 0) + 1;
      const entry = dictionary.get(reading) || { reading, kana: [...new Set(Array.from(reading))], variants: [] };
      let variant = entry.variants.find(v => v.spelling === record.spelling && meaningKey(v.english) === meaningKey(record.english));
      if (!variant) { variant = { ...record, reading, sources: [] }; entry.variants.push(variant); audit.variants++; }
      if (!variant.sources.some(s => s.source === record.source && s.speech === record.speech)) variant.sources.push(record);
      dictionary.set(reading, entry);
    });
    audit.readings = dictionary.size;
    return { dictionary, audit };
  }
  function validAnswers(dictionary, kana, center) {
    const allowed = new Set(kana);
    return [...dictionary.values()].filter(word => word.kana.includes(center) && word.kana.every(c => allowed.has(c))).map(word => word.reading);
  }
  function validateAnswer(value, board, dictionary, found = []) {
    const reading = normalizeReading(value);
    if (!kanaOnly.test(reading) || Array.from(reading).length < 2) return { error: "Use at least two kana.", reading };
    if (!reading.includes(board.center)) return { error: `Include the centre kana ${board.center}.`, reading };
    if ([...reading].some(c => !board.kana.includes(c))) return { error: "Use only the kana shown in the honeycomb.", reading };
    if (!dictionary.has(reading)) return { error: "That reading is not in this game's vocabulary dictionary.", kind: "not-found", reading };
    if (found.includes(reading)) return { error: "You already found that word.", reading };
    return { reading, word: dictionary.get(reading), points: pointsFor(reading, board) };
  }
  function pointsFor(reading, board) {
    return [...reading].length + (board.kana.every(c => reading.includes(c)) ? 7 : 0);
  }
  function shuffled(list, random = Math.random) {
    const copy = [...list];
    for (let i = copy.length - 1; i > 0; i--) { const j = Math.floor(random() * (i + 1)); [copy[i], copy[j]] = [copy[j], copy[i]]; }
    return copy;
  }
  function generateBoards(dictionary, random = Math.random) {
    const words = shuffled([...dictionary.values()].filter(w => w.kana.length <= 7), random);
    const candidates = new Map();
    const add = chars => { if (chars.length === 7) candidates.set([...chars].sort().join(""), chars); };
    // Bounded union search: actual words supply every tile, never random filler.
    words.filter(w => w.kana.length === 7).slice(0, 90).forEach(w => add(w.kana));
    const seeds = words.slice(0, 400), partners = words.slice(0, 160);
    for (const seed of seeds) {
      for (const partner of partners) {
        if (!seed.kana.some(c => partner.kana.includes(c))) continue;
        add([...new Set([...seed.kana, ...partner.kana])]);
        if (candidates.size >= 180) break;
      }
      if (candidates.size >= 180) break;
    }
    const boards = [];
    for (const kana of candidates.values()) {
      const subset = words.filter(w => w.kana.every(c => kana.includes(c)));
      for (const center of kana) {
        const answers = subset.filter(w => w.kana.includes(center)).map(w => w.reading).sort();
        if (answers.length >= 5 && kana.every(c => answers.some(r => r.includes(c)))) boards.push({ kana: [...kana], center, answers });
      }
    }
    const comfortable = boards.filter(b => b.answers.length <= 35);
    return shuffled(comfortable.length ? comfortable : boards, random);
  }
  function restorePuzzle(saved, dictionary) {
    if (!saved || saved.version !== 1 || !Array.isArray(saved.kana) || saved.kana.length !== 7 || new Set(saved.kana).size !== 7
      || saved.kana.some(c => !kanaOnly.test(c) || [...c].length !== 1) || !saved.kana.includes(saved.center)) return null;
    const answers = validAnswers(dictionary, saved.kana, saved.center).sort();
    if (answers.length < 5) return null;
    const found = Array.isArray(saved.found) ? [...new Set(saved.found.filter(r => answers.includes(r)))] : [];
    const outer = saved.outer;
    return { ...saved, answers, found, outer: Array.isArray(outer) && outer.length === 6 && new Set(outer).size === 6
      && outer.every(c => saved.kana.includes(c) && c !== saved.center) ? outer : saved.kana.filter(c => c !== saved.center),
      input: typeof saved.input === "string" ? [...normalizeReading(saved.input)].filter(c => saved.kana.includes(c)).join("").slice(0, 48) : "",
      finished: saved.finished === true, hint: answers.includes(saved.hint) && !found.includes(saved.hint) ? saved.hint : null,
      hintStage: saved.hintStage === 2 ? 2 : 1 };
  }
  async function loadDictionary(catalog, signal) {
    const lessons = catalog.filter(l => l.gameMode === "vocabulary-cards" || l.answerMode === "reading-card");
    const jobs = new Map();
    lessons.forEach(lesson => (lesson.files || [lesson.file]).filter(Boolean).forEach(file => {
      if (!jobs.has(file)) jobs.set(file, []);
      jobs.get(file).push(lesson);
    }));
    const records = [], tasks = [...jobs], failures = [];
    let cursor = 0;
    async function worker() {
      while (cursor < tasks.length) {
        const [file, owners] = tasks[cursor++];
        try {
          const response = await fetch(file, { signal });
          if (!response.ok) throw Error(file);
          const data = await response.json();
          owners.forEach(lesson => records.push(...extractVocabulary(lesson, data)));
        } catch (error) { if (signal.aborted) throw error; failures.push(file); }
      }
    }
    await Promise.all(Array.from({ length: 6 }, worker));
    // The app-wide word bank is shared by both Word Explosion games and Money Cat.
    const response = await fetch("data/word-explosion.txt", { signal });
    if (!response.ok) throw Error("Could not load the shared word bank.");
    window.WordExplosionGame.parseVocabulary(await response.text(), { includeDuplicates: true }).forEach(word => records.push({
      spelling: word.kanji || word.japanese, reading: word.japanese, english: word.english,
      speech: word.japanese, sourceKey: `${word.japanese}|${word.kanji || ""}`, source: "word-explosion"
    }));
    if (failures.length) throw Error(`Could not load ${failures.length} vocabulary source(s). Go back and reopen to retry.`);
    const result = aggregate(records);
    result.audit.files = tasks.map(([file]) => file).concat("data/word-explosion.txt");
    return result;
  }
  function resolveAudio(variant) {
    const clean = window.getJapaneseSpeechText || (s => s);
    const sources = variant.sources || [variant];
    for (const source of sources) {
      const keys = [source.sourceKey, source.speech, variant.reading, variant.spelling].filter(Boolean).map(clean);
      const files = window.lessonAudioFiles?.[source.source];
      for (const key of keys) if (files?.[key]) return files[key];
    }
    const keys = [variant.sourceKey, `${variant.reading}|${variant.spelling}`, variant.reading, variant.spelling].filter(Boolean).map(clean);
    for (const files of [window.wordExplosionAudioFiles, window.gameAudioFiles, window.tasteAudioFiles]) {
      for (const key of keys) if (files?.[key]) return files[key];
    }
    return null;
  }
  function mount(container, { catalog, toolbar, stopSpeech, createExampleSpeechButton, setJapaneseText }) {
    const controller = new AbortController(), { signal } = controller;
    let puzzle, dictionary, boards, audit, alive = true, feedbackText = "", entryNotice = "", storageWarning = false, noticeTimer = null;
    document.documentElement.classList.add("kanahachi-open");
    container.classList.add("kanahachi-game");
    container.replaceChildren();
    const make = (tag, className, text) => { const e = document.createElement(tag); e.className = className; if (text !== undefined) e.textContent = text; return e; };
    const loading = make("p", "", "Preparing seven-kana puzzles…"); loading.setAttribute("role", "status"); container.append(loading);
    function save() {
      try { localStorage.setItem(SAVE_KEY, JSON.stringify({ ...puzzle, version: 1, answers: undefined })); }
      catch (_) { storageWarning = true; }
    }
    function button(text, action, className = "kanahachi-control") {
      const e = make("button", className, text); e.type = "button";
      e.addEventListener("click", action); return e;
    }
    function clearEntryNotice() {
      if (noticeTimer !== null) { clearTimeout(noticeTimer); noticeTimer = null; }
      entryNotice = "";
      if (feedbackText === "見つかりません!") feedbackText = "";
    }
    const rulesDialog = make("dialog", "knife-steps-list kanahachi-rules-dialog");
    rulesDialog.setAttribute("aria-labelledby", "kanahachiRulesTitle");
    const rulesHeader = make("div", "popup-header");
    const rulesTitle = make("h2", "", "かなハチの遊び方"); rulesTitle.id = "kanahachiRulesTitle";
    const rulesClose = button("×", () => rulesDialog.close(), "icon-button");
    rulesClose.setAttribute("aria-label", "遊び方を閉じる");
    rulesHeader.append(rulesTitle, rulesClose);
    const rulesBody = make("div", "popup-body"); rulesBody.lang = "ja";
    [
      "2文字以上のかなで言葉を作り、黄色の中央のかなを必ず使ってください。同じかなは何度でも使えます。小さいかなや、濁点・半濁点の付いたかなは、それぞれ別の文字として扱います。",
      "使えるのはハチの巣に表示された7文字だけです。「か」と「が」、「は」と「ば」と「ぱ」、「や」と「ゃ」は別の文字です。「っ」「ん」「ー」も、表示されているときに使えます。カタカナで入力しても、ひらがなに直して判定します。",
      "1文字につき1点。7文字をすべて使った言葉は、さらに7点です。",
      "ヒントでは、まだ見つけていない言葉の英語の意味が表示されます。「読みを見る」を押すと、かなの読みも表示されます。"
    ].forEach(text => rulesBody.append(make("p", "", text)));
    rulesDialog.append(rulesHeader, rulesBody);
    container.closest("#wordExplosionScreen").append(rulesDialog);
    const help = document.getElementById("lessonIntroductionButton").cloneNode(true);
    help.id = "kanahachiRulesButton"; help.className = "icon-button"; help.disabled = false;
    help.setAttribute("aria-label", "かなハチの遊び方"); help.title = "遊び方";
    help.addEventListener("click", () => { stopSpeech(); rulesDialog.showModal(); }, { signal });
    toolbar.replaceChildren(help); toolbar.classList.remove("hidden");
    function update(action) { stopSpeech(); action(); save(); render(); }
    function nextPuzzle() {
      const key = puzzle ? [...puzzle.kana].sort().join("") + puzzle.center : "";
      const options = boards.filter(b => [...b.kana].sort().join("") + b.center !== key);
      const board = (options.length ? options : boards)[Math.floor(Math.random() * (options.length || boards.length))];
      puzzle = { ...board, version: 1, outer: shuffled(board.kana.filter(c => c !== board.center)), found: [], input: "", finished: false, hint: null, hintStage: 1 };
      feedbackText = "";
      clearEntryNotice();
      save(); render();
    }
    function enter() {
      if (puzzle.finished) return;
      const result = validateAnswer(puzzle.input, puzzle, dictionary, puzzle.found);
      if (result.error) {
        if (result.kind === "not-found") {
          puzzle.input = "";
          clearEntryNotice();
          entryNotice = "見つかりません!";
          feedbackText = "見つかりません!";
          save();
          noticeTimer = setTimeout(() => {
            noticeTimer = null;
            if (!alive) return;
            entryNotice = "";
            if (feedbackText === "見つかりません!") feedbackText = "";
            const field = container.querySelector(".kanahachi-input");
            if (field) field.placeholder = "";
            const feedback = container.querySelector(".kanahachi-feedback");
            if (feedback) feedback.textContent = feedbackText;
          }, 1000);
        } else {
          clearEntryNotice();
          feedbackText = result.error;
        }
        render(); return;
      }
      clearEntryNotice();
      update(() => {
        puzzle.found.push(result.reading); puzzle.input = "";
        if (puzzle.hint === result.reading) puzzle.hint = null;
        feedbackText = "";
      });
    }
    function hint() {
      update(() => {
        if (puzzle.hint && !puzzle.found.includes(puzzle.hint)) { puzzle.hintStage = 2; return; }
        const remaining = puzzle.answers.filter(r => !puzzle.found.includes(r));
        puzzle.hint = remaining[Math.floor(Math.random() * remaining.length)] || null;
        puzzle.hintStage = 1;
      });
    }
    function wordRow(reading, revealed) {
      const entry = dictionary.get(reading), row = make("li", "kanahachi-word"); row.dataset.reading = reading;
      for (const group of displayVariants(entry)) {
        const line = make("div", "kanahachi-word-variant");
        const spelling = make("strong", ""); setJapaneseText(spelling, group.spellings.join(" / "));
        const meaning = make("span", "", group.english);
        line.append(spelling, meaning);
        const file = group.variants.map(resolveAudio).find(Boolean);
        if (file) {
          const audio = createExampleSpeechButton(`kanahachi-audio:${file}`, `Listen to ${group.spellings.join(" / ")}`);
          line.append(audio);
        } else line.append(make("small", "", "Recording unavailable"));
        row.append(line);
      }
      row.append(make("p", "kanahachi-reading", reading + (revealed ? " · Revealed" : "")));
      return row;
    }
    function render() {
      const focused = container.contains(document.activeElement) ? document.activeElement : null;
      const focusId = focused?.id;
      const focusText = focused?.tagName === "BUTTON" ? focused.textContent : null;
      stopSpeech();
      container.replaceChildren();
      const stats = make("p", "kanahachi-stats", `${puzzle.found.reduce((n, r) => n + pointsFor(r, puzzle), 0)} points · ${puzzle.found.length} / ${puzzle.answers.length} found`);
      const foundSummary = make("ul", "kanahachi-found-summary");
      foundSummary.setAttribute("aria-label", "見つけた言葉");
      foundSummary.lang = "ja";
      puzzle.found.forEach(reading => {
        const word = make("li", "");
        const spellings = [...new Set(displayVariants(dictionary.get(reading)).flatMap(group => group.spellings))];
        setJapaneseText(word, spellings.join(" / "));
        foundSummary.append(word);
      });
      const board = make("div", "kanahachi-honeycomb"); board.setAttribute("role", "group"); board.setAttribute("aria-label", "Seven kana; centre kana required");
      [puzzle.center, ...puzzle.outer].forEach((kana, index) => {
        const tile = button(kana, () => update(() => { if (!puzzle.finished && [...puzzle.input].length < 48) { clearEntryNotice(); puzzle.input += kana; } }), `kanahachi-tile kanahachi-tile-${index}`);
        tile.lang = "ja"; tile.disabled = puzzle.finished; tile.setAttribute("aria-label", `${kana}${index === 0 ? " · required centre kana" : ""}`); board.append(tile);
      });
      const input = make("input", "kanahachi-input"); input.id = "kanahachiInput"; input.lang = "ja"; input.value = puzzle.input;
      input.setAttribute("aria-label", "入力した言葉");
      input.placeholder = entryNotice;
      input.autocomplete = "off"; input.spellcheck = false; input.maxLength = 48; input.disabled = puzzle.finished;
      input.addEventListener("input", () => { clearEntryNotice(); input.placeholder = ""; puzzle.input = input.value; save(); });
      input.addEventListener("keydown", event => { if (event.key === "Enter" && !event.isComposing) { event.preventDefault(); puzzle.input = input.value; enter(); } });
      const controls = make("div", "kanahachi-controls kanahachi-controls--entry");
      const del = button("×", () => update(() => { clearEntryNotice(); puzzle.input = [...puzzle.input].slice(0, -1).join(""); }), "icon-button kanahachi-delete");
      del.id = "kanahachiDeleteButton";
      del.innerHTML = '<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M10 10 22 22M22 10 10 22"></path></svg>';
      del.setAttribute("aria-label", "一文字削除"); del.title = "一文字削除";
      const submit = button("決定", enter, "kanahachi-control kanahachi-enter");
      submit.lang = "ja";
      [del, submit].forEach(b => { b.disabled = puzzle.finished; controls.append(b); });
      const tools = make("div", "kanahachi-controls kanahachi-tools");
      const hintButton = button(puzzle.hint && puzzle.hintStage === 1 ? "読みを見る" : "ヒント", () => {
        if (puzzle.hintStage === 2) puzzle.hint = null;
        hint();
      });
      hintButton.disabled = puzzle.finished || puzzle.found.length === puzzle.answers.length;
      const fresh = button("新しい問題", () => {
        if (puzzle.found.length && !puzzle.finished && puzzle.found.length < puzzle.answers.length && !window.confirm("新しい問題を始めますか？ 今の進み具合は保存されません。")) return;
        stopSpeech(); nextPuzzle();
      }, "kanahachi-control kanahachi-new");
      [hintButton, fresh].forEach(b => { b.lang = "ja"; tools.append(b); });
      const feedback = make("p", "kanahachi-feedback", feedbackText); feedback.setAttribute("role", "status"); feedback.setAttribute("aria-live", "polite");
      container.append(stats, foundSummary, input, board, controls, tools, feedback);
      if (puzzle.hint) {
        const entry = dictionary.get(puzzle.hint);
        container.append(make("p", "kanahachi-hint", `Hint: ${entry.variants[0].english}${puzzle.hintStage === 2 ? " · " + entry.reading : ""}`));
      }
      const heading = make("h3", "", "Found words"), list = make("ul", "kanahachi-found");
      [...puzzle.found].reverse().forEach(r => list.append(wordRow(r, false))); container.append(heading, list);
      if (puzzle.found.length === puzzle.answers.length) container.append(make("p", "", "You found every answer! Try a new puzzle."));
      const remaining = puzzle.answers.filter(r => !puzzle.found.includes(r));
      if (puzzle.finished) {
        container.append(make("h3", "", "Remaining answers"));
        const revealed = make("ul", "kanahachi-found"); remaining.forEach(r => revealed.append(wordRow(r, true))); container.append(revealed);
      } else if (remaining.length) {
        container.append(button("終了して答えを見る", () => {
          if (window.confirm("この問題を終了して、残りの答えを表示しますか？")) update(() => { puzzle.finished = true; puzzle.hint = null; feedbackText = "Puzzle finished. Revealed words earn no points."; });
        }));
      }
      if (storageWarning) container.append(make("p", "", "Local saving is unavailable in this browser; this puzzle will not survive refresh."));
      const nextFocus = focusId ? document.getElementById(focusId)
        : focusText ? [...container.querySelectorAll("button")].find(b => b.textContent === focusText) : null;
      nextFocus?.focus({ preventScroll: true });
    }
    (async () => {
      try {
        ({ dictionary, audit } = await loadDictionary(catalog, signal));
        if (!alive) return;
        // Yield before bounded board generation so mobile browsers can paint loading feedback.
        await new Promise(resolve => setTimeout(resolve, 0));
        if (!alive) return;
        boards = generateBoards(dictionary);
        if (!boards.length) throw Error("No seven-kana puzzle with five answers is available in the current vocabulary.");
        let saved;
        try { saved = JSON.parse(localStorage.getItem(SAVE_KEY)); } catch (_) { /* Ignore invalid/stale save. */ }
        puzzle = restorePuzzle(saved, dictionary);
        if (puzzle) { feedbackText = ""; render(); }
        else nextPuzzle();
      } catch (error) {
        if (alive) { container.replaceChildren(make("p", "", error.message), button("Retry", () => { stopSpeech(); window.location.reload(); })); }
      }
    })();
    return () => {
      alive = false; controller.abort(); clearEntryNotice(); stopSpeech();
      if (rulesDialog.open) rulesDialog.close(); rulesDialog.remove();
      toolbar.replaceChildren(); toolbar.classList.add("hidden");
      container.classList.remove("kanahachi-game"); document.documentElement.classList.remove("kanahachi-open");
    };
  }
  window.Kanahachi = { normalizeReading, annotatedReading, extractVocabulary, aggregate, displayVariants, validAnswers, validateAnswer, pointsFor, generateBoards, restorePuzzle, loadDictionary, resolveAudio, mount };
})();
