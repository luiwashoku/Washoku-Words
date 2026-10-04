(() => {
  "use strict";

  function normalize(text) {
    return String(text).normalize("NFKC").toLowerCase()
      .replace(/[ァ-ヶ]/g, (character) => String.fromCharCode(character.charCodeAt(0) - 0x60));
  }

  function searchableText(value) {
    const strings = [];
    function collect(item) {
      if (typeof item === "string") strings.push(item);
      else if (Array.isArray(item)) item.forEach(collect);
      else if (item && typeof item === "object") {
        Object.entries(item).forEach(([key, child]) => {
          if (!["id", "image", "file", "type", "answerMode"].includes(key)) collect(child);
        });
      }
    }
    collect(value);
    const text = strings.join(" ");
    return normalize(`${text} ${text.replace(/[（(][ぁ-ゖァ-ヶー\s]+[）)]/g, "")}`);
  }

  function init({ catalog, loadQuestions, getQuestionTitle, openResult, setJapaneseText = (element, text) => { element.textContent = text; } }) {
    const trigger = document.getElementById("openSearch");
    const dialog = document.getElementById("searchDialog");
    const input = document.getElementById("searchInput");
    const status = document.getElementById("searchStatus");
    const results = document.getElementById("searchResults");
    const index = [];
    const loaded = new Set();
    let loading = null;
    let timer;
    let vocabulary;

    function render() {
      results.replaceChildren();
      const terms = normalize(input.value).trim().split(/\s+/).filter(Boolean);
      const pending = loading ? " Loading lessons…" : "";
      const missing = !loading && loaded.size < catalog.length ? " Some lessons could not load. Close and reopen search to retry." : "";
      if (!terms.length) {
        status.textContent = `Search question titles, grammar points, and game words.${pending}${missing}`;
        return;
      }
      const matches = index.filter((entry) => terms.every((term) => entry.text.includes(term)));
      status.textContent = `${matches.length} result${matches.length === 1 ? "" : "s"}.${matches.length > 100 ? " Showing the first 100; add keywords to narrow your search." : ""}${pending}${missing}`;
      for (const entry of matches.slice(0, 100)) {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "search-result";
        const heading = document.createElement("strong");
        setJapaneseText(heading, entry.title || `${entry.word.kanji || entry.word.japanese} · ${entry.word.english}`);
        const detail = document.createElement("span");
        detail.textContent = `${entry.lesson.title} · ${entry.word ? "Play this word →" : "Open question →"}`;
        button.appendChild(heading);
        if (entry.question && entry.question.question !== entry.title) {
          const preview = document.createElement("span");
          setJapaneseText(preview, entry.question.question);
          button.appendChild(preview);
        }
        button.appendChild(detail);
        button.addEventListener("click", async () => {
          dialog.close();
          await openResult(entry);
          const target = document.querySelector("#quizScreen:not(.hidden) #backToPages, #wordExplosionScreen:not(.hidden) #backFromExplosion");
          target?.focus({ preventScroll: true });
        });
        results.appendChild(button);
      }
    }

    async function buildIndex() {
      const pending = catalog.filter((lesson) => !loaded.has(lesson.id));
      let next = 0;
      await Promise.all(Array.from({ length: Math.min(6, pending.length) }, async () => {
        while (next < pending.length) {
          const lesson = pending[next++];
          try {
            let entries;
            if (lesson.gameMode) {
              if (!vocabulary) vocabulary = window.WordExplosionGame.loadVocabulary(lesson.file).catch((error) => {
                vocabulary = null;
                throw error;
              });
              const words = await vocabulary;
              entries = words.entries.map((word) => ({ lesson, word, text: searchableText([word.japanese, word.kanji, word.english]) }));
            } else {
              const questions = await loadQuestions(lesson);
              entries = questions.map((question) => {
                const title = getQuestionTitle(question, lesson);
                return { lesson, question, title, text: searchableText(title) };
              });
            }
            index.push(...entries);
            loaded.add(lesson.id);
          } catch (error) {
            console.warn(`Search could not load ${lesson.id}.`, error);
          }
        }
      }));
      index.sort((a, b) => catalog.indexOf(a.lesson) - catalog.indexOf(b.lesson));
    }

    trigger.disabled = false;
    trigger.addEventListener("click", () => {
      dialog.showModal();
      input.focus();
      if (!loading && loaded.size < catalog.length) {
        loading = buildIndex().finally(() => { loading = null; render(); });
      }
      render();
    });
    document.getElementById("closeSearch").addEventListener("click", () => dialog.close());
    dialog.addEventListener("click", (event) => {
      if (event.target !== dialog) return;
      const bounds = dialog.getBoundingClientRect();
      if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) dialog.close();
    });
    input.addEventListener("input", () => {
      clearTimeout(timer);
      timer = setTimeout(render, 120);
    });
  }

  window.WashokuSearch = { init, normalize, searchableText };
})();
