(() => {
  "use strict";
  function mount(container, { file, questionId, playSound, stopSpeech, createExampleSpeechButton, setJapaneseText, getRecordedJapaneseFile, toolbar, navigation }) {
    const controller = new AbortController(), { signal } = controller;
    let families = [], index = 0, alive = true, furiganaVisible = false, audio = null;
    const sessions = new Map(), timers = new Set(), flashes = new WeakMap();
    const make = (tag, className, text) => { const node = document.createElement(tag); node.className = className; if (text) node.textContent = text; return node; };
    container.replaceChildren(); container.classList.add("families-of-doom", "furigana-hidden");
    const screen = container.closest("#wordExplosionScreen");
    screen.classList.add("study-cards-screen");
    toolbar.replaceChildren(); toolbar.classList.remove("hidden");
    const tools = make("div", "doom-tools");
    const furigana = make("button", "icon-button furigana-off", "ふり");
    furigana.id = "doomFurigana";
    furigana.type = "button"; furigana.setAttribute("aria-label", "Show furigana"); furigana.setAttribute("aria-pressed", "false");
    furigana.addEventListener("click", () => {
      furiganaVisible = !furiganaVisible;
      container.classList.toggle("furigana-hidden", !furiganaVisible);
      dialog.classList.toggle("furigana-hidden", !furiganaVisible);
      meaningsDialog.classList.toggle("furigana-hidden", !furiganaVisible);
      furigana.classList.toggle("furigana-off", !furiganaVisible);
      furigana.setAttribute("aria-pressed", String(furiganaVisible));
      furigana.setAttribute("aria-label", furiganaVisible ? "Hide furigana" : "Show furigana");
    }, { signal });
    const all = make("button", "icon-button", "全");
    all.type = "button"; all.setAttribute("aria-label", "Show all families"); all.disabled = true;
    const dialog = make("dialog", "doom-all-dialog furigana-hidden");
    tools.append(furigana, all, dialog);
    toolbar.append(tools);
    const status = make("p", "doom-status", "Loading…"); status.setAttribute("role", "status");
    const card = make("article", "doom-card");
    const meaningsDialog = make("dialog", "doom-all-dialog doom-meanings-dialog furigana-hidden");
    meaningsDialog.setAttribute("aria-label", "Word meanings");

    navigation.replaceChildren(); navigation.classList.add("doom-navigation"); navigation.classList.remove("hidden"); navigation.setAttribute("aria-label", "Word groups");
    const previous = make("button", "icon-button", "←"), next = make("button", "icon-button", "→"), counter = make("span", "");
    for (const button of [previous, next]) button.type = "button";
    previous.setAttribute("aria-label", "Previous word group"); next.setAttribute("aria-label", "Next word group");
    previous.disabled = next.disabled = true;
    navigation.append(previous, counter, next); container.append(status, card, meaningsDialog);
    function popupHeader(close, subtitle, id) {
      const header = make("div", "grammarIndexHeader popup-header");
      const labels = make("div", "");
      const title = make("h2", "", "Families of Doom"); title.id = id;
      labels.append(make("span", "", subtitle), title);
      header.append(labels, close);
      return header;
    }
    function stopAudio() { if (audio) { audio.pause(); audio = null; } stopSpeech(); }
    function shuffle(questions) {
      const result = [...questions];
      for (let i = result.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [result[i], result[j]] = [result[j], result[i]]; }
      return result;
    }
    function sessionFor(family) {
      if (!sessions.has(family.id)) sessions.set(family.id, { questions: shuffle(family.questions), position: 0, complete: false });
      return sessions.get(family.id);
    }
    function advance(session) {
      if (!alive || session !== sessionFor(families[index]) || !session.complete) return;
      stopAudio();
      if (session.position < session.questions.length - 1) { session.position++; session.complete = false; status.textContent = ""; render(); }
      else { status.textContent = "Family complete!"; render(); }
    }
    function playSentence(question) {
      stopAudio();
      const path = getRecordedJapaneseFile(question.sentence);
      if (!path) { status.textContent = "Recording unavailable. Use Next question to continue."; return; }
      const clip = new window.Audio(path); audio = clip;
      clip.addEventListener("ended", () => {
        if (audio !== clip || !alive) return;
        audio = null;
      }, { once: true });
      clip.addEventListener("error", () => { if (audio === clip) { audio = null; status.textContent = "Tap the speaker to retry, or use Next question."; } }, { once: true });
      Promise.resolve(clip.play()).catch(() => { if (audio === clip && alive) status.textContent = "Tap the speaker to hear the sentence, or use Next question."; });
    }
    function render() {
      const family = families[index], session = sessionFor(family), question = session.questions[session.position];
      card.classList.add("doom-card--dense");
      card.classList.toggle("doom-card--tight", family.id === "doom-extra-learning-family");
      const completedQuestion = { ...question, sentence: question.variants?.[String(session.selected)] || question.sentence };
      const helpRow = make("div", "doom-card-tools");
      const help = make("button", "icon-button doom-help", "?");
      help.type = "button"; help.setAttribute("aria-label", "Show meanings of this family"); help.setAttribute("aria-haspopup", "dialog");
      help.addEventListener("click", () => {
        stopAudio();
        const close = make("button", "icon-button", "×"); close.type = "button"; close.setAttribute("aria-label", "Close word meanings");
        close.addEventListener("click", () => meaningsDialog.close(), { signal });
        const header = popupHeader(close, "Word meanings", "doomMeaningsTitle");
        const body = make("div", "popup-body");
        meaningsDialog.setAttribute("aria-labelledby", "doomMeaningsTitle");
        meaningsDialog.replaceChildren(header, body);
        family.answers.forEach((word, wordIndex) => {
          const entry = make("section", "doom-word-meaning"), label = make("h4", "");
          setJapaneseText(label, word); entry.append(label, make("p", "", family.meanings[wordIndex])); body.append(entry);
        });
        if (question.usageNote) body.append(make("p", "doom-usage-note", question.usageNote));
        meaningsDialog.showModal();
      }, { signal }); helpRow.append(help);
      const progress = make("p", "doom-question-progress", `${session.position + 1} / ${session.questions.length}`);
      const row = make("div", "doom-sentence-row"), sentence = make("p", "doom-sentence");
      sentence.lang = "ja"; sentence.setAttribute("aria-live", "polite");
      setJapaneseText(sentence, session.complete ? completedQuestion.sentence : question.question); row.append(sentence);
      const sentenceAudio = make("div", "doom-sentence-audio");
      if (session.complete) sentenceAudio.append(createExampleSpeechButton(completedQuestion.sentence, "Completed Japanese sentence", () => playSentence(completedQuestion)));
      row.append(sentenceAudio);
      const translation = make("p", "doom-translation", question.english); translation.lang = "en";
      const choices = make("div", "doom-choices");
      family.answers.forEach((word, answerIndex) => {
        const button = make("button", "answer-button doom-choice"); button.type = "button"; button.lang = "ja";
        setJapaneseText(button, word); button.disabled = session.complete;
        button.classList.toggle("doom-correct", session.complete && answerIndex === session.selected);
        button.addEventListener("click", () => {
          if (session.complete) return;
          if ((question.acceptedAnswers || [question.correct]).includes(answerIndex)) {
            session.complete = true; session.selected = answerIndex; playSound("correct"); status.textContent = ""; render();
            playSentence({ ...question, sentence: question.variants?.[String(answerIndex)] || question.sentence });
          } else {
            playSound("wrong"); status.textContent = "Try again.";
            const old = flashes.get(button); if (old) { clearTimeout(old); timers.delete(old); }
            button.classList.remove("doom-wrong"); void button.offsetWidth; button.classList.add("doom-wrong");
            const timer = setTimeout(() => { timers.delete(timer); button.classList.remove("doom-wrong"); }, 700);
            timers.add(timer); flashes.set(button, timer);
          }
        }, { signal }); choices.append(button);
      });
      const action = make("div", "doom-action");
      card.replaceChildren(helpRow, row, translation, choices, progress, action);
      if (session.complete) {
        const final = session.position === session.questions.length - 1;
        const proceed = make("button", "answer-button doom-proceed", final ? "もう一度 →" : "Next question →"); proceed.type = "button";
        proceed.addEventListener("click", () => {
          if (final) { stopAudio(); sessions.delete(family.id); status.textContent = ""; render(); }
          else advance(session);
        }, { signal }); action.append(proceed);
      }
      counter.textContent = `${index + 1} / ${families.length}`;
      previous.disabled = index === 0; next.disabled = index === families.length - 1;
    }
    function move(delta) { if (!families.length || index + delta < 0 || index + delta >= families.length) return; stopAudio(); index += delta; status.textContent = ""; render(); }
    previous.addEventListener("click", () => move(-1), { signal }); next.addEventListener("click", () => move(1), { signal });
    all.addEventListener("click", () => {
      stopAudio();
      const close = make("button", "icon-button", "×"); close.type = "button"; close.setAttribute("aria-label", "Close all families");
      close.addEventListener("click", () => { stopAudio(); dialog.close(); }, { signal });
      const header = popupHeader(close, "Word families", "doomFamiliesTitle");
      const body = make("div", "popup-body");
      dialog.setAttribute("aria-labelledby", "doomFamiliesTitle");
      dialog.replaceChildren(header, body);
      families.forEach((family, target) => {
        const heading = make("button", "answer-button doom-family-link"); heading.type = "button"; setJapaneseText(heading, family.answers.join(" / "));
        heading.addEventListener("click", () => { stopAudio(); index = target; status.textContent = ""; render(); dialog.close(); }, { signal }); body.append(heading);
      }); dialog.showModal();
    }, { signal });
    dialog.addEventListener("cancel", stopAudio, { signal });
    fetch(file, { signal }).then(response => { if (!response.ok) throw Error("Could not load the word groups."); return response.json(); }).then(data => {
      if (!alive) return;
      const grouped = new Map();
      data.questions.forEach(question => { const id = question.familyId || question.id; if (!grouped.has(id)) grouped.set(id, { id, answers: question.answers, meanings: question.meanings || [], questions: [] }); grouped.get(id).questions.push(question); });
      families = [...grouped.values()]; if (!families.length) throw Error("No word groups available.");
      index = Math.max(0, families.findIndex(family => family.id === questionId || family.questions.some(question => question.id === questionId)));
      if (questionId) { const session = sessionFor(families[index]); const target = session.questions.findIndex(q => q.id === questionId); if (target >= 0) session.position = target; }
      all.disabled = false; status.textContent = ""; render();
    }).catch(error => { if (alive && error.name !== "AbortError") status.textContent = error.message; });
    return () => {
      alive = false; stopAudio(); controller.abort(); timers.forEach(clearTimeout);
      if (dialog.open) dialog.close();
      if (meaningsDialog.open) meaningsDialog.close();
      toolbar.replaceChildren(); toolbar.classList.add("hidden");
      navigation.replaceChildren(); navigation.classList.remove("doom-navigation"); navigation.classList.add("hidden");
      navigation.setAttribute("aria-label", "Browse vocabulary cards");
      screen.classList.remove("study-cards-screen");
      container.classList.remove("families-of-doom", "furigana-hidden"); container.replaceChildren();
    };
  }
  window.FamiliesOfDoom = { mount };
})();
