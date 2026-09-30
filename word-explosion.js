(() => {
  "use strict";

  function parseVocabulary(text, { includeDuplicates = false } = {}) {
    const entries = [];
    const japaneseSeen = new Set();
    text.replace(/^\uFEFF/, "").split(/\r?\n/).forEach((line, index) => {
      if (!line.trim() || line.trim().startsWith("#")) return;
      const fields = line.split("|").map((part) => part.trim().normalize("NFC"));
      const answer = fields[1]?.match(/^([ぁ-ゖー]+)\s*(?:\(([^()（）]+)\)|（([^()（）]+)）)?$/u);
      if (fields.length !== 2 || !fields[0] || !answer) {
        throw new Error(`Line ${index + 1}: use English | hiragana (kanji). Kanji is optional.`);
      }
      const english = fields[0];
      const japanese = answer[1];
      const kanji = (answer[2] || answer[3] || "").trim();
      const key = `${japanese}|${kanji}`;
      if (!includeDuplicates && japaneseSeen.has(key)) return;
      japaneseSeen.add(key);
      entries.push({ english, japanese, kanji });
    });
    if (entries.length < 3) {
      throw new Error("Add at least 3 different English words with different hiragana answers.");
    }
    return entries;
  }

  async function loadVocabulary(file, signal) {
    const [response, examplesResponse] = await Promise.all([
      fetch(file, { cache: "no-store", signal }),
      fetch("data/word-explosion-examples.json", { cache: "no-store", signal })
    ]);
    if (!response.ok) throw new Error(`Vocabulary request failed (${response.status}).`);
    if (!examplesResponse.ok) throw new Error(`Examples request failed (${examplesResponse.status}).`);
    const [text, exampleBank] = await Promise.all([response.text(), examplesResponse.json()]);
    const entries = parseVocabulary(text).map((word) => {
      const example = exampleBank[`${word.japanese}|${word.kanji}`] || exampleBank[word.japanese];
      if (typeof example?.japanese !== "string" || !example.japanese.trim() ||
          typeof example?.english !== "string" || !example.english.trim()) {
        throw new Error(`Missing example for ${word.english}.`);
      }
      return { ...word, example };
    });
    return { entries, allWords: parseVocabulary(text, { includeDuplicates: true }) };
  }

  function shuffle(items) {
    const result = [...items];
    for (let i = result.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }

  function createRound(entries, initialWord) {
    if (entries.length < 3) throw new Error("A round needs at least 3 vocabulary entries.");
    const words = [];
    const first = initialWord && entries.find((entry) => entry.japanese === initialWord.japanese && entry.kanji === initialWord.kanji);
    for (const word of first ? [first, ...shuffle(entries)] : shuffle(entries)) {
      if (words.some((chosen) => chosen.japanese === word.japanese ||
          chosen.english.toLowerCase() === word.english.toLowerCase())) continue;
      words.push({ ...word, completed: false });
      if (words.length === 3) break;
    }
    if (words.length < 3) throw new Error("A round needs 3 distinct English prompts and hiragana answers.");
    const characters = words.flatMap((word) => Array.from(word.japanese));
    const tiles = shuffle(characters.map((character, id) => ({ id, character, used: false })));
    return { words, tiles, selected: [] };
  }

  function selectTile(round, id) {
    const tile = round.tiles.find((entry) => entry.id === id);
    if (!tile || tile.used || round.selected.includes(id)) return { type: "ignored" };
    round.selected.push(id);
    const text = round.selected.map((selectedId) =>
      round.tiles.find((entry) => entry.id === selectedId).character
    ).join("");
    const match = round.words.findIndex((word) => !word.completed && word.japanese === text);
    if (match !== -1) {
      round.words[match].completed = true;
      round.selected.forEach((selectedId) => {
        round.tiles.find((entry) => entry.id === selectedId).used = true;
      });
      round.selected = [];
      return { type: "correct", index: match, text, complete: round.words.every((word) => word.completed) };
    }
    if (!round.words.some((word) => !word.completed && word.japanese.startsWith(text))) {
      round.selected = [];
      return { type: "wrong", text };
    }
    return { type: "pending", text };
  }

  function mount(container, { file, initialWord, playSound, celebrate, createExampleSpeechButton, stopSpeech = () => {} }) {
    let alive = true;
    let round;
    let entries;
    let feedbackTimer;
    const burstTimers = new Set();
    const controller = new AbortController();
    container.replaceChildren();
    const promptList = document.createElement("div");
    promptList.className = "explosion-prompts";
    const selection = document.createElement("div");
    selection.className = "explosion-selection";
    selection.setAttribute("role", "group");
    selection.setAttribute("aria-label", "Your word. Select a character to return it.");
    const pool = document.createElement("div");
    pool.className = "explosion-pool";
    pool.setAttribute("role", "group");
    pool.setAttribute("aria-label", "Hiragana tiles");
    const status = document.createElement("p");
    status.className = "explosion-status";
    status.setAttribute("role", "status");
    status.textContent = "Loading words…";
    const next = document.createElement("button");
    next.type = "button";
    next.className = "answer-button explosion-next hidden";
    next.textContent = "Next round →";
    const examples = document.createElement("section");
    examples.className = "explosion-examples hidden";
    examples.setAttribute("aria-labelledby", "explosionExamplesTitle");
    const examplesTitle = document.createElement("h3");
    examplesTitle.id = "explosionExamplesTitle";
    examplesTitle.textContent = "Everyday examples";
    const exampleList = document.createElement("div");
    examples.append(examplesTitle, exampleList);
    const footer = document.createElement("div");
    footer.className = "explosion-footer";
    footer.append(examples, next);
    container.append(promptList, selection, pool, status, footer);
    const indexButton = document.getElementById("explosionIndexButton");
    indexButton.disabled = true;
    const dialog = document.createElement("dialog");
    dialog.className = "explosion-index-dialog";
    dialog.setAttribute("aria-labelledby", "explosionIndexTitle");
    const header = document.createElement("div");
    header.className = "grammarIndexHeader";
    const title = document.createElement("h2");
    title.id = "explosionIndexTitle";
    const close = document.createElement("button");
    close.type = "button";
    close.className = "icon-button";
    close.textContent = "×";
    close.setAttribute("aria-label", "Close word list");
    close.addEventListener("click", () => dialog.close());
    header.append(title, close);
    const wordList = document.createElement("ol");
    wordList.className = "explosion-index-list";
    dialog.append(header, wordList);
    container.appendChild(dialog);
    dialog.addEventListener("click", (event) => {
      if (event.target === dialog) {
        const bounds = dialog.getBoundingClientRect();
        if (event.clientX < bounds.left || event.clientX > bounds.right ||
            event.clientY < bounds.top || event.clientY > bounds.bottom) dialog.close();
      }
    });
    indexButton.addEventListener("click", () => dialog.showModal(), { signal: controller.signal });
    let tileButtons = new Map();
    let wordCards = [];

    function clearFeedback() {
      window.clearTimeout(feedbackTimer);
      selection.classList.remove("explosion-miss");
    }

    function paintSelection() {
      selection.replaceChildren();
      round.selected.forEach((id) => {
        const tile = round.tiles.find((entry) => entry.id === id);
        const button = document.createElement("button");
        button.type = "button";
        button.className = "explosion-tile";
        button.textContent = tile.character;
        button.setAttribute("aria-label", `Return ${tile.character}`);
        button.addEventListener("click", () => {
          clearFeedback();
          // Removing any selected tile also returns its suffix, keeping a valid prefix.
          round.selected.splice(round.selected.indexOf(id));
          paintSelection();
          tileButtons.get(id).focus();
        });
        selection.appendChild(button);
      });
      round.tiles.forEach((tile) => {
        const button = tileButtons.get(tile.id);
        button.disabled = tile.used || round.selected.includes(tile.id);
        button.classList.toggle("is-selected", round.selected.includes(tile.id));
        button.classList.toggle("is-consumed", tile.used);
      });
    }

    function showWordAnswer(word) {
      selection.replaceChildren();
      const reading = document.createElement("span");
      reading.className = "explosion-answer-reading";
      reading.textContent = word.japanese;
      selection.appendChild(reading);
      if (word.kanji) {
        const kanji = document.createElement("span");
        kanji.className = "explosion-answer-kanji";
        kanji.textContent = `（${word.kanji}）`;
        selection.appendChild(kanji);
      }
      status.textContent = `${word.english}: ${word.japanese}${word.kanji ? `（${word.kanji}）` : ""}`;
      status.classList.add("explosion-status-quiet");
    }

    function showRoundExamples() {
      exampleList.replaceChildren(...round.words.map((word) => {
        const card = document.createElement("article");
        card.className = "explosion-example";
        const heading = document.createElement("h4");
        heading.textContent = `${word.japanese}${word.kanji ? `（${word.kanji}）` : ""} · ${word.english}`;
        const japanese = document.createElement("p");
        japanese.lang = "ja";
        japanese.textContent = word.example.japanese;
        const english = document.createElement("p");
        english.lang = "en";
        english.textContent = word.example.english;
        card.append(heading, japanese, english);
        if (createExampleSpeechButton) {
          card.appendChild(createExampleSpeechButton(word.example.japanese));
        }
        return card;
      }));
      examples.classList.remove("hidden");
    }

    function tap(id, keyboard) {
      clearFeedback();
      const result = selectTile(round, id);
      if (result.type === "ignored") return;
      paintSelection();
      status.textContent = "";
      if (result.type === "wrong") {
        selection.textContent = result.text;
        selection.classList.add("explosion-miss");

        feedbackTimer = window.setTimeout(() => {
          if (!alive) return;
          selection.classList.remove("explosion-miss");
          paintSelection();
        }, 280);
      } else if (result.type === "correct") {
        showWordAnswer(round.words[result.index]);
        const card = wordCards[result.index];
        card.disabled = true;
        card.classList.add("is-completed");
        const svgNamespace = "http://www.w3.org/2000/svg";
        const burst = document.createElementNS(svgNamespace, "svg");
        burst.classList.add("explosion-burst");
        burst.setAttribute("viewBox", "-3 -3 106 106");
        burst.setAttribute("preserveAspectRatio", "none");
        burst.setAttribute("aria-hidden", "true");
        const outline = document.createElementNS(svgNamespace, "polygon");
        const wide = "49,0 55,23 75,0 69,30 86,25 76,42 100,50 76,62 82,81 66,75 66,96 51,80 33,100 34,77 8,83 24,63 0,53 26,45 21,16 40,29";
        outline.setAttribute("points", wide);
        outline.setAttribute("vector-effect", "non-scaling-stroke");
        burst.appendChild(outline);
        card.appendChild(burst);
        const timer = window.setTimeout(() => {
          card.classList.add("is-gone");
          card.setAttribute("aria-hidden", "true");
          burstTimers.delete(timer);
        }, 520);
        burstTimers.add(timer);
        playSound("correct");
        if (result.complete) {
          status.classList.remove("explosion-status-quiet");
          status.textContent = "Round clear!";
          status.classList.add("explosion-clear");
          showRoundExamples();
          next.classList.remove("hidden");
          celebrate(container);
        }
      } else {
        playSound("click");
      }
      if (keyboard) {
        if (result.complete) next.focus();
        else {
          const available = round.tiles.find((tile) => !tile.used && !round.selected.includes(tile.id));
          if (available) tileButtons.get(available.id).focus();
        }
      }
    }

    function nextRound() {
      stopSpeech();
      clearFeedback();
      burstTimers.forEach((timer) => window.clearTimeout(timer));
      burstTimers.clear();
      container.querySelectorAll(".sentence-confetti").forEach((burst) => burst.remove());
      round = createRound(entries, initialWord);
      initialWord = null;
      examples.classList.add("hidden");
      exampleList.replaceChildren();
      next.classList.add("hidden");
      status.classList.remove("explosion-clear", "explosion-status-quiet");
      status.textContent = "";
      promptList.replaceChildren();
      wordCards = round.words.map((word, index) => {
        const card = document.createElement("button");
        card.type = "button";
        card.className = `explosion-word explosion-color-${index}`;
        card.setAttribute("aria-label", `Reveal answer for ${word.english}`);
        const label = document.createElement("strong");
        label.textContent = word.english;
        card.addEventListener("click", () => {
          if (word.completed) return;
          clearFeedback();
          round.selected = [];
          paintSelection();
          showWordAnswer(word);
        });
        card.append(label);
        promptList.appendChild(card);
        return card;
      });
      pool.replaceChildren();
      tileButtons = new Map();
      round.tiles.forEach((tile, index) => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = `explosion-tile explosion-color-${index % 3}`;
        button.textContent = tile.character;
        button.addEventListener("click", (event) => tap(tile.id, event.detail === 0));
        tileButtons.set(tile.id, button);
        pool.appendChild(button);
      });
      paintSelection();
    }

    async function load() {
      next.classList.add("hidden");
      status.textContent = "Loading words…";
      try {
        const loaded = await loadVocabulary(file, controller.signal);
        if (!alive) return;
        entries = loaded.entries;
        const allWords = loaded.allWords;
        title.textContent = `単語一覧 · ${allWords.length}`;
        wordList.replaceChildren(...allWords.map((word) => {
          const item = document.createElement("li");
          const english = document.createElement("strong");
          english.textContent = word.english;
          const japanese = document.createElement("span");
          japanese.lang = "ja";
          japanese.textContent = `${word.japanese}${word.kanji ? `（${word.kanji}）` : ""}`;
          item.append(english, japanese);
          return item;
        }));
        indexButton.disabled = false;
        next.textContent = "Next round →";
        nextRound();
      } catch (error) {
        if (!alive || error.name === "AbortError") return;
        status.textContent = `Could not load the word list. ${error.message}`;
        next.textContent = "Try again";
        next.classList.remove("hidden");
      }
    }
    next.addEventListener("click", (event) => {
      if (entries) {
        nextRound();
        if (event.detail === 0) tileButtons.values().next().value.focus();
      } else load();
    });
    load();
    return () => {
      stopSpeech();
      alive = false;
      controller.abort();
      dialog.close();
      indexButton.disabled = true;
      window.clearTimeout(feedbackTimer);
      burstTimers.forEach((timer) => window.clearTimeout(timer));
      burstTimers.clear();
      container.replaceChildren();
    };
  }

  window.WordExplosionGame = { parseVocabulary, loadVocabulary, createRound, selectTile, mount };
})();
