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
    const withoutReadings = text.replace(/[（(][ぁ-ゖァ-ヶー\s]+[）)]/g, "");
    const readings = text.replace(/[一-龯々〆ヵヶ]+[（(]([ぁ-ゖァ-ヶー\s]+)[）)]/g, "$1");
    return normalize(`${text} ${withoutReadings} ${readings}`);
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
    let resultLimit = 100;
    const vocabulary = new Map();
    const searchableLessons = catalog;

    function render() {
      results.replaceChildren();
      const terms = normalize(input.value).trim().split(/\s+/).filter(Boolean);
      const pending = loading ? " Loading lessons…" : "";
      const missing = !loading && loaded.size < searchableLessons.length ? " Some lessons could not load. Close and reopen search to retry." : "";
      if (!terms.length) {
        status.textContent = `Search all flash cards, examples, explanations, quizzes, and game words.${pending}${missing}`;
        return;
      }
      const matches = index.filter((entry) => terms.every((term) => entry.text.includes(term)));
      status.textContent = `${matches.length} result${matches.length === 1 ? "" : "s"}.${matches.length > resultLimit ? " Use “Show more results” to see more." : ""}${pending}${missing}`;
      for (const entry of matches.slice(0, resultLimit)) {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "search-result";
        const heading = document.createElement("strong");
        setJapaneseText(heading, entry.title || `${entry.word.kanji || entry.word.japanese} · ${entry.word.english}`);
        const detail = document.createElement("span");
        detail.textContent = `${entry.lesson.title} · ${entry.word ? (entry.lesson.gameMode === "vocabulary-cards" ? "Open card →" : "Play this word →") : "Open question →"}`;
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
      if (matches.length > resultLimit) {
        const more = document.createElement("button");
        more.type = "button";
        more.textContent = "Show more results";
        more.addEventListener("click", () => { resultLimit += 100; render(); });
        results.appendChild(more);
      }
    }

    async function buildIndex() {
      const pending = searchableLessons.filter((lesson) => !loaded.has(lesson.id));
      let next = 0;
      await Promise.all(Array.from({ length: Math.min(6, pending.length) }, async () => {
        while (next < pending.length) {
          const lesson = pending[next++];
          try {
            let entries;
            if (["vocabulary-cards", "word-explosion", "word-explosion-2"].includes(lesson.gameMode)) {
              if (!vocabulary.has(lesson.file)) {
                const request = lesson.gameMode === "vocabulary-cards"
                  ? fetch(lesson.file).then(response => {
                    if (!response.ok) throw new Error("Cards unavailable");
                    return response.json();
                  })
                  : window.WordExplosionGame.loadVocabulary(lesson.file);
                vocabulary.set(lesson.file, request.catch(error => {
                  vocabulary.delete(lesson.file);
                  throw error;
                }));
              }
              const words = await vocabulary.get(lesson.file);
              entries = words.entries.map((word) => ({ lesson, word, text: searchableText([lesson.title, lesson.page, word]) }));
            } else {
              const questions = await loadQuestions(lesson);
              entries = questions.map((question) => {
                const title = getQuestionTitle(question, lesson);
                return { lesson, question, title, text: searchableText([lesson.title, lesson.page, title, question]) };
              });
            }
            index.push(...entries);
            loaded.add(lesson.id);
          } catch (error) {
            console.warn(`Search could not load ${lesson.id}.`, error);
          }
        }
      }));
      index.sort((a, b) => Number(b.lesson.gameMode === "vocabulary-cards") - Number(a.lesson.gameMode === "vocabulary-cards") || catalog.indexOf(a.lesson) - catalog.indexOf(b.lesson));
    }

    trigger.disabled = false;
    trigger.addEventListener("click", () => {
      dialog.showModal();
      input.focus();
      if (!loading && loaded.size < searchableLessons.length) {
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
      resultLimit = 100;
      clearTimeout(timer);
      timer = setTimeout(render, 120);
    });
  }

  window.WashokuSearch = { init, normalize, searchableText };
})();
