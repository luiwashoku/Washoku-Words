(() => {
  "use strict";

  function mount(container, { file, lesson, initialWord, toolbar, navigation, stopSpeech, createExampleSpeechButton, getRecordedJapaneseFile, setJapaneseText }) {
    const controller = new AbortController();
    const { signal } = controller;
    let alive = true;
    let entries = [];
    let index = 0;
    let gesture = null;
    let furiganaVisible = false;
    let allDialog = null;
    let storyAudio = null;
    let storyPlayAllButton = null;
    let storyQueue = [];
    let storyQueueIndex = 0;
    let storyPlaybackVersion = 0;

    function stopStoryPlayback() {
      storyPlaybackVersion++;
      if (storyAudio) {
        storyAudio.pause();
        storyAudio.removeAttribute("src");
        storyAudio.load();
        storyAudio = null;
      }
      storyQueue = [];
      if (storyPlayAllButton) {
        storyPlayAllButton.textContent = lesson.articleCards ? "▶ Read all" : "▶ Play all";
        storyPlayAllButton.setAttribute("aria-pressed", "false");
        storyPlayAllButton.setAttribute("aria-label", lesson.articleCards ? "Read entire article" : "Play entire conversation");
      }
      card.querySelectorAll(".story-message--playing").forEach(item => item.classList.remove("story-message--playing"));
    }

    function startStoryPlayback(messages) {
      stopStoryPlayback();
      stopSpeech();
      wordPlayer.stop();
      const files = messages.map(message => message.audioPending ? null : getRecordedJapaneseFile(message.speech || message.japanese));
      if (!files.length || files.some(file => !file)) return;
      storyQueue = files;
      const version = storyPlaybackVersion;
      const audio = new window.Audio();
      storyAudio = audio;
      audio.playbackRate = 1;
      storyPlayAllButton.textContent = "■ Stop";
      storyPlayAllButton.setAttribute("aria-pressed", "true");
      storyPlayAllButton.setAttribute("aria-label", lesson.articleCards ? "Stop reading" : "Stop conversation playback");
      status.textContent = "";
      const fail = () => {
        if (version !== storyPlaybackVersion || !alive) return;
        stopStoryPlayback();
        status.textContent = "Could not play the conversation. Tap Play all to try again.";
      };
      const playNext = () => {
        if (version !== storyPlaybackVersion || !alive) return;
        if (storyQueueIndex >= storyQueue.length) {
          stopStoryPlayback();
          return;
        }
        card.querySelectorAll(".story-message, .article-chunk").forEach((item, i) => item.classList.toggle("story-message--playing", i === storyQueueIndex));
        audio.src = storyQueue[storyQueueIndex];
        // Reuse the element unlocked by the initial tap for subsequent mobile playback.
        audio.play().catch(fail);
      };
      storyQueueIndex = 0;
      audio.addEventListener("ended", () => {
        if (version !== storyPlaybackVersion || !alive) return;
        storyQueueIndex++;
        playNext();
      }, { signal });
      audio.addEventListener("error", fail, { signal });
      playNext();
    }

    if (lesson.recordedAudioOnly) {
      const makeSpeechButton = createExampleSpeechButton;
      createExampleSpeechButton = (text, label, onPlay) => {
        const button = makeSpeechButton(text, label, onPlay);
        if (!getRecordedJapaneseFile(text)) {
          button.disabled = true;
          button.title = "Recording unavailable";
        }
        return button;
      };
    }
    const screen = container.closest("#wordExplosionScreen");
    screen.classList.add("study-cards-screen");
    if (lesson.storyCards) screen.classList.add("stories-screen");
    if (lesson.articleCards) screen.classList.add("article-screen");
    document.documentElement.classList.add("vocabulary-cards-open");
    container.replaceChildren();
    container.classList.add("vocabulary-cards");
    container.classList.add("furigana-hidden");
    const wordPlayer = window.MoneyCatGame.createVocabularyPlayer(
      getRecordedJapaneseFile, src => new window.Audio(src), window.fetch.bind(window), signal);
    if (!lesson.audioDisabled && !lesson.titleAudioDisabled) wordPlayer.unlock();

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
      title.textContent = lesson.gameMode === "vocabulary-cards" ? lesson.title : "単語";
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
        const topicHeadings = [];
        let currentTopic = null;
        function normalize(text) {
          return String(text || "").normalize("NFKC").toLowerCase()
            .replace(/[ァ-ヶ]/g, letter => String.fromCharCode(letter.charCodeAt(0) - 0x60))
            .replace(/[～〜]/g, "");
        }
        entries.forEach((word, target) => {
          if (word.topicId && word.topicId !== currentTopic) {
            currentTopic = word.topicId;
            const heading = document.createElement("h3");
            heading.className = "card-menu-topic";
            heading.textContent = `${entries.findIndex(entry => entry.topicId === word.topicId) + 1}-${entries.findLastIndex(entry => entry.topicId === word.topicId) + 1} ${word.topicJapanese} · ${word.topicEnglish}`;
            results.append(heading);
            topicHeadings.push({ heading, topic: word.topicId });
          }
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
          else if (lesson.sentenceCards || lesson.readingCards) {
            const label = lesson.topicCards ? document.createElement("strong") : button;
            setJapaneseText(label, `${word.step ? word.step + ". " : ""}${word.kanji || word.japanese}`);
            if (lesson.topicCards) button.append(label, document.createTextNode(` — ${word.english}`));
          }
          else button.textContent = `${number ? number + ". " : ""}${word.kanji || word.japanese} — ${word.english}`;
          button.addEventListener("click", () => { move(target - index); dialog.close(); }, { signal });
          results.appendChild(button);
          searchable.push({ button, topic: word.topicId, text: normalize(`${number} ${word.menuLabel || ""} ${word.group || ""} ${word.kanji || ""} ${word.japanese} ${word.english} ${word.searchText || ""}`) });
        });
        search.addEventListener("input", () => {
          const query = normalize(search.value.trim());
          let matches = 0;
          searchable.forEach(item => {
            const visible = item.text.includes(query);
            item.button.classList.toggle("hidden", !visible);
            if (visible) matches++;
          });
          topicHeadings.forEach(item => {
            item.heading.hidden = !searchable.some(result => result.topic === item.topic && !result.button.classList.contains("hidden"));
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
    window.WashokuOffline?.addControls(toolbar, { ...lesson, title: lesson.gameMode === "vocabulary-cards" ? lesson.title : "単語" });

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
    if (lesson.storyCards) card.classList.add("vocabulary-study-card--stories");
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
    const topicPicker = document.createElement("label");
    topicPicker.className = "vocabulary-topic-picker";
    const topicLabel = document.createElement("span");
    topicLabel.textContent = "Topic / トピック";
    const topicSelect = document.createElement("select");
    topicSelect.id = "vocabularyCardTopic";
    topicSelect.setAttribute("aria-label", "Choose vocabulary topic");
    topicPicker.append(topicLabel, topicSelect);
    if (lesson.topicCards) container.append(topicPicker);
    container.append(status, retry, card);
    topicSelect.addEventListener("change", () => {
      const target = entries.findIndex(entry => entry.topicId === topicSelect.value);
      if (target >= 0) move(target - index);
    }, { signal });

    function playWord() {
      if (lesson.audioDisabled || lesson.titleAudioDisabled) return;
      if (!alive || !entries.length) return;
      if (entries[index].example?.audioPending) return;
      stopSpeech();
      status.textContent = "";
      const speechKey = window.WordExplosionGame.recordingKey(entries[index], getRecordedJapaneseFile);
      wordPlayer.play(speechKey).catch(() => {
        if (alive && !signal.aborted) status.textContent = "Tap the word speaker to play audio.";
      });
    }

    function render() {
      const word = entries[index];
      if (lesson.topicCards) topicSelect.value = word.topicId;
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
      if (lesson.storyCards || lesson.articleCards) {
        const header = document.createElement("header");
        header.className = "reading-card-header";
        const titles = document.createElement("div");
        function appendIngredientAmount(node, content, english = false) {
          const match = english
            ? content.match(/^(.+?:)\s+((?:[0-9]|one\b|two\b|three\b|four\b|half\b).*)$/i)
            : content.match(/^(.+?)[ \t　]+((?:[0-9０-９]+[.0-9０-９]*\s*(?:g|kg|KG|cc|ml|mL|匹|個|枚|本|束|株|カップ)|[0-9０-９]+[／/][0-9０-９]+本|大さじ|小さじ|各|適量|少々).*)$/);
          if (!match) { node.append(document.createTextNode(content)); return; }
          node.append(document.createTextNode(match[1].trimEnd() + " "));
          const amount = document.createElement("strong");
          amount.className = "article-ingredient-amount";
          const quantity = english ? match[2].match(/^([^;]+)(;.*)$/)
            : match[2].match(/^([0-9０-９.]+\s*(?:g|kg|KG|cc|ml|mL|匹|個|枚|本|束|株|カップ))(.*)$/);
          amount.textContent = quantity ? quantity[1] : match[2];
          node.append(amount);
          if (quantity?.[2]) node.append(document.createTextNode(quantity[2]));
        }
        // PDF passages keep their reading order explicitly (columns, tables and recipes).
        function appendArticleBlocks(root, blocks, english = false) {
          blocks.forEach(block => {
            if (block.type === "table") {
              const wrap = document.createElement("div");
              wrap.className = "article-table-wrap";
              wrap.tabIndex = 0;
              wrap.setAttribute("role", "region");
              wrap.setAttribute("aria-label", block.label || "Miso comparison");
              const table = document.createElement("table");
              table.className = "article-table";
              if (block.headers) {
                const head = table.createTHead().insertRow();
                block.headers.forEach(value => {
                  const cell = document.createElement("th"); cell.scope = "col";
                  cell.textContent = value; head.append(cell);
                });
              }
              const body = table.createTBody();
              block.rows.forEach(row => {
                const tr = body.insertRow();
                row.forEach((value, i) => {
                  const cell = document.createElement(i ? "td" : "th");
                  if (!i) cell.scope = "row";
                  cell.textContent = value; tr.append(cell);
                });
              });
              wrap.append(table); root.append(wrap);
            } else if (block.type === "list") {
              const list = document.createElement("ul"); list.className = "article-microbe-list";
              block.items.forEach(value => {
                const item = document.createElement("li");
                appendIngredientAmount(item, value.replace(/^[○◯•]\s*/u, ""), english);
                list.append(item);
              }); root.append(list);
            } else {
              const node = document.createElement(block.type === "heading" ? "h5" : "p");
              if (block.type === "step") node.className = "article-step";
              appendArticleLine(node, block.type === "flow" ? block.text : block.text.replace(/\n/g, english ? " " : "")); root.append(node);
            }
          });
        }
        function appendArticleLine(node, line) {
          if (/^[🔲□]/u.test(line)) {
            node.append(document.createTextNode(line.replace(/^[🔲□]\s*/u, "")));
            return;
          }
          const markers = { "🟡": "yellow", "⚫": "black", "⚪": "white", "🟤": "brown", "🔴": "red" };
          const marker = Object.keys(markers).find(symbol => line.startsWith(symbol));
          if (marker) {
            const dot = document.createElement("span");
            dot.className = `article-color-dot article-color-dot--${markers[marker]}`;
            dot.setAttribute("role", "img");
            dot.setAttribute("aria-label", `${markers[marker]} circle`);
            node.append(dot, document.createTextNode(line.slice(marker.length).trimStart()));
          } else node.append(document.createTextNode(line));
        }
        function addArticleFurigana(root) {
          const readings = word.furigana || {};
          const forms = Object.keys(readings).sort((a, b) => b.length - a.length);
          if (!forms.length) return;
          // Match literal article text, without treating existing parentheses as readings.
          const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
          const nodes = [];
          while (walker.nextNode()) nodes.push(walker.currentNode);
          nodes.forEach(node => {
            const value = node.textContent;
            const fragment = document.createDocumentFragment();
            let position = 0;
            let plain = "";
            while (position < value.length) {
              const form = forms.find(candidate => value.startsWith(candidate, position));
              if (!form) { plain += value[position++]; continue; }
              if (plain) { fragment.append(document.createTextNode(plain)); plain = ""; }
              fragment.append(document.createTextNode(form));
              const following = value.slice(position + form.length);
              if (following.startsWith(`（${readings[form]}）`) || following.startsWith(`(${readings[form]})`)) {
                position += form.length;
                continue;
              }
              const reading = document.createElement("span");
              reading.className = "furiganaReading";
              reading.textContent = `(${readings[form]})`;
              fragment.append(reading);
              position += form.length;
            }
            if (plain) fragment.append(document.createTextNode(plain));
            node.replaceWith(fragment);
          });
        }
        const title = document.createElement("h3");
        title.id = "studyCardWord";
        if (lesson.articleCards) {
          const fullTitle = (word.displayTitle || word.kanji || word.japanese).trim();
          const split = fullTitle.indexOf("　　");
          if (split >= 0) {
            title.append(document.createTextNode(fullTitle.slice(0, split)));
            const detail = document.createElement("span");
            detail.className = "article-title-detail";
            detail.textContent = fullTitle.slice(split).trimStart();
            title.append(detail);
          } else title.textContent = fullTitle;
        }
        else setJapaneseText(title, `${index + 1}. ${word.kanji || word.japanese}`);
        if (lesson.articleCards) addArticleFurigana(title);
        const subtitle = document.createElement("p");
        subtitle.className = "vocabulary-card-translation";
        subtitle.textContent = word.english;
        titles.append(title, subtitle); header.append(titles);
        storyPlayAllButton = document.createElement("button");
        storyPlayAllButton.type = "button";
        storyPlayAllButton.className = "story-play-all";
        storyPlayAllButton.textContent = lesson.articleCards ? "▶ Read all" : "▶ Play all";
        storyPlayAllButton.setAttribute("aria-label", lesson.articleCards ? "Read entire article" : "Play entire conversation");
        storyPlayAllButton.setAttribute("aria-pressed", "false");
        storyPlayAllButton.disabled = !word.messages?.length || word.messages.some(message => message.audioPending || !getRecordedJapaneseFile(message.speech || message.japanese));
        if (storyPlayAllButton.disabled) storyPlayAllButton.title = lesson.articleCards ? "Article audio coming later" : "Conversation audio coming later";
        storyPlayAllButton.addEventListener("click", () => {
          if (storyAudio) stopStoryPlayback();
          else startStoryPlayback(word.messages);
        }, { signal });
        header.append(storyPlayAllButton);
        const conversation = document.createElement("ol");
        conversation.className = lesson.articleCards ? "article-chunks" : "story-messages";
        conversation.setAttribute("aria-label", lesson.articleCards ? "Reading passages" : "SMS conversation");
        (word.messages || []).forEach((message, messageIndex) => {
          const item = document.createElement("li");
          item.className = lesson.articleCards ? "article-chunk" : `story-message story-message--${message.side === "right" ? "right" : "left"}`;
          const speaker = document.createElement("span");
          speaker.className = "story-speaker";
          setJapaneseText(speaker, message.speaker || "");
          const bubble = document.createElement("div");
          bubble.className = lesson.articleCards ? "article-chunk-content" : "story-bubble";
          const text = document.createElement(lesson.articleCards ? "div" : "p"); text.lang = "ja";
          if (lesson.articleCards) {
            text.className = "article-passage-text";
            // Source wraps are retained in data/audio keys; join them only for reading display.
            if (message.blocks) appendArticleBlocks(text, message.blocks);
            else {
              const isStructure = line => /^\d+\.|^[•🔲□《〈◯○＊]|^\d+、|^\(\d+\)|^第\d+期|^体内酵素|^【|^[①-⑳◎]|^\d+℃|^\d+時間|^保温温度|^冷蔵保存|^冷凍保存|^基本の配合|^ご飯1|^(?:アミラーゼ|プロテアーゼ|リパーゼ)[（(]|^→|^[　 \t]*(?:カビ|酵母|細菌)…|^[　 \t]*[🟡⚫⚪🟤🔴⭐]|^[　 \t]*日本酒＝|^[　 \t]*麹菌＋|^[　 \t]*(日本|中国)→/u.test(line);
              const lines = message.japanese.split("\n").flatMap(line => line.split(/(?=⚪︎)/u)).map(line => line.trimStart()).filter(line => line.trim()).reduce((result, line) => {
                const previous = result[result.length - 1];
                if (previous && line.trim() && !isStructure(previous) && !isStructure(line) &&
                    !/[。！？?!]\s*$/.test(previous)) {
                  result[result.length - 1] += line;
                } else result.push(line);
                return result;
              }, []);
              let list = null;
              let paragraph = null;
              lines.forEach((line, lineIndex) => {
                if (/^[　 \t]*(カビ|酵母|細菌)…|^[⚪]︎|^•|^\d+\./.test(line)) {
                  paragraph = null;
                  if (!list) {
                    list = document.createElement("ul");
                    list.className = "article-microbe-list";
                    text.append(list);
                  }
                  const entry = document.createElement("li");
                  const content = line.trimStart().replace(/^⚪︎|^•/, "");
                  const split = content.indexOf("…");
                  const label = document.createElement("strong");
                  if (split >= 0) {
                    label.textContent = content.slice(0, split);
                    entry.append(label, document.createTextNode(content.slice(split)));
                  } else appendIngredientAmount(entry, content);
                  list.append(entry);
                  if (lineIndex < lines.length - 1) list.append(document.createTextNode("\n"));
                } else {
                  list = null;
                  const section = /^\d+、|^【/.test(line);
                  const subsection = /^\(\d+\)|^第\d+期|^体内酵素|^→|^⭐|^[①②]甘酒|^基本の配合/.test(line) || /^[🔲□《〈]/u.test(line) || word.questionHeadingLines?.includes(line);
                  if (section || subsection) {
                    paragraph = null;
                    const heading = document.createElement(section ? "h4" : "h5");
                    heading.textContent = line;
                    text.append(heading);
                  } else {
                    if (/^[◯○＊]|^[①-⑳◎]|^\d+℃|^\d+時間|^保温温度|^冷蔵保存|^冷凍保存|^ご飯1|^(?:アミラーゼ|プロテアーゼ|リパーゼ)[（(]/.test(line)) paragraph = null;
                    if (!paragraph) {
                      paragraph = document.createElement("p");
                      text.append(paragraph);
                    }
                    if (/^[🟡⚫⚪🟤🔴]/u.test(line)) {
                      paragraph.classList.add("article-species");
                    }
                    if (/^(日本酒＝|麹菌＋|(日本|中国)→)/.test(line)) paragraph.classList.add("article-flow");
                    if (/^[①-⑳◎]/.test(line)) paragraph.classList.add("article-step");
                    appendArticleLine(paragraph, line);
                  }
                  if (lineIndex < lines.length - 1) {
                    (paragraph || text).append(document.createTextNode("\n"));
                  }
                }
              });
            }
            addArticleFurigana(text);
          } else setJapaneseText(text, message.japanese);
          const audio = createExampleSpeechButton(message.speech || message.japanese, `${lesson.articleCards ? "Read passage" : "Read message"} ${messageIndex + 1}`);
          audio.addEventListener("click", () => { stopStoryPlayback(); wordPlayer.stop(); }, { capture: true, signal });
          if (message.audioPending) {
            audio.disabled = true;
            audio.title = "Audio coming later";
            audio.setAttribute("aria-label", `${lesson.articleCards ? "Passage" : "Message"} ${messageIndex + 1}: audio coming later`);
          }
          if (lesson.articleCards && message.english) {
            const controls = document.createElement("div");
            controls.className = "article-chunk-controls";
            const translation = document.createElement("button");
            translation.type = "button";
            translation.className = "icon-button article-english-toggle";
            translation.textContent = "英";
            translation.setAttribute("aria-label", `Show English translation for passage ${messageIndex + 1}`);
            translation.setAttribute("aria-pressed", "false");
            text.id = `${message.id}-text`;
            translation.setAttribute("aria-controls", text.id);
            const japaneseNodes = [...text.childNodes];
            let englishVisible = false;
            translation.addEventListener("click", () => {
              englishVisible = !englishVisible;
              translation.setAttribute("aria-pressed", String(englishVisible));
              translation.setAttribute("aria-label", `${englishVisible ? "Show Japanese" : "Show English translation"} for passage ${messageIndex + 1}`);
              text.lang = englishVisible ? "en" : "ja";
              if (!englishVisible) text.replaceChildren(...japaneseNodes);
              else {
                text.replaceChildren();
                let list = null;
                if (message.englishBlocks) appendArticleBlocks(text, message.englishBlocks, true);
                else message.english.split("\n").forEach(line => {
                  if (line.startsWith("• ") || (word.numberedLists && /^\d+\./.test(line))) {
                    if (!list) {
                      list = document.createElement("ul");
                      list.className = "article-microbe-list";
                      text.append(list);
                    }
                    const li = document.createElement("li");
                    appendIngredientAmount(li, line.startsWith("• ") ? line.slice(2) : line, true);
                    list.append(li);
                  } else {
                    list = null;
                    const node = document.createElement(/^\d+\. /.test(line) ? "h4" : /^\(\d+\)|^Phase \d+:|^Enzymes in the body|^→|^⭐|^① The best|^② Ingredient/.test(line) || word.englishHeadingLines?.includes(line) ? "h5" : "p");
                    appendArticleLine(node, line);
                    text.append(node);
                  }
                });
              }
            }, { signal });
            controls.append(audio, translation);
            bubble.append(text, controls);
          } else bubble.append(text, audio);
          if (!lesson.articleCards) item.append(speaker);
          item.append(bubble);
          if (lesson.articleCards) (message.images || (message.image ? [message.image] : [])).forEach(sourceImage => {
            const figure = document.createElement("figure");
            figure.className = "article-diagram";
            const diagram = document.createElement("img");
            diagram.src = sourceImage.src;
            diagram.alt = sourceImage.alt || "Article diagram";
            diagram.width = sourceImage.width;
            diagram.height = sourceImage.height;
            diagram.loading = "lazy";
            const fullSize = document.createElement("a");
            fullSize.className = "article-diagram-link";
            fullSize.href = sourceImage.src; fullSize.target = "_blank"; fullSize.rel = "noopener";
            fullSize.setAttribute("aria-label", `Open full-size image: ${diagram.alt}`);
            fullSize.title = "Open full-size image";
            fullSize.append(diagram); figure.append(fullSize);
            if (sourceImage.caption) {
              const caption = document.createElement("figcaption");
              caption.textContent = sourceImage.caption; figure.append(caption);
            }
            item.append(figure);
          });
          conversation.append(item);
        });
        card.replaceChildren(header, conversation);
        counter.textContent = `${index + 1} / ${entries.length}`;
        previous.disabled = index === 0; next.disabled = index === entries.length - 1;
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
        const speaker = lesson.audioDisabled || lesson.titleAudioDisabled ? null : createExampleSpeechButton(word.japanese, "Read card title", playWord);
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
          row.append(japanese);
          if (!lesson.audioDisabled && !block.audioPending) {
            const speaker = createExampleSpeechButton(block.speech || block.japanese, "Read Japanese passage");
            speaker.addEventListener("click", () => wordPlayer.stop(), { capture: true, signal });
            row.append(speaker);
          }
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
            ["ことば / Vocabulary", block.exampleSentences ? "例文 / Example sentence" : "食べ物 / Food reference"].forEach(label => {
              const th = document.createElement("th");
              th.scope = "col";
              th.textContent = label;
              head.append(th);
            });
            const rows = table.createTBody();
            block.pairs.forEach(pair => {
              const row = rows.insertRow();
              [pair.vocabulary, pair.example || pair.food].forEach(part => bilingual(row.insertCell(), part));
            });
            const titleRow = document.createElement("div");
            titleRow.className = "food-reference-subtitle";
            titleRow.append(heading);
            if (!lesson.audioDisabled && !lesson.titleAudioDisabled) {
              const speaker = createExampleSpeechButton(block.speech || block.japanese, "Read category subtitle");
              speaker.addEventListener("click", () => wordPlayer.stop(), { capture: true, signal });
              titleRow.append(speaker);
            }
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
      const speechKey = window.WordExplosionGame.recordingKey(word, getRecordedJapaneseFile);
      const wordSpeaker = createExampleSpeechButton(speechKey, lesson.sentenceCards ? "Japanese sentence" : lesson.grammarCards ? "Grammar point" : "Japanese word", playWord);
      if (wordSpeaker && word.example?.audioPending) {
        wordSpeaker.disabled = true;
        wordSpeaker.title = "Recording pending";
      }
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
      if (sentenceSpeaker && word.example.audioPending) {
        sentenceSpeaker.disabled = true;
        sentenceSpeaker.title = "Recording pending";
      }
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
      stopStoryPlayback();
      stopSpeech();
      wordPlayer.stop();
      index = target;
      render();
      window.scrollTo({ top: 0, left: 0, behavior: "instant" });
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
        if (lesson.topicCards) {
          topicSelect.replaceChildren(...data.topics.map(topic => {
            const option = document.createElement("option");
            option.value = topic.id;
            option.textContent = `${entries.findIndex(entry => entry.topicId === topic.id) + 1}-${entries.findLastIndex(entry => entry.topicId === topic.id) + 1} ${topic.japanese} · ${topic.english} (${topic.wordCount})`;
            return option;
          }));
        }
        if (!lesson.ordered) for (let i = entries.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [entries[i], entries[j]] = [entries[j], entries[i]];
        }
        const target = initialWord ? entries.findIndex(entry =>
          initialWord.id ? entry.id === initialWord.id :
            entry.japanese === initialWord.japanese && entry.kanji === initialWord.kanji) : -1;
        index = target >= 0 ? target : 0;
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
      stopStoryPlayback();
      controller.abort();
      wordPlayer.stop();
      stopSpeech();
      container.classList.remove("vocabulary-cards", "furigana-hidden");
      screen.classList.remove("study-cards-screen", "stories-screen", "article-screen");
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
