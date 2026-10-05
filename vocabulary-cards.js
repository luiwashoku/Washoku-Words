(() => {
  "use strict";

  function mount(container, { file, lesson, toolbar, navigation, stopSpeech, createExampleSpeechButton, getRecordedJapaneseFile, setJapaneseText }) {
    const controller = new AbortController();
    const { signal } = controller;
    let alive = true;
    let entries = [];
    let index = 0;
    let gesture = null;
    let furiganaVisible = false;
    let allDialog = null;
    const screen = container.closest("#wordExplosionScreen");
    screen.classList.add("study-cards-screen");
    document.documentElement.classList.add("vocabulary-cards-open");
    container.replaceChildren();
    container.classList.add("vocabulary-cards");
    container.classList.add("furigana-hidden");
    const wordPlayer = window.MoneyCatGame.createVocabularyPlayer(
      getRecordedJapaneseFile, src => new window.Audio(src), window.fetch.bind(window), signal);
    wordPlayer.unlock();

    toolbar.replaceChildren();
    toolbar.classList.remove("hidden");
    const furigana = document.createElement("button");
    furigana.type = "button";
    furigana.id = "vocabularyCardFurigana";
    furigana.className = "icon-button furigana-off";
    furigana.textContent = "ふり";
    furigana.setAttribute("aria-label", "Show furigana");
    furigana.setAttribute("aria-pressed", "true");
    furigana.title = "ふりがなを表示する";
    furigana.addEventListener("click", () => {
      furiganaVisible = !furiganaVisible;
      container.classList.toggle("furigana-hidden", !furiganaVisible);
      if (lesson.sentenceCards) allDialog?.classList.toggle("furigana-hidden", !furiganaVisible);
      furigana.classList.toggle("furigana-off", !furiganaVisible);
      furigana.setAttribute("aria-pressed", String(!furiganaVisible));
      furigana.setAttribute("aria-label", furiganaVisible ? "Hide furigana" : "Show furigana");
      furigana.title = furiganaVisible ? "ふりがなを隠す" : "ふりがなを表示する";
    }, { signal });
    toolbar.appendChild(furigana);
    if (lesson.gameMode === "vocabulary-cards") {
      const all = document.createElement("button");
      all.type = "button";
      all.className = "icon-button";
      all.textContent = "全";
      all.setAttribute("aria-label", lesson.id === "knife-making-steps" ? "Show all steps" : "Show all cards");
      const dialog = document.createElement("dialog");
      dialog.className = "knife-steps-list";
      allDialog = dialog;
      const close = document.createElement("button");
      close.type = "button";
      close.textContent = "閉じる";
      close.addEventListener("click", () => dialog.close(), { signal });
      all.addEventListener("click", () => {
        const list = document.createElement("div");
        entries.forEach((word, target) => {
          const button = document.createElement("button");
          button.type = "button";
          if (lesson.sentenceCards) setJapaneseText(button, word.kanji || word.japanese);
          else button.textContent = `${word.step ? word.step + ". " : ""}${word.kanji} — ${word.english}`;
          button.addEventListener("click", () => { move(target - index); dialog.close(); }, { signal });
          list.appendChild(button);
        });
        dialog.replaceChildren(close, list);
        if (lesson.sentenceCards) dialog.classList.toggle("furigana-hidden", !furiganaVisible);
        dialog.showModal();
      }, { signal });
      toolbar.append(all, dialog);
    }
    window.WashokuOffline?.addControls(toolbar, { ...lesson, title: lesson.gameMode === "vocabulary-cards" ? lesson.title : "単語カード" });

    const status = document.createElement("p");
    status.className = "vocabulary-cards-status";
    status.setAttribute("role", "status");
    const retry = document.createElement("button");
    retry.type = "button";
    retry.className = "answer-button hidden";
    retry.textContent = "Try again";

    const card = document.createElement("article");
    card.className = "vocabulary-study-card hidden";
    if (lesson.compactCards) card.classList.add("vocabulary-study-card--compact");
    if (lesson.grammarCards) card.classList.add("vocabulary-study-card--grammar");
    if (lesson.sentenceCards) card.classList.add("vocabulary-study-card--sentence");
    card.setAttribute("aria-labelledby", "studyCardWord");
    navigation.replaceChildren();
    const previous = document.createElement("button");
    previous.type = "button";
    previous.className = "icon-button";
    previous.textContent = "←";
    previous.setAttribute("aria-label", "Previous card");
    const next = document.createElement("button");
    next.type = "button";
    next.className = "icon-button";
    next.textContent = "→";
    next.setAttribute("aria-label", "Next card");
    const counter = document.createElement("span");
    counter.className = "vocabulary-card-counter";
    counter.setAttribute("role", "status");
    counter.setAttribute("aria-live", "polite");
    navigation.append(previous, counter, next);
    container.append(status, retry, card);

    function playWord() {
      if (!alive || !entries.length) return;
      stopSpeech();
      status.textContent = "";
      wordPlayer.play(entries[index].japanese).catch(() => {
        if (alive && !signal.aborted) status.textContent = "Tap the word speaker to play audio.";
      });
    }

    function render() {
      const word = entries[index];
      const wordRow = document.createElement("div");
      wordRow.className = "vocabulary-card-word-row";
      const wordText = document.createElement("div");
      wordText.className = "vocabulary-card-word-area";
      const heading = document.createElement("h3");
      heading.id = "studyCardWord";
      heading.lang = "ja";
      setJapaneseText(heading, `${word.step ? word.step + ". " : ""}${word.kanji || word.japanese}`);
      wordText.appendChild(heading);
      if (word.kanji && !lesson.grammarCards && !lesson.sentenceCards) {
        const reading = document.createElement("p");
        reading.className = "vocabulary-card-reading";
        reading.lang = "ja";
        reading.textContent = word.japanese;
        wordText.appendChild(reading);
      }
      const wordSpeaker = createExampleSpeechButton(word.japanese, lesson.sentenceCards ? "Japanese sentence" : lesson.grammarCards ? "Grammar point" : "Japanese word", playWord);
      wordSpeaker?.classList.add("vocabulary-card-word-speaker");
      const meaning = document.createElement("p");
      meaning.className = "vocabulary-card-meaning";
      meaning.lang = "en";
      meaning.textContent = word.english;
      wordText.appendChild(meaning);
      wordRow.append(wordText);
      if (wordSpeaker) wordRow.append(wordSpeaker);

      const example = document.createElement("section");
      example.className = "vocabulary-card-example";
      example.setAttribute("aria-label", "Example sentence");
      if (word.example) {
      const sentenceRow = document.createElement("div");
      sentenceRow.className = "vocabulary-card-sentence-row";
      const sentence = document.createElement("p");
      sentence.lang = "ja";
      setJapaneseText(sentence, word.example.japanese);
      const sentenceSpeaker = createExampleSpeechButton(word.example.japanese);
      sentenceSpeaker.addEventListener("click", () => wordPlayer.stop(), { capture: true, signal });
      sentenceRow.append(sentence, sentenceSpeaker);
      const translation = document.createElement("p");
      translation.className = "vocabulary-card-translation";
      translation.lang = "en";
      translation.textContent = word.example.english;
      example.append(sentenceRow, translation);
      }
      const content = [];
      if (word.image) {
        const illustration = document.createElement("img");
        illustration.className = "vocabulary-card-illustration";
        illustration.src = word.image;
        illustration.alt = word.imageAlt || word.kanji || word.japanese;
        illustration.decoding = "async";
        content.push(illustration);
      }
      content.push(wordRow);
      if (word.example) content.push(example);
      (word.examples || []).forEach(sample => {
        const section = document.createElement("section");
        section.className = "vocabulary-card-example grammar-card-example";
        const label = document.createElement("h4");
        label.textContent = sample.label;
        const row = document.createElement("div");
        row.className = "vocabulary-card-sentence-row";
        const sentence = document.createElement("p");
        sentence.lang = "ja";
        setJapaneseText(sentence, sample.japanese);
        const speaker = createExampleSpeechButton(sample.japanese);
        speaker.addEventListener("click", () => wordPlayer.stop(), { capture: true, signal });
        row.append(sentence, speaker);
        section.append(label, row);
        if (sample.english) {
          const translation = document.createElement("p");
          translation.className = "vocabulary-card-translation";
          translation.textContent = sample.english;
          section.append(translation);
        }
        content.push(section);
      });
      if (word.formation) {
        const section = document.createElement("section");
        section.className = "grammar-card-formation";
        const label = document.createElement("h4");
        label.textContent = "Formation";
        const formation = document.createElement("p");
        setJapaneseText(formation, word.formation);
        section.append(label, formation);
        if (word.registerNote) {
          const note = document.createElement("p");
          note.className = "vocabulary-card-translation";
          note.textContent = word.registerNote;
          section.append(note);
        }
        content.push(section);
      }
      card.replaceChildren(...content);
      counter.textContent = `${index + 1} / ${entries.length}`;
      previous.disabled = index === 0;
      next.disabled = index === entries.length - 1;
    }

    function move(direction) {
      if (!alive || !entries.length) return;
      const target = index + direction;
      if (target < 0 || target >= entries.length) return;
      stopSpeech();
      wordPlayer.stop();
      index = target;
      render();
      playWord();
    }

    previous.addEventListener("click", () => move(-1), { signal });
    next.addEventListener("click", () => move(1), { signal });
    document.addEventListener("keydown", (event) => {
      if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey ||
          event.target.closest?.("input, textarea, select, [contenteditable]")) return;
      if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
      event.preventDefault();
      move(event.key === "ArrowLeft" ? -1 : 1);
    }, { signal });
    card.addEventListener("pointerdown", (event) => {
      if (event.isPrimary === false || (event.pointerType === "mouse" && event.button !== 0) ||
          event.target.closest("button, a, input")) return;
      gesture = { x: event.clientX, y: event.clientY, id: event.pointerId };
    }, { signal });
    document.addEventListener("pointerup", (event) => {
      if (!gesture || event.pointerId !== gesture.id) return;
      const dx = event.clientX - gesture.x;
      const dy = event.clientY - gesture.y;
      gesture = null;
      if (Math.abs(dx) >= 55 && Math.abs(dx) > Math.abs(dy) * 1.4) move(dx < 0 ? 1 : -1);
    }, { signal });
    document.addEventListener("pointercancel", () => { gesture = null; }, { signal });

    async function load() {
      status.textContent = "Loading cards…";
      retry.classList.add("hidden");
      try {
        const data = lesson.gameMode === "vocabulary-cards"
          ? await fetch(file, { signal }).then(response => { if (!response.ok) throw new Error("Cards unavailable"); return response.json(); })
          : await window.WordExplosionGame.loadVocabulary(file, signal);
        if (!alive) return;
        entries = [...data.entries];
        if (!lesson.ordered) for (let i = entries.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [entries[i], entries[j]] = [entries[j], entries[i]];
        }
        index = 0;
        render();
        status.textContent = "";
        card.classList.remove("hidden");
        navigation.classList.remove("hidden");
        playWord();
      } catch (error) {
        if (!alive || error.name === "AbortError") return;
        status.textContent = "Could not load the cards. Please try again.";
        retry.classList.remove("hidden");
      }
    }
    retry.addEventListener("click", load, { signal });
    load();

    return () => {
      alive = false;
      controller.abort();
      wordPlayer.stop();
      stopSpeech();
      container.classList.remove("vocabulary-cards", "furigana-hidden");
      screen.classList.remove("study-cards-screen");
      document.documentElement.classList.remove("vocabulary-cards-open");
      toolbar.classList.add("hidden");
      toolbar.replaceChildren();
      navigation.classList.add("hidden");
      navigation.replaceChildren();
      container.replaceChildren();
    };
  }

  window.VocabularyCards = { mount };
})();
