(() => {
  "use strict";
  // Dictionary game; retain the established save key so existing progress resumes.
  const SAVE_KEY = "washoku-kanahachi-dictionary-v1";
  const GOAL = 10;
  const DATA_FILE = "data/dictionaries/kanahachi-jmdict.json";
  const base = window.KanahachiCore;
  const { normalizeReading, displayVariants, resolveAudio, restorePuzzle } = base;
  function shuffled(values) {
    const copy = [...values];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }
  function progressLabel(count) {
    return `${count} / ${GOAL} found`;
  }
  function validateAnswer(...args) { return base.validateAnswer(...args); }
  function prioritizeBoards(store) {
    const words = [...store.appDictionary.values()].filter(word => word.kana.length <= 7);
    const candidates = store.data.boards.map(([kana, center]) => ({
      kana: [...kana], center,
      appAnswerCount: words.filter(word => word.kana.includes(center) && word.kana.every(c => kana.includes(c))).length
    }));
    // Keep the dictionary's ten-common-word guarantee, but favour app revision.
    const best = candidates.reduce((count, board) => Math.max(count, board.appAnswerCount), 0);
    const minimum = Math.min(5, best);
    return candidates.filter(board => board.appAnswerCount >= minimum);
  }
  function dictionaryForBoard(store, board) {
    const allowed = new Set(board.kana), records = [];
    const fits = reading => reading.includes(board.center) && [...reading].every(c => allowed.has(c));
    // Only materialize this board's answers, keeping the full dictionary light on phones.
    for (const entry of store.appDictionary.values()) {
      if (fits(entry.reading)) records.push(...entry.variants.flatMap(variant => variant.sources?.length ? variant.sources : [variant]));
    }
    for (const [reading, spelling, english, common, sourceId] of store.data.rows) {
      if (fits(reading)) records.push({ reading, spelling, english, common: !!common,
        source: "jmdict", sourceKey: `jmdict:${sourceId}`, speech: reading });
    }
    return base.aggregate(records).dictionary;
  }
  function hintCandidates(dictionary, found) {
    const remaining = [...dictionary.values()].filter(entry => !found.includes(entry.reading));
    const app = remaining.filter(entry => entry.variants.some(v => v.source !== "jmdict"));
    const common = remaining.filter(entry => entry.variants.some(v => v.common));
    return (app.length ? app : common.length ? common : remaining).map(entry => entry.reading);
  }
  async function loadDictionary(catalog, signal) {
    const response = await fetch(DATA_FILE, { signal });
    if (!response.ok) throw Error("辞書を読み込めませんでした。オンラインで一度アプリを開いてください。");
    const data = await response.json();
    if (data.version !== 1 || !Array.isArray(data.rows) || !Array.isArray(data.boards)) throw Error("辞書の形式が正しくありません。");
    const sources = [...new Set(catalog.filter(l => l.gameMode === "vocabulary-cards" || l.answerMode === "reading-card")
      .flatMap(l => l.files || [l.file]).filter(Boolean))];
    const records = [], unavailableSources = [];
    let cursor = 0;
    async function worker() {
      while (cursor < sources.length) {
        const file = sources[cursor++];
        try {
          const result = await fetch(file, { signal });
          if (!result.ok) throw Error(file);
          const content = await result.json();
          catalog.filter(l => (l.files || [l.file]).includes(file)).forEach(l => records.push(...base.extractVocabulary(l, content)));
        } catch (error) { if (signal.aborted) throw error; unavailableSources.push(file); }
      }
    }
    await Promise.all(Array.from({ length: 6 }, worker));
    try {
      const result = await fetch("data/word-explosion.txt", { signal });
      if (!result.ok) throw Error("word bank");
      window.WordExplosionGame.parseVocabulary(await result.text(), { includeDuplicates: true }).forEach(word => records.push({
        spelling: word.kanji || word.japanese, reading: word.japanese, english: word.english,
        speech: word.japanese, sourceKey: `${word.japanese}|${word.kanji || ""}`, source: "word-explosion"
      }));
    } catch (error) { if (signal.aborted) throw error; unavailableSources.push("data/word-explosion.txt"); }
    return { data, appDictionary: base.aggregate(records).dictionary, unavailableSources };
  }
  function mount(container, { catalog, toolbar, stopSpeech, createExampleSpeechButton, setJapaneseText }) {
    const controller = new AbortController(), { signal } = controller;
    let puzzle, dictionary, boards, store, alive = true, feedbackText = "", entryNotice = "", storageWarning = false, noticeTimer = null;
    document.documentElement.classList.add("kanahachi-open");
    container.classList.add("kanahachi-game");
    container.replaceChildren();
    const make = (tag, className, text) => { const e = document.createElement(tag); e.className = className; if (text !== undefined) e.textContent = text; return e; };
    const loading = make("p", "", "辞書を読み込んでいます…"); loading.setAttribute("role", "status"); container.append(loading);
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
    const rulesTitle = make("h2", "", "かなハチ の遊び方"); rulesTitle.id = "kanahachiRulesTitle";
    const rulesClose = button("×", () => rulesDialog.close(), "icon-button");
    rulesClose.setAttribute("aria-label", "遊び方を閉じる");
    rulesHeader.append(rulesTitle, rulesClose);
    const rulesBody = make("div", "popup-body"); rulesBody.lang = "ja";
    [
      "2文字以上のかなで言葉を作り、黄色の中央のかなを必ず使ってください。同じかなは何度でも使えます。小さいかなや、濁点・半濁点の付いたかなは、それぞれ別の文字として扱います。",
      "使えるのはハチの巣に表示された7文字だけです。「か」と「が」、「は」と「ば」と「ぱ」、「や」と「ゃ」は別の文字です。「っ」「ん」「ー」も、表示されているときに使えます。カタカナで入力しても、ひらがなに直して判定します。",
      "10語見つけると目標達成です。アプリの語彙も辞書の言葉も、同じように数えます。達成後もそのまま遊べます。",
      "辞書形の言葉を使います。固有名詞、古語、接頭辞・接尾辞だけの答えは辞書から除いています。辞書はJMdictを使い、既存の録音がある言葉だけ音声ボタンを表示します。",
      "ヒントでは、まだ見つけていない言葉の英語の意味が表示されます。「読みを見る」を押すと、かなの読みも表示されます。"
    ].forEach(text => rulesBody.append(make("p", "", text)));
    const attribution = make("a", "", "辞書：JMdict / EDRDG · CC BY-SA 4.0");
    attribution.href = "docs/licenses/jmdict.md"; attribution.target = "_blank"; attribution.rel = "noopener";
    rulesBody.append(attribution);
    rulesDialog.append(rulesHeader, rulesBody);
    container.closest("#wordExplosionScreen").append(rulesDialog);
    const help = document.getElementById("lessonIntroductionButton").cloneNode(true);
    help.id = "kanahachiRulesButton"; help.className = "icon-button"; help.disabled = false;
    help.setAttribute("aria-label", "かなハチ の遊び方"); help.title = "遊び方";
    help.addEventListener("click", () => { stopSpeech(); rulesDialog.showModal(); }, { signal });
    toolbar.replaceChildren(help); toolbar.classList.remove("hidden");
    function update(action) { stopSpeech(); action(); save(); render(); }
    function nextPuzzle() {
      const key = puzzle ? [...puzzle.kana].sort().join("") + puzzle.center : "";
      const options = boards.filter(b => [...b.kana].sort().join("") + b.center !== key);
      const board = (options.length ? options : boards)[Math.floor(Math.random() * (options.length || boards.length))];
      dictionary = dictionaryForBoard(store, board);
      puzzle = { ...board, answers: [...dictionary.keys()].sort(), version: 1, outer: shuffled(board.kana.filter(c => c !== board.center)), found: [], input: "", finished: false, hint: null, hintStage: 1 };
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
        const remaining = hintCandidates(dictionary, puzzle.found);
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
        }
        row.append(line);
      }
      row.append(make("p", "kanahachi-reading", reading + (revealed ? " · Revealed" : "")));
      return row;
    }
    function render() {
      const previousSummary = container.querySelector(".kanahachi-found-summary");
      const summaryScrollTop = previousSummary?.scrollTop || 0;
      const followLatest = !previousSummary || previousSummary.children.length !== puzzle.found.length;
      const focused = container.contains(document.activeElement) ? document.activeElement : null;
      const focusId = focused?.id;
      const focusText = focused?.tagName === "BUTTON" ? focused.textContent : null;
      stopSpeech();
      container.replaceChildren();
      const stats = make("p", "kanahachi-stats", `${progressLabel(puzzle.found.length)}`);
      const foundSummary = make("ul", "kanahachi-found-summary");
      foundSummary.setAttribute("aria-label", "見つけた言葉");
      foundSummary.lang = "ja";
      foundSummary.tabIndex = 0;
      puzzle.found.forEach(reading => {
        const word = make("li", "");
        const spellings = [...new Set(displayVariants(dictionary.get(reading)).flatMap(group => group.spellings))];
        spellings.forEach((spelling, index) => {
          const variant = make("span", "kanahachi-summary-spelling");
          setJapaneseText(variant, (index ? " / " : "") + spelling);
          word.append(variant);
        });
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
      const goal = make("p", "kanahachi-goal", puzzle.found.length >= GOAL ? "10語達成！ このまま続けられます。" : "");
      goal.setAttribute("role", "status");
      container.append(stats, goal, foundSummary, input, board, controls, tools, feedback);
      if (puzzle.hint) {
        const entry = dictionary.get(puzzle.hint);
        container.append(make("p", "kanahachi-hint", `Hint: ${entry.variants[0].english}${puzzle.hintStage === 2 ? " · " + entry.reading : ""}`));
      }
      const heading = make("h3", "", "Found words"), list = make("ul", "kanahachi-found");
      [...puzzle.found].reverse().forEach(r => list.append(wordRow(r, false))); container.append(heading, list);
      if (puzzle.found.length === puzzle.answers.length) container.append(make("p", "", "すべての答えが見つかりました！"));
      const remaining = puzzle.answers.filter(r => !puzzle.found.includes(r));
      if (puzzle.finished) {
        container.append(make("h3", "", "Remaining answers"));
        const revealed = make("ul", "kanahachi-found"); remaining.forEach(r => revealed.append(wordRow(r, true))); container.append(revealed);
      } else if (remaining.length) {
        container.append(button("終了して答えを見る", () => {
          if (window.confirm("この問題を終了して、残りの答えを表示しますか？")) update(() => { puzzle.finished = true; puzzle.hint = null; feedbackText = "終了しました。答えとして表示された言葉は、見つけた数に含まれません。"; });
        }));
      }
      if (store.unavailableSources.length) container.append(make("p", "", "一部のアプリ語彙は未保存です。辞書の言葉ではそのまま遊べます。"));
      if (storageWarning) container.append(make("p", "", "Local saving is unavailable in this browser; this puzzle will not survive refresh."));
      const nextFocus = focusId ? document.getElementById(focusId)
        : focusText ? [...container.querySelectorAll("button")].find(b => b.textContent === focusText) : null;
      nextFocus?.focus({ preventScroll: true });
      foundSummary.scrollTop = followLatest ? foundSummary.scrollHeight : summaryScrollTop;
    }
    (async () => {
      try {
        store = await loadDictionary(catalog, signal);
        if (!alive) return;
        await new Promise(resolve => setTimeout(resolve, 0));
        if (!alive) return;
        boards = prioritizeBoards(store);
        if (!boards.length) throw Error("10語の問題を読み込めませんでした。");
        let saved;
        try { saved = JSON.parse(localStorage.getItem(SAVE_KEY)); } catch (_) { /* Ignore invalid saves. */ }
        if (saved && Array.isArray(saved.kana) && saved.kana.length === 7) {
          dictionary = dictionaryForBoard(store, saved);
          puzzle = restorePuzzle(saved, dictionary);
          if (puzzle && puzzle.answers.length < GOAL) puzzle = null;
        }
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
  window.KanahachiDictionary = { GOAL, SAVE_KEY, DATA_FILE, progressLabel, prioritizeBoards, dictionaryForBoard, hintCandidates, validateAnswer, loadDictionary, mount };
})();
