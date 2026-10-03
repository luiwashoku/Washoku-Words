(() => {
  "use strict";
  const wordKey = word => `${word.japanese}|${word.kanji || ""}`;
  const meaningKey = word => word.english.trim().toLowerCase();
  const shuffle = (items, random = Math.random) => {
    const copy = [...items];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  };

  // A persistent media element follows the same native playback path as the decks.
  // Play real silent samples (not a muted element) in the launch gesture, then reuse
  // this element for recordings requested by the game's timers.
  const silentAudio = 'data:audio/wav;base64,UklGRmQGAABXQVZFZm10IBAAAAABAAEAQB8AAIA+AAACABAAZGF0YUAGAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA';
  function createVocabularyPlayer(getFile, createAudio, fetchFile, signal) {
    const audio = createAudio(silentAudio);
    audio.preload = "auto";
    let revision = 0;
    const preloaded = new Set();
    function stop() {
      revision++;
      audio.pause();
    }
    function unlock() {
      if (signal.aborted || audio.src !== silentAudio) return;
      const current = revision;
      try {
        Promise.resolve(audio.play()).then(() => {
          if (current === revision) audio.pause();
        }).catch(() => {});
      } catch (_) { /* The speaker can retry directly from a tap. */ }
    }
    function play(text) {
      stop();
      if (signal.aborted) return Promise.resolve();
      const file = getFile(text);
      if (!file) return Promise.reject(new Error("Missing vocabulary recording"));
      const current = revision;
      try {
        if (audio.getAttribute("src") !== file) audio.src = file;
        audio.currentTime = 0;
        // Keep play() synchronous: speaker taps must retain user activation.
        return Promise.resolve(audio.play()).catch(error => {
          if (current === revision && !signal.aborted) throw error;
        });
      } catch (error) { return Promise.reject(error); }
    }
    function preload(texts) {
      texts.forEach(text => {
        const file = getFile(text);
        if (!file || preloaded.has(file) || signal.aborted) return;
        preloaded.add(file);
        fetchFile(file, {signal}).then(response => {
          if (!response.ok) throw new Error("Recording could not load");
          return response.arrayBuffer();
        }).catch(() => preloaded.delete(file));
      });
    }
    signal.addEventListener("abort", stop, {once: true});
    return {play, stop, unlock, preload};
  }

  function createSession(entries, random = Math.random) {
    const state = { moneyTotal: 0, sectionQuestionIndex: 0, sectionWrongAnswers: [], sectionAnswers: [],
      recentVocabulary: [], wrongAnswerWeights: new Map(), section: [], answered: false };
    function nextSection() {
      const usedReadings = new Set();
      const recent = new Set(state.recentVocabulary.slice(-20));
      const last = state.recentVocabulary.at(-1);
      const ranked = entries.filter(word => wordKey(word) !== last || entries.length === 1).map(word => {
        const weight = (1 + Math.min(2, state.wrongAnswerWeights.get(wordKey(word)) || 0))
          * (recent.has(wordKey(word)) ? 0.12 : 1);
        return { word, rank: -Math.log(Math.max(Number.EPSILON, random())) / weight };
      }).sort((a, b) => a.rank - b.rank);
      state.section = [];
      for (const { word } of ranked) {
        if (usedReadings.has(word.japanese)) continue;
        state.section.push(word);
        usedReadings.add(word.japanese);
        if (state.section.length === 10) break;
      }
      state.sectionQuestionIndex = 0;
      state.sectionWrongAnswers = [];
      state.sectionAnswers = [];
      state.answered = false;
      return state.section;
    }
    function answer(selectedMeaning) {
      if (state.answered || state.sectionQuestionIndex >= state.section.length) return null;
      state.answered = true;
      const word = state.section[state.sectionQuestionIndex];
      const correct = selectedMeaning.trim().toLowerCase() === meaningKey(word);
      state.moneyTotal += correct ? 1 : -1;
      const key = wordKey(word);
      if (!correct) state.sectionWrongAnswers.push(word);
      state.sectionAnswers.push({ word, correct, selectedMeaning });
      const weight = state.wrongAnswerWeights.get(key) || 0;
      state.wrongAnswerWeights.set(key, correct ? Math.max(0, weight - 1) : Math.min(2, weight + 1));
      state.recentVocabulary.push(key);
      state.recentVocabulary = state.recentVocabulary.slice(-40);
      return correct;
    }
    function advance() {
      if (!state.answered) return false;
      state.sectionQuestionIndex++;
      state.answered = false;
      return state.sectionQuestionIndex < state.section.length;
    }
    return { state, nextSection, answer, advance };
  }

  function chooseAnswers(word, pool, count = 3, random = Math.random) {
    // Prefer entries of similar meaning length while retaining the original meanings.
    const candidates = shuffle(pool.filter(other => other.japanese !== word.japanese && meaningKey(other) !== meaningKey(word)), random)
      .sort((a, b) => Math.abs(a.english.length - word.english.length) - Math.abs(b.english.length - word.english.length));
    const seen = new Set([meaningKey(word)]);
    const options = [word];
    for (const other of candidates) {
      if (seen.has(meaningKey(other))) continue;
      seen.add(meaningKey(other));
      options.push(other);
      if (options.length === count) break;
    }
    return shuffle(options, random);
  }

  function mount(container, { file, stopSpeech, getRecordedJapaneseFile, speakerTemplate }) {
    const controller = new AbortController();
    const { signal } = controller;
    let alive = true, frame = 0, feedbackTimer = 0, session, entries, phase = "loading";
    let coins = [], elapsed = 0, lastTime = 0, catX = 0.5, targetX = 0.5, dragging = null;
    let dragX = 0;
    const touchSensitivity = 2;
    const createAudio = src => new window.Audio(src);
    const fetchFile = window.fetch.bind(window);
    // Keep feedback and speech on the same gesture-unlocked media element.
    // Switching between separate elements can interrupt automatic speech on iPhone.
    const vocabularyPlayer = createVocabularyPlayer(
      text => typeof text === "boolean"
        ? `audio/effects/money-cat-${text ? "correct" : "wrong"}.wav`
        : getRecordedJapaneseFile(text), createAudio, fetchFile, signal);
    function unlockAudio() {
      vocabularyPlayer.unlock();
    }
    unlockAudio();
    vocabularyPlayer.preload([true, false]);
    let speechRevision = 0;
    function stopAllSpeech() {
      speechRevision++;
      vocabularyPlayer.stop();
      stopSpeech();
    }
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    container.replaceChildren();
    container.classList.add("money-cat-game");
    const make = (tag, className, text) => {
      const node = document.createElement(tag);
      node.className = className;
      if (text) node.textContent = text;
      return node;
    };
    const header = make("div", "money-cat-header");
    const money = make("output", "money-cat-total", "¥ 0");
    money.setAttribute("aria-label", "Running money total");
    const replay = speakerTemplate.cloneNode(true);
    replay.removeAttribute("id");
    replay.className = "icon-button money-cat-replay";
    replay.querySelectorAll(".pauseIcon, .resumeIcon").forEach(icon => icon.remove());
    replay.disabled = true;
    replay.setAttribute("aria-label", "Replay the Japanese word");
    replay.title = "もう一度聞く";
    const progress = make("span", "money-cat-progress", "1 / 10");
    header.append(progress, replay, money);
    const status = make("p", "money-cat-status", "Loading Money Cat…");
    status.setAttribute("role", "status");
    const arena = make("div", "money-cat-arena");
    arena.tabIndex = 0;
    arena.setAttribute("aria-label", "Catch an English meaning. Move your mouse, or drag anywhere. Keyboard: A and D to move, space to replay.");
    const cat = make("div", "money-cat-player");
    cat.setAttribute("aria-hidden", "true");
    const review = make("section", "money-cat-review hidden");
    const collected = make("div", "money-cat-collected");
    collected.setAttribute("role", "list");
    collected.setAttribute("aria-label", "Japanese words answered this round");
    arena.append(header, cat, collected);
    container.append(status, arena, review);
    let coinArt;

    function speak() {
      if (!alive || phase !== "playing") return;
      stopAllSpeech();
      const current = speechRevision;
      const text = session.state.section[session.state.sectionQuestionIndex].japanese;
      vocabularyPlayer.play(text).catch(() => {
        if (!alive || phase !== "playing" || current !== speechRevision || document.hidden) return;
        status.textContent = "Tap the speaker to hear the word.";
      });
      status.textContent = "";
    }
    replay.addEventListener("click", () => { unlockAudio(); speak(); }, { signal });
    arena.addEventListener("pointerdown", unlockAudio, { signal });
    arena.addEventListener("pointerup", unlockAudio, { signal });
    arena.addEventListener("keydown", unlockAudio, { signal });
    const canMove = () => phase === "playing" || phase === "feedback";
    function setTarget(event) {
      const box = arena.getBoundingClientRect();
      targetX = Math.max(0, Math.min(1, (event.clientX - box.left) / box.width));
    }
    arena.addEventListener("pointerdown", event => {
      if (header.contains(event.target)) return;
      if (event.pointerType === "mouse" || !canMove() || dragging !== null) return;
      dragging = event.pointerId;
      dragX = event.clientX;
      targetX = catX;
      arena.setPointerCapture(event.pointerId);
      // Touch down alone does not move the cat; movement starts with dragging.
    }, { signal });
    arena.addEventListener("pointermove", event => {
      if (header.contains(event.target)) return;
      if (!canMove()) return;
      if (event.pointerType === "mouse") setTarget(event);
      else if (event.pointerId === dragging) {
        const width = arena.getBoundingClientRect().width;
        if (!width) return;
        const delta = event.clientX - dragX;
        dragX = event.clientX;
        const edge = Math.min(0.5, cat.offsetWidth / (2 * width));
        // Relative dragging gives twice the finger travel without jumping on tap.
        // Clamp to the cat's actual bounds so reversing at an edge responds at once.
        targetX = Math.max(edge, Math.min(1 - edge, targetX + delta * touchSensitivity / width));
      }
    }, { signal });
    const release = event => { if (event.pointerId === dragging) dragging = null; };
    arena.addEventListener("pointerup", release, { signal });
    arena.addEventListener("pointercancel", release, { signal });
    arena.addEventListener("lostpointercapture", release, { signal });
    arena.addEventListener("keydown", event => {
      if (header.contains(event.target)) return;
      if (!canMove()) return;
      if (["a", "d", " "].includes(event.key.toLowerCase())) {
        event.preventDefault();
        if (event.key === " ") speak();
        else targetX = Math.max(0, Math.min(1, targetX + (event.key.toLowerCase() === "a" ? -0.12 : 0.12)));
      }
    }, { signal });
    document.addEventListener("visibilitychange", () => {
      lastTime = 0;
      if (document.hidden) stopAllSpeech();
    }, { signal });

    function answerSound(correct) {
      if (alive) vocabularyPlayer.play(correct).catch(() => {});
    }
    function clearCoins() { coins.forEach(coin => coin.element.remove()); coins = []; }
    function spawn() {
      clearCoins();
      const word = session.state.section[session.state.sectionQuestionIndex];
      const options = chooseAnswers(word, entries);
      coins = options.map((choice, index) => {
        const element = make("div", "money-cat-answer", choice.english);
        element.setAttribute("aria-hidden", "true");
        arena.append(element);
        return { element, meaning: choice.english, lane: (index + 0.5) / options.length };
      });
      elapsed = 0;
    }
    function question() {
      phase = "playing";
      progress.textContent = `${session.state.sectionQuestionIndex + 1} / ${session.state.section.length}`;
      status.textContent = "";
      replay.disabled = false;
      spawn();
      speak();
      lastTime = 0;
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(tick);
    }
    function finish(meaning) {
      const correct = session.answer(meaning);
      if (correct === null) return;
      phase = "feedback";
      stopAllSpeech();
      replay.disabled = true;
      clearCoins();
      {
        const word = session.state.section[session.state.sectionQuestionIndex];
        const coin = make("div", "money-cat-collected-coin", word.kanji || word.japanese);
        coin.classList.toggle("money-cat-collected-wrong", !correct);
        coin.lang = "ja";
        coin.setAttribute("role", "listitem");
        coin.setAttribute("aria-label", `${word.kanji || word.japanese}: ${correct ? "correct" : "incorrect"}`);
        collected.append(coin);
      }
      money.textContent = `¥ ${session.state.moneyTotal}`;
      coinArt.style.fill = correct ? "var(--bronze)" : "var(--ember)";
      coinArt.style.setProperty("--money-cat-feedback", coinArt.style.fill);
      coinArt.classList.add("money-cat-coin-feedback");
      if (!reducedMotion.matches) money.classList.add("money-cat-change");
      answerSound(correct);
      status.textContent = correct ? "+ ¥1" : "− ¥1";
      if (!frame) frame = requestAnimationFrame(tick);
      feedbackTimer = window.setTimeout(() => {
        if (!alive) return;
        coinArt.style.removeProperty("fill");
        coinArt.style.removeProperty("--money-cat-feedback");
        coinArt.classList.remove("money-cat-coin-feedback");
        money.classList.remove("money-cat-change");
        if (session.advance()) question(); else showReview();
      }, 800);
    }
    function tick(time) {
      frame = 0;
      if (!alive || !canMove()) return;
      const dt = document.hidden || !lastTime ? 0 : Math.min(50, time - lastTime);
      lastTime = time;
      if (phase === "playing") elapsed += dt;
      const width = arena.clientWidth;
      const catWidth = cat.offsetWidth, catHeight = cat.offsetHeight;
      const minX = catWidth / 2, maxX = width - minX;
      const desired = Math.max(minX, Math.min(maxX, targetX * width));
      const current = Math.max(minX, Math.min(maxX, catX * width));
      const center = current + (desired - current) * (reducedMotion.matches ? 1 : 1 - Math.exp(-dt / 65));
      catX = center / width;
      cat.style.transform = `translate3d(${center - catWidth / 2}px,0,0)`;
      if (phase === "feedback") {
        frame = requestAnimationFrame(tick);
        return;
      }
      const catchY = cat.offsetTop + catHeight * 0.45 - 12;
      // Two seconds to listen, followed by a four-second fall.
      const travel = Math.max(0, (elapsed - 2000) / 4000);
      for (const coin of coins) {
        const size = coin.element.offsetWidth;
        const x = Math.max(0, Math.min(width - size, coin.lane * width - size / 2));
        const y = travel * (catchY + size) - size;
        coin.element.style.transform = `translate3d(${x}px,${y}px,0)`;
        if (y + size >= catchY && y < cat.offsetTop + catHeight - 12 && Math.abs(x + size / 2 - center) < size * 0.34 + catWidth * 0.28) {
          finish(coin.meaning);
          return;
        }
      }
      // Missing all coins costs nothing: replay the same unanswered question.
      if (travel > 1.3) { spawn(); speak(); }
      frame = requestAnimationFrame(tick);
    }
    function showReview() {
      phase = "review";
      cancelAnimationFrame(frame);
      frame = 0;
      arena.classList.add("hidden");
      review.classList.remove("hidden");
      status.textContent = "Section complete";
      review.replaceChildren();
      const wrong = session.state.sectionWrongAnswers;
      const heading = make("h3", "", wrong.length ? "間違えた言葉" : "10 / 10 ✓");
      heading.tabIndex = -1;
      review.append(heading);
      function reviewWord(answer) {
        const { word, correct, selectedMeaning } = answer;
        const item = make("div", "money-cat-review-word");
        const japanese = make("strong", "", word.kanji || word.japanese);
        japanese.lang = "ja";
        item.append(japanese);
        if (word.kanji) { const reading = make("span", "", `（${word.japanese}）`); reading.lang = "ja"; item.append(reading); }
        if (!correct) item.append(make("p", "money-cat-review-chosen", `Your answer: ${selectedMeaning}`));
        item.append(make("p", "money-cat-review-correct", correct ? word.english : `Correct: ${word.english}`));
        review.append(item);
      }
      session.state.sectionAnswers.filter(answer => !answer.correct).forEach(reviewWord);
      const correctAnswers = session.state.sectionAnswers.filter(answer => answer.correct);
      if (correctAnswers.length) {
        review.append(make("h3", "money-cat-correct-heading", "正解した言葉"));
        correctAnswers.forEach(reviewWord);
      }
      const next = make("button", "answer-button money-cat-next", "NEXT");
      next.type = "button";
      next.addEventListener("click", () => { startSection(); arena.focus({ preventScroll: true }); }, { signal });
      review.append(next);
      heading.focus({ preventScroll: true });
    }
    function startSection() {
      collected.replaceChildren();
      review.replaceChildren();
      review.classList.add("hidden");
      arena.classList.remove("hidden");
      session.nextSection();
      vocabularyPlayer.preload(session.state.section.map(word => word.japanese));
      question();
    }

    Promise.all([
      window.WordExplosionGame.loadVocabulary(file, signal),
      fetch("assets/cat-03.svg", { signal }).then(response => {
        if (!response.ok) throw new Error("The cat artwork could not load.");
        return response.text();
      })
    ]).then(([data, source]) => {
      if (!alive) return;
      entries = data.entries.filter(word => getRecordedJapaneseFile(word.japanese));
      if (entries.length < 10 || new Set(entries.map(word => word.japanese)).size < 10) throw new Error("Money Cat needs ten different words with existing recordings.");
      const svg = new DOMParser().parseFromString(source, "image/svg+xml").documentElement;
      if (svg.localName !== "svg") throw new Error("Invalid cat artwork.");
      svg.id = "moneyCatArt";
      // Crop the source's wide empty canvas; no character geometry is changed.
      svg.setAttribute("viewBox", "200 10 205 260");
      svg.querySelectorAll("style").forEach(style => { style.textContent = style.textContent.replace(/\.st\d+/g, match => `#moneyCatArt ${match}`); });
      // The source includes a full-width floor rectangle. Keep the floor fixed
      // in the arena while the original character paths move horizontally.
      svg.querySelector("rect.st5")?.remove();
      coinArt = svg.querySelector("rect.st3");
      if (!coinArt) throw new Error("The held coin is missing from the cat artwork.");
      coinArt.id = "moneyCatHeldCoin";
      cat.append(document.importNode(svg, true));
      coinArt = cat.querySelector("#moneyCatHeldCoin");
      session = createSession(entries);
      startSection();
    }).catch(error => {
      if (!alive || error.name === "AbortError") return;
      phase = "error";
      status.classList.add("money-cat-error");
      status.textContent = `${error.message} Return home and try again.`;
      arena.classList.add("hidden");
    });
    return () => {
      alive = false;
      controller.abort();
      cancelAnimationFrame(frame);
      clearTimeout(feedbackTimer);
      stopAllSpeech();
      container.classList.remove("money-cat-game");
      container.replaceChildren();
    };
  }
  window.MoneyCatGame = { mount, createSession, chooseAnswers, createVocabularyPlayer };
})();
