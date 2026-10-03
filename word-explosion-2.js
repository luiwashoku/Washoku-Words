(() => {
  "use strict";

  function shuffle(items) {
    const result = [...items];
    for (let i = result.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }

  function mount(container, { file, initialWord, playSound, stopSpeech, speakerTemplate, createExampleSpeechButton, speakJapaneseText, getRecordedJapaneseFile }) {
    let alive = true;
    let solved = false;
    let revealTimer;
    let utterance;
    let word;
    let entries;
    let queue = [];
    const controller = new AbortController();
    container.replaceChildren();
    container.classList.add("listening-game");

    const stage = document.createElement("div");
    stage.className = "listening-stage";
    const box = document.createElement("div");
    box.className = "listening-box";
    box.setAttribute("aria-live", "polite");
    box.textContent = "?";
    box.setAttribute("aria-label", "Mystery word");
    stage.appendChild(box);

    const replay = speakerTemplate.cloneNode(true);
    replay.removeAttribute("id");
    replay.className = "icon-button listening-replay";
    replay.setAttribute("aria-label", "Hear the Japanese word again");
    replay.title = "もう一度聞く";
    replay.querySelectorAll(".pauseIcon, .resumeIcon").forEach((icon) => icon.remove());

    const status = document.createElement("p");
    status.className = "listening-status";
    status.setAttribute("role", "status");
    const choices = document.createElement("div");
    choices.className = "listening-choices";
    choices.setAttribute("role", "group");
    choices.setAttribute("aria-label", "Choose the English meaning");
    const again = document.createElement("button");
    again.type = "button";
    again.className = "answer-button listening-again hidden";
    again.textContent = "Next word →";
    const example = document.createElement("section");
    example.className = "explosion-examples listening-example hidden";
    example.setAttribute("aria-label", "Everyday example");
    container.append(stage, replay, status, choices, example, again);

    const indexButton = document.getElementById("explosionIndexButton");
    indexButton.disabled = true;
    const dialog = document.createElement("dialog");
    dialog.className = "explosion-index-dialog";
    dialog.setAttribute("aria-labelledby", "listeningIndexTitle");
    const header = document.createElement("div");
    header.className = "grammarIndexHeader";
    const title = document.createElement("h2");
    title.id = "listeningIndexTitle";
    title.textContent = "単語一覧";
    const close = document.createElement("button");
    close.type = "button";
    close.className = "icon-button";
    close.textContent = "×";
    close.setAttribute("aria-label", "Close word list");
    close.addEventListener("click", () => dialog.close());
    header.append(title, close);
    const search = document.createElement("input");
    search.type = "search";
    search.placeholder = "Search words · むしろ";
    search.setAttribute("aria-label", "Search Japanese or English words");
    const wordList = document.createElement("ol");
    wordList.className = "explosion-index-list listening-index-list";
    dialog.append(header, search, wordList);
    container.appendChild(dialog);
    function renderWordList() {
      const query = search.value.trim().normalize("NFC").toLowerCase();
      wordList.replaceChildren(...entries.filter((entry) =>
        `${entry.japanese} ${entry.kanji} ${entry.english}`.toLowerCase().includes(query)
      ).map((entry) => {
        const item = document.createElement("li");
        const select = document.createElement("button");
        select.type = "button";
        select.className = "listening-index-word";
        select.textContent = `${entry.japanese}${entry.kanji ? `（${entry.kanji}）` : ""} · ${entry.english}`;
        select.setAttribute("aria-label", `Practice ${entry.japanese}`);
        select.addEventListener("click", () => {
          dialog.close();
          queue = [entry];
          reset();
          replay.focus({ preventScroll: true });
        });
        item.append(select, createExampleSpeechButton(entry.japanese));
        return item;
      }));
    }
    search.addEventListener("input", renderWordList);
    indexButton.addEventListener("click", () => {
      stopSpeech();
      dialog.showModal();
      search.focus();
    }, { signal: controller.signal });
    dialog.addEventListener("close", stopSpeech);

    function speak() {
      if (!alive || !word) return;
      if (getRecordedJapaneseFile?.(word.japanese)) {
        stopSpeech();
        speakJapaneseText(word.japanese, replay, "Japanese word");
        return;
      }
      stopSpeech();
      utterance = null;
      const text = window.getJapaneseSpeechText(word.japanese);
      if (!text) return;
      const current = new SpeechSynthesisUtterance(text);
      current.lang = "ja-JP";
      current.rate = 0.65;
      const voices = window.speechSynthesis.getVoices().filter((voice) => voice.lang.toLowerCase().startsWith("ja"));
      const voice = voices.find((voice) => /otoya/i.test(voice.name) && /enhanced/i.test(`${voice.name} ${voice.voiceURI}`))
        || voices.find((voice) => /hattori/i.test(voice.name) && /enhanced/i.test(`${voice.name} ${voice.voiceURI}`))
        || voices.find((voice) => /hattori/i.test(voice.name))
        || voices.find((voice) => /otoya/i.test(voice.name))
        || voices.find((voice) => /kyoko|nanami|haruka|sayaka/i.test(voice.name))
        || voices[0];
      if (voice) current.voice = voice;
      current.addEventListener("start", () => {
        if (alive && utterance === current) {
          replay.classList.add("is-speaking");
          if (!solved) status.textContent = "";
        }
      });
      current.addEventListener("end", () => {
        if (alive && utterance === current) replay.classList.remove("is-speaking");
      });
      current.addEventListener("error", (event) => {
        if (!alive || utterance !== current) return;
        replay.classList.remove("is-speaking");
        if (!["canceled", "interrupted"].includes(event.error)) {
          status.textContent = "Tap the speaker to hear the word again.";
        }
      });
      utterance = current;
      window.speechSynthesis.speak(current);
    }

    function reveal() {
      if (!alive) return;
      box.classList.remove("is-bursting");
      box.classList.add("is-revealed");
      box.removeAttribute("aria-label");
      const reading = document.createElement("strong");
      reading.className = "listening-reading";
      reading.lang = "ja";
      reading.textContent = word.japanese;
      const kanji = document.createElement("span");
      kanji.className = "listening-kanji";
      kanji.lang = "ja";
      kanji.textContent = word.kanji;
      box.replaceChildren(reading);
      if (word.kanji) box.appendChild(kanji);
      const card = document.createElement("article");
      card.className = "explosion-example";
      const japanese = document.createElement("p");
      japanese.lang = "ja";
      japanese.textContent = word.example.japanese;
      const english = document.createElement("p");
      english.lang = "en";
      english.textContent = word.example.english;
      card.append(japanese, english, createExampleSpeechButton(word.example.japanese));
      example.replaceChildren(card);
      example.classList.remove("hidden");
      status.textContent = "Correct!";
      again.classList.remove("hidden");
      again.focus({ preventScroll: true });
    }

    function guess(button, meaning) {
      if (solved) return;
      if (meaning !== word.english) {
        button.classList.add("is-wrong");
        button.setAttribute("aria-label", `${meaning}: incorrect, try another answer`);
        status.textContent = "Not quite — listen again.";
        return;
      }
      solved = true;
      button.classList.add("is-correct");
      choices.querySelectorAll("button").forEach((choice) => { choice.disabled = true; });
      playSound("correct");
      box.textContent = "";
      box.classList.add("is-bursting");
      const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      svg.setAttribute("viewBox", "0 0 200 200");
      svg.setAttribute("aria-hidden", "true");
      svg.classList.add("listening-burst");
      const outline = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
      outline.setAttribute("points", "100,8 116,54 151,22 143,66 187,59 158,94 193,119 148,130 161,177 119,152 98,194 81,151 37,179 49,133 7,119 43,94 14,59 59,66 49,22 84,54");
      svg.appendChild(outline);
      box.appendChild(svg);
      status.textContent = "Correct!";
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) reveal();
      else revealTimer = window.setTimeout(reveal, 520);
    }

    function reset() {
      stopSpeech();
      utterance = null;
      replay.classList.remove("is-speaking");
      if (!queue.length) {
        queue = shuffle(entries);
        if (queue.length > 1 && queue[queue.length - 1] === word) {
          [queue[0], queue[queue.length - 1]] = [queue[queue.length - 1], queue[0]];
        }
      }
      word = queue.pop();
      solved = false;
      window.clearTimeout(revealTimer);
      box.className = "listening-box";
      box.textContent = "?";
      box.setAttribute("aria-label", "Mystery word");
      status.textContent = "";
      again.classList.add("hidden");
      example.classList.add("hidden");
      example.replaceChildren();
      const distractors = [];
      for (const entry of shuffle(entries)) {
        if (entry.japanese === word.japanese || entry.english.toLowerCase() === word.english.toLowerCase() ||
            distractors.some((other) => other.english.toLowerCase() === entry.english.toLowerCase())) continue;
        distractors.push(entry);
        if (distractors.length === 2) break;
      }
      const meanings = shuffle([word.english, ...distractors.map((entry) => entry.english)]);
      choices.replaceChildren(...meanings.map((meaning) => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "answer-button listening-choice";
        button.textContent = meaning;
        button.addEventListener("click", () => guess(button, meaning));
        return button;
      }));
      if (!replay.disabled) speak();
      else status.textContent = "Japanese audio is not available in this browser.";
    }

    const speechSupported = "speechSynthesis" in window && "SpeechSynthesisUtterance" in window;
    async function load() {
      replay.disabled = true;
      again.classList.add("hidden");
      status.textContent = "Loading words…";
      try {
        const loaded = await window.WordExplosionGame.loadVocabulary(file, controller.signal);
        if (!alive) return;
        entries = loaded.entries;
        title.textContent = `単語一覧 · ${entries.length}`;
        renderWordList();
        indexButton.disabled = false;
        if (initialWord) {
          const first = entries.find((entry) => entry.japanese === initialWord.japanese && entry.kanji === initialWord.kanji);
          if (first) queue = [...shuffle(entries.filter((entry) => entry !== first)), first];
          initialWord = null;
        }
        again.textContent = "Next word →";
        replay.disabled = !(getRecordedJapaneseFile?.(entries[0].japanese) || speechSupported);
        reset();
      } catch (error) {
        if (!alive || error.name === "AbortError") return;
        status.textContent = `Could not load the words. ${error.message}`;
        again.textContent = "Try again";
        again.classList.remove("hidden");
      }
    }
    replay.addEventListener("click", speak);
    again.addEventListener("click", () => {
      if (entries) {
        reset();
        replay.focus({ preventScroll: true });
      } else load();
    });
    load();
    return () => {
      alive = false;
      controller.abort();
      dialog.close();
      indexButton.disabled = true;
      utterance = null;
      window.clearTimeout(revealTimer);
      stopSpeech();
      container.classList.remove("listening-game");
      container.replaceChildren();
    };
  }

  window.WordExplosionListeningGame = { mount };
})();
