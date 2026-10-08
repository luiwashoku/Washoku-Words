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
      if (lesson.sentenceCards || lesson.readingCards) allDialog?.classList.toggle("furigana-hidden", !furiganaVisible);
      furigana.classList.toggle("furigana-off", !furiganaVisible);
      furigana.setAttribute("aria-pressed", String(!furiganaVisible));
      furigana.setAttribute("aria-label", furiganaVisible ? "Hide furigana" : "Show furigana");
      furigana.title = furiganaVisible ? "ふりがなを隠す" : "ふりがなを表示する";
    }, { signal });
    toolbar.appendChild(furigana);
    {
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
      close.className = "icon-button";
      close.textContent = "×";
      close.setAttribute("aria-label", "Close card list");
      const header = document.createElement("div");
      header.className = "grammarIndexHeader popup-header";
      const title = document.createElement("h2");
      title.id = "vocabularyCardListTitle";
      title.textContent = lesson.gameMode === "vocabulary-cards" ? lesson.title : "単語カード";
      dialog.setAttribute("aria-labelledby", title.id);
      header.append(title, close);
      close.addEventListener("click", () => dialog.close(), { signal });
      all.addEventListener("click", () => {
        const list = document.createElement("div");
        list.className = "popup-body";
        const search = document.createElement("input");
        search.type = "search";
        search.className = "card-menu-search";
        search.placeholder = "Search cards…";
        search.setAttribute("aria-label", "Search cards by Japanese, reading, English, or number");
        const results = document.createElement("div");
        const empty = document.createElement("p");
        empty.textContent = "No matching cards.";
        empty.hidden = true;
        const searchable = [];
        function normalize(text) {
          return String(text || "").normalize("NFKC").toLowerCase()
            .replace(/[ァ-ヶ]/g, letter => String.fromCharCode(letter.charCodeAt(0) - 0x60))
            .replace(/[～〜]/g, "");
        }
        entries.forEach((word, target) => {
          const button = document.createElement("button");
          button.type = "button";
          const number = word.step || target + 1;
          if (lesson.conjugationCards) {
            const label = document.createElement("strong");
            label.className = "grammar-menu-point";
            label.textContent = word.menuLabel || word.group;
            button.append(label);
          }
          else if (lesson.grammarCards || lesson.gameMode !== "vocabulary-cards") {
            const point = document.createElement("strong");
            point.className = "grammar-menu-point";
            point.textContent = `${number}. ${word.kanji || word.japanese}`;
            button.append(point, document.createTextNode(` — ${word.english}`));
          }
          else if (lesson.sentenceCards || lesson.readingCards) setJapaneseText(button, `${word.step ? word.step + ". " : ""}${word.kanji || word.japanese}`);
          else button.textContent = `${number ? number + ". " : ""}${word.kanji || word.japanese} — ${word.english}`;
          button.addEventListener("click", () => { move(target - index); dialog.close(); }, { signal });
          results.appendChild(button);
          searchable.push({ button, text: normalize(`${number} ${word.menuLabel || ""} ${word.group || ""} ${word.kanji || ""} ${word.japanese} ${word.english}`) });
        });
        search.addEventListener("input", () => {
          const query = normalize(search.value.trim());
          let matches = 0;
          searchable.forEach(item => {
            const visible = item.text.includes(query);
            item.button.classList.toggle("hidden", !visible);
            if (visible) matches++;
          });
          empty.hidden = matches > 0;
        }, { signal });
        list.append(search, results, empty);
        dialog.replaceChildren(header, list);
        if (lesson.sentenceCards || lesson.readingCards) dialog.classList.toggle("furigana-hidden", !furiganaVisible);
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
    if (lesson.readingCards) card.classList.add("vocabulary-study-card--reading");
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
      if (lesson.audioDisabled) return;
      if (!alive || !entries.length) return;
      stopSpeech();
      status.textContent = "";
      wordPlayer.play(entries[index].japanese).catch(() => {
        if (alive && !signal.aborted) status.textContent = "Tap the word speaker to play audio.";
      });
    }

    function render() {
      const word = entries[index];
      if (lesson.conjugationCards) {
        const header = document.createElement("header");
        header.className = "reading-card-header";
        const titles = document.createElement("div");
        const title = document.createElement("h3");
        title.id = "studyCardWord";
        setJapaneseText(title, word.kanji);
        const meaning = document.createElement("p");
        meaning.className = "vocabulary-card-translation";
        meaning.textContent = word.english;
        const group = document.createElement("h2");
        group.className = "conjugation-card-group";
        setJapaneseText(group, word.group);
        titles.append(group, title, meaning);
        header.append(titles);
        const body = document.createElement("div");
        body.className = "conjugation-card-body";
        const rule = document.createElement("p");
        rule.className = "conjugation-card-rule";
        setJapaneseText(rule, word.rule);
        body.append(rule);
        if (word.connectionGroups) {
          word.connectionGroups.forEach(group => {
            const section = document.createElement("section");
            section.className = "connection-reference-group";
            const heading = document.createElement("h4");
            heading.textContent = group.title;
            const model = document.createElement("p");
            model.className = "connection-reference-model";
            setJapaneseText(model, group.model);
            section.append(heading, model);
            const list = document.createElement("div");
            list.className = "connection-reference-patterns";
            group.patterns.forEach(pattern => {
              const item = document.createElement("div");
              const japanese = document.createElement("p");
              japanese.className = "connection-reference-pattern";
              if (pattern.base !== undefined) {
                const base = document.createElement("span");
                setJapaneseText(base, pattern.base);
                const ending = document.createElement("span");
                ending.className = "conjugation-card-ending";
                ending.textContent = window.getJapaneseSpeechText(pattern.ending);
                const chunk = document.createElement("span");
                chunk.className = "connection-reference-chunk";
                setJapaneseText(chunk, pattern.chunk);
                japanese.append(base, ending, chunk);
              } else setJapaneseText(japanese, pattern.japanese);
              const english = document.createElement("p");
              english.className = "vocabulary-card-translation";
              english.textContent = pattern.english;
              item.append(japanese, english);
              list.append(item);
            });
            section.append(list);
            if (group.note) {
              const note = document.createElement("p");
              note.className = "conjugation-card-note";
              note.textContent = group.note;
              section.append(note);
            }
            body.append(section);
          });
        }
        (word.sections || []).forEach(section => {
          const heading = document.createElement("h4");
          heading.textContent = section.title;
          const table = document.createElement("table");
          table.className = "conjugation-card-table";
          if (section.endingGuide) table.classList.add("conjugation-card-table--ending-guide");
          table.setAttribute("aria-label", section.title);
          const head = table.createTHead().insertRow();
          ["Form", "Plain", "Polite"].forEach(label => {
            const th = document.createElement("th");
            th.scope = "col";
            th.textContent = label;
            head.append(th);
          });
          const rows = table.createTBody();
          section.rows.forEach(item => {
            const row = rows.insertRow();
            const label = document.createElement("th");
            label.scope = "row";
            label.textContent = item.label;
            row.append(label);
            [item.plain, item.polite || "—"].forEach(value => {
              const cell = row.insertCell();
              value.split(" / ").forEach((form, formIndex) => {
                if (formIndex) cell.append(document.createTextNode(" / "));
                if (item.highlightWholeForm && form !== "—") {
                  const ending = document.createElement("span");
                  ending.className = "conjugation-card-ending";
                  ending.textContent = window.getJapaneseSpeechText(form);
                  cell.append(ending);
                } else if (word.stem && form.startsWith(word.stem)) {
                  const stem = document.createElement("span");
                  setJapaneseText(stem, word.stem);
                  const ending = document.createElement("span");
                  ending.className = "conjugation-card-ending";
                  ending.textContent = window.getJapaneseSpeechText(form.slice(word.stem.length));
                  cell.append(stem, ending);
                } else {
                  const text = document.createElement("span");
                  setJapaneseText(text, form);
                  cell.append(text);
                }
              });
            });
            const detail = rows.insertRow().insertCell();
            detail.colSpan = 3;
            detail.className = "conjugation-card-detail";
            const formation = document.createElement("p");
            formation.className = "conjugation-card-formation";
            setJapaneseText(formation, item.formation);
            const example = document.createElement("p");
            example.lang = "ja";
            setJapaneseText(example, item.example.japanese);
            const translation = document.createElement("p");
            translation.className = "vocabulary-card-translation";
            translation.textContent = item.example.english;
            const exampleRow = document.createElement("div");
            exampleRow.className = "reading-card-chunk";
            exampleRow.append(example);
            if (lesson.sampleAudio) {
              const speaker = createExampleSpeechButton(item.example.japanese, "Read example sentence");
              exampleRow.append(speaker);
            }
            detail.append(formation, exampleRow, translation);
          });
          body.append(heading, table);
          if (section.note) {
            const note = document.createElement("p");
            note.className = "conjugation-card-note";
            note.textContent = section.note;
            body.append(note);
          }
        });
        if (word.commonVerbs) {
          const common = document.createElement("section");
          common.className = "conjugation-card-common-verbs";
          const heading = document.createElement("h4");
          heading.textContent = word.commonVerbsTitle || "Common Group 2 verbs";
          const list = document.createElement("p");
          list.lang = "ja";
          setJapaneseText(list, word.commonVerbs.join(", "));
          common.append(heading, list);
          body.append(common);
        }
        card.replaceChildren(header, body);
        counter.textContent = `${index + 1} / ${entries.length}`;
        previous.disabled = index === 0;
        next.disabled = index === entries.length - 1;
        return;
      }
      if (lesson.readingCards) {
        const header = document.createElement("header");
        header.className = "reading-card-header";
        const titles = document.createElement("div");
        const title = document.createElement("h3");
        title.id = "studyCardWord";
        title.lang = "ja";
        setJapaneseText(title, `${word.step}. ${word.kanji}`);
        const english = document.createElement("p");
        english.lang = "en";
        english.className = "vocabulary-card-translation";
        english.textContent = word.english;
        titles.append(title, english);
        const speaker = createExampleSpeechButton(word.japanese, "Read card title", playWord);
        header.append(titles);
        if (speaker) header.append(speaker);
        const body = document.createElement("div");
        body.className = "reading-card-body";
        if (lesson.vocabularyColumns === 2) body.classList.add("reading-card-body--two-columns");
        body.setAttribute("aria-label", "Card content");
        function bilingual(parent, block) {
          const japanese = document.createElement("p");
          japanese.lang = "ja";
          setJapaneseText(japanese, block.japanese);
          const translation = document.createElement("p");
          translation.lang = "en";
          translation.className = "vocabulary-card-translation";
          translation.textContent = block.english;
          const row = document.createElement("div");
          row.className = "reading-card-chunk";
          const speaker = createExampleSpeechButton(block.speech || block.japanese, "Read Japanese passage");
          speaker.addEventListener("click", () => wordPlayer.stop(), { capture: true, signal });
          row.append(japanese, speaker);
          parent.append(row, translation);
          if (block.explanation) {
            const explanation = document.createElement("div");
            explanation.className = "reading-card-explanation";
            bilingual(explanation, block.explanation);
            parent.append(explanation);
          }
        }
        if (word.anatomy) {
          const diagram = document.createElement("div");
          diagram.className = "knife-anatomy-diagram";
          const image = document.createElement("img");
          image.src = word.anatomy.src;
          image.alt = "Western and Japanese kitchen knives with labelled parts";
          const [originX, originY, viewWidth, viewHeight] = word.anatomy.viewBox || [0, 0, 841.89, 1061.7];
          image.width = viewWidth;
          image.height = viewHeight;
          diagram.append(image);
          word.anatomy.hotspots.forEach(part => {
            const button = createExampleSpeechButton(part.speech, `Read ${part.label}`);
            button.className = "knife-anatomy-label";
            button.textContent = part.label;
            button.setAttribute("aria-pressed", "false");
            button.style.fontSize = `${part.width > 100 && part.height > 35 ? 4.5 : 2.7}cqw`;
            button.style.left = `${(part.x - originX) / viewWidth * 100}%`;
            button.style.top = `${(part.y - originY) / viewHeight * 100}%`;
            button.style.width = `${part.width / viewWidth * 100}%`;
            button.style.height = `${part.height / viewHeight * 100}%`;
            button.addEventListener("click", () => {
              wordPlayer.stop();
              diagram.querySelectorAll("button").forEach(other => {
                other.classList.toggle("is-selected", other === button);
                other.setAttribute("aria-pressed", String(other === button));
              });
            }, { capture: true, signal });
            diagram.append(button);
          });
          const viewport = document.createElement("div");
          viewport.className = "knife-anatomy-viewport";
          viewport.setAttribute("aria-label", "Knife diagram; swipe sideways to view all labels");
          viewport.append(diagram);
          body.append(viewport);
        }
        word.blocks.forEach(block => {
          if (block.numberRows) {
            const section = document.createElement("section");
            const heading = document.createElement("h4");
            heading.textContent = block.heading;
            const table = document.createElement("table");
            table.className = "number-reference-table";
            table.setAttribute("aria-label", block.heading);
            const head = table.createTHead().insertRow();
            ["Number", "Japanese", "Reading"].forEach(label => {
              const th = document.createElement("th");
              th.scope = "col";
              th.textContent = label;
              head.append(th);
            });
            const rows = table.createTBody();
            block.numberRows.forEach(item => {
              const row = rows.insertRow();
              if (item.irregular) row.className = "number-reference-irregular";
              row.insertCell().textContent = item.number;
              setJapaneseText(row.insertCell(), item.japanese);
              const cell = row.insertCell();
              const reading = document.createElement("span");
              reading.lang = "ja";
              reading.textContent = item.reading;
              const speaker = createExampleSpeechButton(item.speech, "Read number");
              speaker.addEventListener("click", () => wordPlayer.stop(), { capture: true, signal });
              cell.append(reading, speaker);
            });
            section.append(heading, table);
            if (block.note) {
              const note = document.createElement("p");
              note.className = "number-reference-note";
              note.textContent = block.note;
              section.append(note);
            }
            body.append(section);
          } else if (block.pairs) {
            const section = document.createElement("section");
            section.className = "food-reference-group";
            const heading = document.createElement("h4");
            setJapaneseText(heading, block.japanese);
            const english = document.createElement("p");
            english.className = "vocabulary-card-translation";
            english.textContent = block.english;
            const table = document.createElement("table");
            table.className = "food-reference-table";
            table.setAttribute("aria-label", block.english);
            const head = table.createTHead().insertRow();
            ["ことば / Vocabulary", "食べ物 / Food reference"].forEach(label => {
              const th = document.createElement("th");
              th.scope = "col";
              th.textContent = label;
              head.append(th);
            });
            const rows = table.createTBody();
            block.pairs.forEach(pair => {
              const row = rows.insertRow();
              [pair.vocabulary, pair.food].forEach(part => bilingual(row.insertCell(), part));
            });
            const titleRow = document.createElement("div");
            titleRow.className = "food-reference-subtitle";
            const speaker = createExampleSpeechButton(block.speech || block.japanese, "Read category subtitle");
            speaker.addEventListener("click", () => wordPlayer.stop(), { capture: true, signal });
            titleRow.append(heading, speaker);
            section.append(titleRow, english, table);
            body.append(section);
          } else if (block.items) {
            const list = document.createElement("ol");
            block.items.forEach(item => {
              const li = document.createElement("li");
              bilingual(li, item);
              list.append(li);
            });
            body.append(list);
          } else {
            const section = document.createElement("section");
            if (block.heading) section.className = "reading-card-subheading";
            bilingual(section, block);
            body.append(section);
          }
        });
        card.replaceChildren(header, body);
        counter.textContent = `${index + 1} / ${entries.length}`;
        previous.disabled = index === 0;
        next.disabled = index === entries.length - 1;
        return;
      }
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
