(() => {
  "use strict";

  const CATEGORY_CONFIG = [
    {
      id: "basics",
      title: "基本のことば",
      pageRange: "Pages 1–11",
      color: "var(--ember)",
      canvas: "var(--horizon)"
    },
    {
      id: "food-culture",
      title: "日本の食文化",
      pageRange: "Pages 12–27",
      color: "var(--horizon)",
      canvas: "var(--canvas)"
    },
    {
      id: "fermentation",
      title: "発酵と調味料",
      pageRange: "Pages 28–46",
      color: "var(--canvas)",
      canvas: "var(--pulse)"
    },
    {
      id: "techniques",
      title: "技術と料理",
      pageRange: "Pages 47–61",
      color: "var(--pulse)",
      canvas: "var(--horizon)"
    },
    {
      id: "conversation",
      title: "日本語で話す",
      pageRange: "Pages 62–67",
      color: "var(--bronze)",
      canvas: "var(--canvas)"
    },
    {
      id: "evaluation",
      title: "料理を評価する",
      pageRange: "Pages 68–71",
      color: "var(--ember)",
      canvas: "var(--canvas)"
    },
    {
      id: "animal-ingredients",
      title: "動物性食材",
      pageRange: "Pages 72–84",
      color: "var(--horizon)",
      canvas: "var(--pulse)"
    }
  ];

  const STORAGE_KEYS = {
    stats: "washoku-foundation-stats",
    progress: "washoku-foundation-progress"
  };

  const state = {
    catalog: [],
    selectedCategory: null,
    selectedLesson: null,
    questions: [],
    currentQuestionIndex: 0,
    answerLocked: false,
    furiganaVisible: true,
    stats: {
      answered: 0,
      correct: 0
    },
    progress: {}
  };

  const elements = {};
  let activeJapaneseUtterance = null;

  document.addEventListener(
    "DOMContentLoaded",
    initialise
  );

  async function initialise() {
    cacheElements();

    restoreSavedData();
    bindEvents();
    renderStats();

    state.catalog = await loadCatalog();
    renderCategories();

    registerServiceWorker();
  }

  function cacheElements() {
    elements.topbar =
      document.querySelector(".topbar");

    elements.homeScreen =
      document.getElementById("homeScreen");

    elements.pageScreen =
      document.getElementById("pageScreen");

    elements.quizScreen =
      document.getElementById("quizScreen");

    elements.categoryGrid =
      document.getElementById("categoryGrid");

    elements.lessonList =
      document.getElementById("lessonList");

    elements.pageTitle =
      document.getElementById("pageTitle");

    elements.pageSubtitle =
      document.getElementById("pageSubtitle");

    elements.chapterTag =
      document.getElementById("chapterTag");

    elements.questionText =
      document.getElementById("questionText");

    elements.speakQuestion =
      document.getElementById("speakQuestion");

    elements.furiganaToggle =
      document.getElementById("furiganaToggle");

    elements.questionVisual =
      document.getElementById("questionVisual");

    elements.questionImage =
      document.getElementById("questionImage");

    elements.answerContainer =
      document.getElementById(
        "answerContainer"
      );

    elements.questionProgress =
      document.getElementById(
        "questionProgress"
      );

    elements.resultCard =
      document.getElementById("resultCard");

    elements.resultTitle =
      document.getElementById("resultTitle");

    elements.grammarDetails =
      document.getElementById("grammarDetails");

    elements.grammarPoint =
      document.getElementById("grammarPoint");

    elements.grammarFormation =
      document.getElementById("grammarFormation");

    elements.grammarCasual =
      document.getElementById("grammarCasual");

    elements.jpExplanation =
      document.getElementById(
        "jpExplanation"
      );

    elements.enExplanation =
      document.getElementById(
        "enExplanation"
      );

    elements.explanations =
      Array.from(
        document.querySelectorAll(
          "#resultCard .explanation"
        )
      );

    elements.answeredCount =
      document.getElementById(
        "answeredCount"
      );

    elements.correctCount =
      document.getElementById(
        "correctCount"
      );

    elements.accuracy =
      document.getElementById("accuracy");

    elements.backHome =
      document.getElementById("backHome");

    elements.backToPages =
      document.getElementById(
        "backToPages"
      );

    elements.lessonIntroductionButton =
      document.getElementById(
        "lessonIntroductionButton"
      );

    elements.lessonIntroductionDialog =
      document.getElementById(
        "lessonIntroductionDialog"
      );

    elements.introductionTitle =
      document.getElementById(
        "introductionTitle"
      );

    elements.introductionJapanese =
      document.getElementById(
        "introductionJapanese"
      );

    elements.introductionEnglish =
      document.getElementById(
        "introductionEnglish"
      );

    elements.closeIntroduction =
      document.getElementById(
        "closeIntroduction"
      );

    elements.nextQuestion =
      document.getElementById(
        "nextQuestion"
      );
  }

  function bindEvents() {
    elements.backHome.addEventListener(
      "click",
      returnHome
    );

    elements.backToPages.addEventListener(
      "click",
      returnToLessonList
    );

    elements.lessonIntroductionButton
      .addEventListener(
        "click",
        openLessonIntroduction
      );

    elements.closeIntroduction.addEventListener(
      "click",
      closeLessonIntroduction
    );

    elements.lessonIntroductionDialog
      .addEventListener(
        "click",
        closeIntroductionFromBackdrop
      );

    elements.nextQuestion.addEventListener(
      "click",
      showNextQuestion
    );

    elements.speakQuestion.addEventListener(
      "click",
      speakCurrentJapaneseQuestion
    );

    elements.furiganaToggle.addEventListener(
      "click",
      toggleFurigana
    );
  }

  function toggleFurigana() {
    playSound("click");
    state.furiganaVisible =
      !state.furiganaVisible;
    updateFuriganaControl();
  }

  function updateFuriganaControl() {
    const isLessonOpen =
      Boolean(state.selectedLesson);
    const furiganaIsHidden =
      !state.furiganaVisible;

    elements.furiganaToggle.classList.toggle(
      "hidden",
      !isLessonOpen
    );
    elements.furiganaToggle.classList.toggle(
      "furigana-off",
      furiganaIsHidden
    );
    elements.furiganaToggle.setAttribute(
      "aria-pressed",
      String(furiganaIsHidden)
    );
    elements.furiganaToggle.setAttribute(
      "aria-label",
      furiganaIsHidden
        ? "Show furigana"
        : "Hide furigana"
    );
    elements.furiganaToggle.title =
      furiganaIsHidden
        ? "ふりがなを表示する"
        : "ふりがなを隠す";
    elements.quizScreen.classList.toggle(
      "furigana-hidden",
      isLessonOpen && furiganaIsHidden
    );
  }

  function setFuriganaAwareText(element, text) {
    const value = String(text ?? "");
    const readingPattern =
      /(\([ぁ-ゖァ-ヺー・\s]+\)|（[ぁ-ゖァ-ヺー・\s]+）)/g;
    const parts = value.split(readingPattern);
    const fragment = document.createDocumentFragment();

    parts.forEach((part, index) => {
      if (index % 2 === 0) {
        fragment.appendChild(
          document.createTextNode(part)
        );
        return;
      }

      const reading = document.createElement("span");
      reading.className = "furiganaReading";
      reading.textContent = part;
      fragment.appendChild(reading);
    });

    element.replaceChildren(fragment);
  }

  function speakCurrentJapaneseQuestion() {
    if (
      !("speechSynthesis" in window) ||
      !("SpeechSynthesisUtterance" in window)
    ) {
      return;
    }

    if (
      activeJapaneseUtterance &&
      window.speechSynthesis.speaking
    ) {
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
        setSpeechButtonState("speaking");
      } else {
        window.speechSynthesis.pause();
        setSpeechButtonState("paused");
      }

      return;
    }

    const question =
      state.questions[state.currentQuestionIndex];
    const japaneseText =
      getJapaneseSpeechText(question?.question);

    if (!japaneseText) {
      return;
    }

    const utterance =
      new SpeechSynthesisUtterance(japaneseText);
    const voices =
      window.speechSynthesis.getVoices();
    const japaneseVoices = voices.filter(
      (voice) => voice.lang
        .toLowerCase()
        .startsWith("ja")
    );
    const preferredFemaleVoiceNames =
      /kyoko|nanami|haruka|sayaka|female/i;
    const japaneseVoice =
      japaneseVoices.find(
        (voice) =>
          voice.lang.toLowerCase() === "ja-jp" &&
          preferredFemaleVoiceNames.test(voice.name)
      ) ||
      japaneseVoices.find(
        (voice) =>
          preferredFemaleVoiceNames.test(voice.name)
      ) ||
      japaneseVoices.find(
        (voice) =>
          voice.lang.toLowerCase() === "ja-jp"
      ) ||
      japaneseVoices[0];

    utterance.lang = "ja-JP";
    utterance.rate = 0.78;

    if (japaneseVoice) {
      utterance.voice = japaneseVoice;
    }

    utterance.addEventListener("start", () => {
      if (activeJapaneseUtterance === utterance) {
        setSpeechButtonState("speaking");
      }
    });

    utterance.addEventListener("end", () => {
      if (activeJapaneseUtterance === utterance) {
        activeJapaneseUtterance = null;
        setSpeechButtonState("idle");
      }
    });

    utterance.addEventListener("error", () => {
      if (activeJapaneseUtterance === utterance) {
        activeJapaneseUtterance = null;
        setSpeechButtonState("idle");
      }
    });

    window.speechSynthesis.cancel();
    activeJapaneseUtterance = utterance;
    window.speechSynthesis.speak(utterance);
  }

  function getJapaneseSpeechText(text) {
    if (typeof text !== "string") {
      return "";
    }

    return text
      .split("\n")
      .filter(isPredominantlyJapaneseLine)
      .join(" ")
      .replace(/（[^（）]*）/g, "")
      .replace(/\([^()]*\)/g, "")
      .replace(/[＿_]{2,}/g, "……")
      .replace(/\s+/g, " ")
      .trim();
  }

  function isPredominantlyJapaneseLine(line) {
    const japaneseCharacters =
      line.match(/[\u3040-\u30ff\u3400-\u9fff]/g) || [];
    const latinCharacters =
      line.match(/[a-z]/gi) || [];

    return (
      japaneseCharacters.length > 0 &&
      japaneseCharacters.length >= latinCharacters.length
    );
  }

  function setSpeechButtonState(status) {
    const isPaused = status === "paused";
    const isSpeaking = status === "speaking";

    elements.speakQuestion.classList.toggle(
      "is-paused",
      isPaused
    );
    elements.speakQuestion.classList.toggle(
      "is-speaking",
      isSpeaking
    );
    elements.speakQuestion.setAttribute(
      "aria-label",
      isPaused
        ? "Resume the Japanese sentence"
        : isSpeaking
          ? "Pause the Japanese sentence"
        : "Read the Japanese sentence aloud"
    );
    elements.speakQuestion.title = isPaused
      ? "再開する"
      : isSpeaking
        ? "一時停止する"
        : "日本語を聞く";
  }

  function cancelJapaneseSpeech() {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }

    activeJapaneseUtterance = null;
    setSpeechButtonState("idle");
  }

  function restoreSavedData() {
    state.stats = readStorage(
      STORAGE_KEYS.stats,
      {
        answered: 0,
        correct: 0
      }
    );

    state.progress = readStorage(
      STORAGE_KEYS.progress,
      {}
    );
  }

  function readStorage(key, fallback) {
    try {
      const storedValue =
        localStorage.getItem(key);

      return storedValue
        ? JSON.parse(storedValue)
        : fallback;
    } catch (error) {
      console.warn(
        `Could not read ${key} from local storage.`,
        error
      );

      return fallback;
    }
  }

  function writeStorage(key, value) {
    try {
      localStorage.setItem(
        key,
        JSON.stringify(value)
      );
    } catch (error) {
      console.warn(
        `Could not save ${key} to local storage.`,
        error
      );
    }
  }

  async function loadCatalog() {
    try {
      const response = await fetch(
        "data/catalog.json",
        {
          cache: "no-store"
        }
      );

      if (!response.ok) {
        throw new Error(
          `Catalog request failed with ${response.status}.`
        );
      }

      const catalog =
        await response.json();

      if (!Array.isArray(catalog)) {
        throw new Error(
          "Catalog must contain a JSON array."
        );
      }

      return catalog.filter(
        isValidCatalogEntry
      );
    } catch (error) {
      console.info(
        "No lesson catalog is available yet.",
        error
      );

      return [];
    }
  }

  function isValidCatalogEntry(entry) {
    return Boolean(
      entry &&
      typeof entry.id === "string" &&
      typeof entry.category === "string" &&
      typeof entry.title === "string" &&
      (
        typeof entry.file === "string" ||
        (
          Array.isArray(entry.files) &&
          entry.files.length > 0 &&
          entry.files.every(
            (file) =>
              typeof file === "string"
          )
        )
      )
    );
  }

  function renderCategories() {
    elements.categoryGrid.replaceChildren();

    CATEGORY_CONFIG.forEach(
      (category) => {
        const lessons =
          getLessonsForCategory(
            category.id
          );

        const questionCount =
          lessons.reduce(
            (total, lesson) =>
              total +
              getDeclaredQuestionCount(
                lesson
              ),
            0
          );

        const button =
          document.createElement(
            "button"
          );

        button.type = "button";
        button.className =
          "category-card";

        button.style.background =
          category.color;

        button.setAttribute(
          "aria-label",
          `Open ${category.title}`
        );

        button.innerHTML = `
          <strong>
            ${escapeHtml(category.title)}
          </strong>

          <span>
            ${lessons.length} lessons ·
            ${questionCount} questions
          </span>
        `;

        button.addEventListener(
          "click",
          () => {
            playSound("click");
            openCategory(category);
          }
        );

        elements.categoryGrid.appendChild(
          button
        );
      }
    );

    const randomButton =
      document.createElement("button");

    randomButton.type = "button";
    randomButton.className =
      "category-card random-question-card";
    randomButton.setAttribute(
      "aria-label",
      "おまかせ問題を始める"
    );
    randomButton.innerHTML = `
      <strong>おまかせ問題</strong>
    `;

    randomButton.addEventListener(
      "click",
      () => {
        playSound("click");
        openRandomSession(randomButton);
      }
    );

    elements.categoryGrid.appendChild(
      randomButton
    );
  }

  function getLessonsForCategory(
    categoryId
  ) {
    return state.catalog
      .filter(
        (lesson) =>
          lesson.category === categoryId
      )
      .sort((a, b) => {
        const pageA =
          Number(a.sortOrder) ||
          Number.parseInt(
            String(a.page),
            10
          ) || 0;

        const pageB =
          Number(b.sortOrder) ||
          Number.parseInt(
            String(b.page),
            10
          ) || 0;

        return pageA - pageB;
      });
  }

  function getDeclaredQuestionCount(
    lesson
  ) {
    const count =
      Number(lesson.questionCount);

    return Number.isFinite(count) &&
      count > 0
      ? count
      : 0;
  }

  function openCategory(category) {
    state.selectedCategory = category;

    elements.pageScreen.style.setProperty(
      "--category-color",
      category.color
    );

    elements.pageTitle.textContent =
      category.title;

    const lessons =
      getLessonsForCategory(
        category.id
      );

    const totalQuestions =
      lessons.reduce(
        (total, lesson) =>
          total +
          getDeclaredQuestionCount(
            lesson
          ),
        0
      );

    elements.pageSubtitle.textContent =
      `${lessons.length} lessons · ` +
      `${totalQuestions} questions`;

    renderLessonList(lessons);
    showScreen("pages");
  }

   function renderLessonList(lessons) {
    elements.lessonList.replaceChildren();

    if (lessons.length === 0) {
      const emptyState =
        document.createElement("div");

      emptyState.className =
        "lesson-card";

      emptyState.innerHTML = `
        <div class="lesson-copy">
          <strong>
            Questions coming soon
          </strong>

          <span>
            We will add this section
            page by page.
          </span>
        </div>
      `;

      elements.lessonList.appendChild(
        emptyState
      );

      return;
    }

    lessons.forEach((lesson) => {
      const progress =
        getLessonProgress(lesson.id);

      const count =
        getDeclaredQuestionCount(
          lesson
        );

      const button =
        document.createElement(
          "button"
        );

      button.type = "button";
      button.className =
        "lesson-card";

      if (lesson.menuColor === "yellow") {
        button.classList.add(
          "lesson-card--yellow"
        );
      }

      button.innerHTML = `
        <span class="lesson-copy">
          <strong>
            ${lesson.listLabel
              ? `${escapeHtml(lesson.listLabel)} · `
              : ""}${escapeHtml(lesson.title)}
          </strong>

          <span>
            ${progress.completed}/${count}
            completed
          </span>
        </span>

        <span
          class="lesson-arrow"
          aria-hidden="true"
        >
          →
        </span>
      `;

      button.addEventListener(
        "click",
        () => {
          playSound("click");
          openLesson(lesson);
        }
      );

      elements.lessonList.appendChild(
        button
      );
    });
  }

  function getLessonProgress(
    lessonId
  ) {
    const saved =
      state.progress[lessonId];

    if (!saved) {
      return {
        completed: 0,
        correct: 0
      };
    }

    return {
      completed:
        Number(saved.completed) || 0,
      correct:
        Number(saved.correct) || 0
    };
  }

  async function openLesson(lesson) {
    setLessonLoadingState(true);

    try {
      const questions =
        await loadLessonQuestions(
          lesson
        );

      if (questions.length === 0) {
        throw new Error(
          "This lesson has no valid questions."
        );
      }

      state.selectedLesson = lesson;
      state.furiganaVisible = true;
      updateFuriganaControl();

      state.questions =
        shuffleArray(questions);

      state.currentQuestionIndex = 0;

      updateLessonIntroduction();
      showScreen("quiz");
      renderCurrentQuestion();
    } catch (error) {
      console.error(error);

      window.alert(
        "This lesson could not be opened. " +
        "Check that its JSON file is uploaded."
      );
    } finally {
      setLessonLoadingState(false);
    }
  }

  function setLessonLoadingState(
    loading
  ) {
    elements.pageSubtitle.textContent =
      loading
        ? "Loading lesson…"
        : buildCategorySubtitle();
  }

  function buildCategorySubtitle() {
    if (!state.selectedCategory) {
      return "";
    }

    const lessons =
      getLessonsForCategory(
        state.selectedCategory.id
      );

    const totalQuestions =
      lessons.reduce(
        (total, lesson) =>
          total +
          getDeclaredQuestionCount(
            lesson
          ),
        0
      );

    return (
      `${lessons.length} lessons · ` +
      `${totalQuestions} questions`
    );
  }

  async function loadLessonQuestions(
    lesson
  ) {
    const files = Array.isArray(lesson.files)
      ? lesson.files
      : [lesson.file];

    const questionGroups =
      await Promise.all(
        files.map(async (file) => {
          const response = await fetch(
            file,
            {
              cache: "no-store"
            }
          );

          if (!response.ok) {
            throw new Error(
              `Lesson request failed with ` +
              `${response.status}: ${file}`
            );
          }

          const lessonData =
            await response.json();

          if (
            lessonData?.kind ===
              "seafood-profiles" &&
            Array.isArray(lessonData.items)
          ) {
            return buildSeafoodQuestions(
              lessonData.items,
              lesson.quizMode
            );
          }

          if (
            lessonData?.kind ===
              "rice-varieties" &&
            Array.isArray(lessonData.items)
          ) {
            return buildRiceVarietyQuestions(
              lessonData.items
            );
          }

          const rawQuestions =
            Array.isArray(lessonData)
              ? lessonData
              : lessonData.questions;

          if (!Array.isArray(rawQuestions)) {
            throw new Error(
              "Lesson JSON must be an array " +
              "or contain a questions array."
            );
          }

          return rawQuestions.filter(
            isValidQuestion
          );
        })
      );

    return questionGroups
      .flat()
      .map(shuffleQuestionAnswers);
  }

  function shuffleQuestionAnswers(question) {
    const correctAnswer =
      question.answers[question.correct];
    const answers = shuffleArray(
      question.answers
    );

    return {
      ...question,
      answers,
      correct: answers.indexOf(correctAnswer)
    };
  }

  async function openRandomSession(button) {
    button.disabled = true;
    button.querySelector("strong").textContent =
      "読み込み中…";

    try {
      const loadedLessons =
        await Promise.all(
          state.catalog
            .filter(
              (lesson) =>
                lesson.category !==
                "conversation"
            )
            .map(
              async (lesson) => {
                try {
                  const questions =
                    await loadLessonQuestions(
                      lesson
                    );

                  return {
                    lesson,
                    questions:
                      shuffleArray(questions)
                  };
                } catch (error) {
                  console.info(
                    `Skipping ${lesson.id} ` +
                    "in random practice.",
                    error
                  );

                  return null;
                }
              }
            )
        );

      const availableLessons =
        loadedLessons.filter(
          (entry) =>
            entry &&
            entry.questions.length > 0
        );

      const selectedQuestions = [];

      while (
        selectedQuestions.length < 10 &&
        availableLessons.some(
          (entry) =>
            entry.questions.length > 0
        )
      ) {
        const round = shuffleArray(
          availableLessons.filter(
            (entry) =>
              entry.questions.length > 0
          )
        );

        for (const entry of round) {
          if (
            selectedQuestions.length >= 10
          ) {
            break;
          }

          const question =
            entry.questions.pop();

          selectedQuestions.push({
            ...question,
            chapter:
              `${question.chapter ||
                entry.lesson.title}` +
              ` · Page ${entry.lesson.page}`
          });
        }
      }

      if (selectedQuestions.length === 0) {
        throw new Error(
          "No questions are available."
        );
      }

      state.selectedCategory = null;
      state.selectedLesson = {
        id: "random-session",
        title: "おまかせ問題",
        isRandom: true
      };
      state.furiganaVisible = true;
      updateFuriganaControl();
      state.questions = selectedQuestions;
      state.currentQuestionIndex = 0;

      updateLessonIntroduction();
      showScreen("quiz");
      renderCurrentQuestion();
    } catch (error) {
      console.error(error);
      window.alert(
        "おまかせ問題を読み込めませんでした。"
      );
    } finally {
      button.disabled = false;
      button.querySelector("strong").textContent =
        "おまかせ問題";
    }
  }

  function updateLessonIntroduction() {
    const introduction =
      state.selectedLesson?.introduction;
    const isAvailable = Boolean(
      introduction?.ja && introduction?.en
    );

    elements.lessonIntroductionButton
      .classList.toggle(
        "hidden",
        !isAvailable
      );

    if (!isAvailable) {
      return;
    }

    elements.introductionTitle.textContent =
      state.selectedLesson.title;
    setFuriganaAwareText(
      elements.introductionJapanese,
      introduction.ja
    );
    elements.introductionEnglish.textContent =
      introduction.en;
  }

  function openLessonIntroduction() {
    if (!state.selectedLesson?.introduction) {
      return;
    }

    playSound("click");
    elements.lessonIntroductionDialog
      .showModal();
  }

  function closeLessonIntroduction() {
    elements.lessonIntroductionDialog.close();
  }

  function closeIntroductionFromBackdrop(event) {
    if (
      event.target ===
      elements.lessonIntroductionDialog
    ) {
      closeLessonIntroduction();
    }
  }

  function buildSeafoodQuestions(
    items,
    mode
  ) {
    const candidates = items.filter(
      (item) => {
        if (mode === "fish-names") {
          return item.group === "fish";
        }

        if (mode === "seafood-names") {
          return item.group !== "fish";
        }

        if (mode === "flavour-texture") {
          return Boolean(
            item.flavour && item.texture
          );
        }

        if (mode === "cooking-method") {
          return Boolean(item.methods);
        }

        return false;
      }
    );

    return candidates.map((item, index) =>
      buildSeafoodQuestion(
        item,
        index,
        candidates,
        mode
      )
    );
  }

  function buildRiceVarietyQuestions(items) {
    const regions = [
      ...new Set(
        items.map((item) => item.region)
      )
    ];
    const questions = [];

    items.forEach((item, index) => {
      const nameAnswers = buildChoices(
        item.name,
        items.map((entry) => entry.name),
        index * 2 % 4
      );

      questions.push({
        id: `page27-variety-q${
          String(index * 2 + 1).padStart(2, "0")
        }`,
        chapter: "米の品種・産地",
        page: 27,
        type: "rice-profile",
        difficulty: 2,
        question:
          `${item.region}と結(むす)びつきが強(つよ)く、` +
          `「${item.profile}」という特徴(とくちょう)` +
          `があり、${item.use}に向(む)く品種(ひんしゅ)` +
          `はどれですか。`,
        answers: nameAnswers.answers,
        correct: nameAnswers.correct,
        jpExplanation:
          `「${item.name}」は${item.region}を` +
          `代表(だいひょう)する米(こめ)の一(ひと)つで、` +
          `${item.profile}特徴(とくちょう)があります。` +
          `${item.use}に使(つか)いやすい品種(ひんしゅ)です。`,
        enExplanation:
          `${item.name} is strongly associated with ` +
          `${item.regionEnglish}: ${item.englishProfile}.`
      });

      const regionAnswers = buildChoices(
        item.region,
        regions,
        (index * 2 + 1) % 4
      );

      questions.push({
        id: `page27-variety-q${
          String(index * 2 + 2).padStart(2, "0")
        }`,
        chapter: "米の品種・産地",
        page: 27,
        type: "rice-region",
        difficulty: 2,
        question:
          `「${item.name}」の代表的(だいひょうてき)な` +
          `産地(さんち)・地域(ちいき)として、` +
          `最(もっと)も結(むす)びつきが強(つよ)い` +
          `ものはどれですか。`,
        answers: regionAnswers.answers,
        correct: regionAnswers.correct,
        jpExplanation:
          `「${item.name}」は${item.region}と` +
          `強(つよ)く結(むす)びつく品種(ひんしゅ)です。`,
        enExplanation:
          `${item.name} is strongly associated with ` +
          `${item.regionEnglish}.`
      });
    });

    return questions;
  }

  function buildChoices(
    correctValue,
    values,
    correctIndex
  ) {
    const alternatives = [
      ...new Set(values)
    ].filter(
      (value) => value !== correctValue
    );
    const distractors = shuffleArray(
      alternatives
    ).slice(0, 3);
    const answers = [...distractors];
    answers.splice(
      Math.min(correctIndex, answers.length),
      0,
      correctValue
    );

    return {
      answers,
      correct: answers.indexOf(correctValue)
    };
  }

  function buildSeafoodQuestion(
    item,
    index,
    candidates,
    mode
  ) {
    const readingFirst = index % 2 === 0;
    const answerValue =
      mode === "fish-names" ||
      mode === "seafood-names"
        ? readingFirst
          ? item.reading
          : item.name
        : `${item.name}(${item.reading})`;

    const valueFor = (candidate) => {
      if (
        mode === "fish-names" ||
        mode === "seafood-names"
      ) {
        return readingFirst
          ? candidate.reading
          : candidate.name;
      }

      return (
        `${candidate.name}` +
        `(${candidate.reading})`
      );
    };

    const distractors = [];

    for (
      let offset = 1;
      distractors.length < 3 &&
      offset < candidates.length;
      offset += 1
    ) {
      const value = valueFor(
        candidates[
          (index + offset) %
            candidates.length
        ]
      );

      if (
        value !== answerValue &&
        !distractors.includes(value)
      ) {
        distractors.push(value);
      }
    }

    const correct = index % 4;
    const answers = [...distractors];
    answers.splice(correct, 0, answerValue);

    let question;
    let jpExplanation;

    if (
      mode === "fish-names" ||
      mode === "seafood-names"
    ) {
      question = readingFirst
        ? `「${item.name}」はどう読(よ)みますか。`
        : `「${item.reading}」と読(よ)む` +
          `魚介(ぎょかい)はどれですか。`;

      jpExplanation =
        `「${item.name}」は` +
        `「${item.reading}」と読(よ)みます。`;
    } else if (mode === "flavour-texture") {
      question =
        `味(あじ)は「${item.flavour}」、` +
        `食感(しょっかん)は` +
        `「${item.texture}」と表現(ひょうげん)` +
        `されることが多(おお)い魚介(ぎょかい)` +
        `はどれですか。`;

      jpExplanation =
        `「${item.name}(${item.reading})」は、` +
        `${item.flavour}味(あじ)わいと、` +
        `${item.texture}食感(しょっかん)が` +
        `特徴(とくちょう)です。`;
    } else {
      question =
        `「${item.methods}」に` +
        `よく使(つか)われる魚介(ぎょかい)` +
        `はどれですか。`;

      jpExplanation =
        `「${item.name}(${item.reading})」は、` +
        `${item.methods}などで` +
        `持(も)ち味(あじ)を生(い)かします。`;
    }

    return {
      id: `page22-23-${mode}-q${
        String(index + 1).padStart(2, "0")
      }`,
      chapter:
        mode === "fish-names"
          ? "魚の名前"
          : mode === "seafood-names"
            ? "魚以外の魚介の名前"
            : mode === "flavour-texture"
              ? "魚の味・食感"
              : "魚の調理法",
      page: "22–23",
      type: mode,
      difficulty:
        mode.includes("names") ? 2 : 3,
      question,
      answers,
      correct,
      jpExplanation,
      enExplanation:
        `${item.name} (${item.reading}) is ` +
        `${item.english}.`
    };
  }

  function isValidQuestion(question) {
    return Boolean(
      question &&
      typeof question.id === "string" &&
      typeof question.question ===
        "string" &&
      Array.isArray(question.answers) &&
      question.answers.length >= 2 &&
      Number.isInteger(
        question.correct
      ) &&
      question.correct >= 0 &&
      question.correct <
        question.answers.length
    );
  }

  function renderCurrentQuestion() {
    cancelJapaneseSpeech();
    state.answerLocked = false;

    const question =
      state.questions[
        state.currentQuestionIndex
      ];

    elements.questionProgress.textContent =
      `${state.currentQuestionIndex + 1} / ` +
      `${state.questions.length}`;

    elements.chapterTag.textContent =
      question.chapter ||
      state.selectedLesson?.title ||
      "";

    setFuriganaAwareText(
      elements.questionText,
      question.question
    );

    const canSpeakQuestion =
      "speechSynthesis" in window &&
      "SpeechSynthesisUtterance" in window &&
      Boolean(getJapaneseSpeechText(question.question));

    elements.speakQuestion.classList.toggle(
      "hidden",
      !canSpeakQuestion
    );

    if (question.image) {
      const [imagePath, imageFragment] =
        question.image.split("#", 2);
      const imageSource = imageFragment
        ? `${imagePath}${imagePath.includes("?") ? "&" : "?"}` +
          `highlight=${encodeURIComponent(imageFragment)}#${imageFragment}`
        : imagePath;

      elements.questionImage.src =
        imageSource;
      elements.questionImage.alt =
        question.imageAlt || "";
      elements.questionVisual.classList.remove(
        "hidden"
      );
    } else {
      elements.questionImage.removeAttribute(
        "src"
      );
      elements.questionImage.alt = "";
      elements.questionVisual.classList.add(
        "hidden"
      );
    }

    elements.answerContainer
      .replaceChildren();

    elements.resultCard.classList.add(
      "hidden"
    );

    elements.resultCard.classList.remove(
      "correct-result",
      "wrong-result"
    );

    question.answers.forEach(
      (answerText, answerIndex) => {
        const button =
          document.createElement(
            "button"
          );

        button.type = "button";
        button.className =
          "answer-button";

        setFuriganaAwareText(
          button,
          answerText
        );

        button.addEventListener(
          "click",
          () => {
            selectAnswer(
              answerIndex,
              button
            );
          }
        );

        elements.answerContainer
          .appendChild(button);
      }
    );

    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  }

  function selectAnswer(
    selectedIndex,
    selectedButton
  ) {
    if (state.answerLocked) {
      return;
    }

    state.answerLocked = true;

    const question =
      state.questions[
        state.currentQuestionIndex
      ];

    const buttons = Array.from(
      elements.answerContainer
        .querySelectorAll(
          ".answer-button"
        )
    );

    buttons.forEach(
      (button, answerIndex) => {
        button.disabled = true;

        if (
          answerIndex ===
          question.correct
        ) {
          button.classList.add(
            "correct"
          );
        }
      }
    );

    const isCorrect =
      selectedIndex ===
      question.correct;

    if (!isCorrect) {
      selectedButton.classList.add(
        "wrong"
      );
    }

    updateStatistics(isCorrect);
    updateLessonProgress(isCorrect);
    showExplanation(
      question,
      isCorrect
    );

    playSound(
      isCorrect
        ? "correct"
        : "wrong"
    );
  }

  function updateStatistics(
    isCorrect
  ) {
    state.stats.answered += 1;

    if (isCorrect) {
      state.stats.correct += 1;
    }

    writeStorage(
      STORAGE_KEYS.stats,
      state.stats
    );

    renderStats();
  }

  function updateLessonProgress(
    isCorrect
  ) {
    if (
      !state.selectedLesson ||
      state.selectedLesson.isRandom
    ) {
      return;
    }

    const lessonId =
      state.selectedLesson.id;

    const current =
      getLessonProgress(lessonId);

    current.completed += 1;

    if (isCorrect) {
      current.correct += 1;
    }

    state.progress[lessonId] =
      current;

    writeStorage(
      STORAGE_KEYS.progress,
      state.progress
    );
  }

  function renderStats() {
    elements.answeredCount.textContent =
      state.stats.answered;

    elements.correctCount.textContent =
      state.stats.correct;

    const accuracy =
      state.stats.answered > 0
        ? Math.round(
            (
              state.stats.correct /
              state.stats.answered
            ) * 100
          )
        : 0;

    elements.accuracy.textContent =
      `${accuracy}%`;
  }

   function showExplanation(
    question,
    isCorrect
  ) {
    elements.resultTitle.textContent =
      isCorrect
        ? "Great!"
        : "Almost.";

    setFuriganaAwareText(
      elements.jpExplanation,
      question.jpExplanation ||
        "解説はまだありません。"
    );

    elements.enExplanation.textContent =
      question.enExplanation ||
      "No English explanation yet.";

    const showExplanations =
      state.selectedLesson?.feedbackMode !==
      "result-only";

    elements.explanations.forEach(
      (explanation) => {
        explanation.classList.toggle(
          "hidden",
          !showExplanations
        );
      }
    );

    const hasGrammarDetails = Boolean(
      question.grammarPoint &&
      question.formation &&
      question.casualForm
    );

    elements.grammarDetails.classList.toggle(
      "hidden",
      !hasGrammarDetails
    );

    if (hasGrammarDetails) {
      setFuriganaAwareText(
        elements.grammarPoint,
        question.grammarPoint
      );
      setFuriganaAwareText(
        elements.grammarFormation,
        question.formation
      );
      setFuriganaAwareText(
        elements.grammarCasual,
        question.casualForm
      );
    }

    elements.resultCard.classList.remove(
      "hidden"
    );

    elements.resultCard.classList.add(
      isCorrect
        ? "correct-result"
        : "wrong-result"
    );

    requestAnimationFrame(() => {
      elements.resultCard.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });
    });
  }

  function showNextQuestion() {
    playSound("click");

    const isLastQuestion =
      state.currentQuestionIndex >=
      state.questions.length - 1;

    if (isLastQuestion) {
      finishLesson();
      return;
    }

    state.currentQuestionIndex += 1;
    renderCurrentQuestion();
  }

  function finishLesson() {
    window.alert(
      state.selectedLesson?.isRandom
        ? "おまかせ問題、完了！"
        : "Lesson complete. Great work!"
    );

    if (state.selectedLesson?.isRandom) {
      returnHome();
      return;
    }

    if (state.selectedCategory) {
      const lessons =
        getLessonsForCategory(
          state.selectedCategory.id
        );

      renderLessonList(lessons);
    }

    returnToLessonList();
  }

  function returnHome() {
    cancelJapaneseSpeech();
    playSound("click");

    state.selectedCategory = null;
    state.selectedLesson = null;

    renderCategories();
    showScreen("home");
  }

  function returnToLessonList() {
    cancelJapaneseSpeech();

    if (state.selectedLesson?.isRandom) {
      returnHome();
      return;
    }

    playSound("click");

    if (state.selectedCategory) {
      const lessons =
        getLessonsForCategory(
          state.selectedCategory.id
        );

      renderLessonList(lessons);
    }

    showScreen("pages");
  }

  function showScreen(screenName) {
    const screenCanvas =
      screenName === "pages" &&
      state.selectedCategory
        ? state.selectedCategory.canvas
        : "var(--paper)";

    document.documentElement.style.setProperty(
      "--screen-canvas",
      screenCanvas
    );

    elements.topbar?.classList.toggle(
      "hidden",
      screenName === "quiz"
    );

    elements.homeScreen.classList.toggle(
      "hidden",
      screenName !== "home"
    );

    elements.pageScreen.classList.toggle(
      "hidden",
      screenName !== "pages"
    );

    elements.quizScreen.classList.toggle(
      "hidden",
      screenName !== "quiz"
    );

    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  }

  function shuffleArray(items) {
    const copy = [...items];

    for (
      let index = copy.length - 1;
      index > 0;
      index -= 1
    ) {
      const randomIndex =
        Math.floor(
          Math.random() * (index + 1)
        );

      [
        copy[index],
        copy[randomIndex]
      ] = [
        copy[randomIndex],
        copy[index]
      ];
    }

    return copy;
  }

  function playSound(type) {
    try {
      const AudioContextClass =
        window.AudioContext ||
        window.webkitAudioContext;

      if (!AudioContextClass) {
        return;
      }

      const context =
        new AudioContextClass();

      const oscillator =
        context.createOscillator();

      const gain =
        context.createGain();

      const settings = {
        click: {
          frequency: 430,
          duration: 0.045,
          oscillatorType: "sine"
        },
        correct: {
          frequency: 760,
          duration: 0.12,
          oscillatorType: "sine"
        },
        wrong: {
          frequency: 170,
          duration: 0.14,
          oscillatorType: "square"
        }
      };

      const selected =
        settings[type] ||
        settings.click;

      oscillator.type =
        selected.oscillatorType;

      oscillator.frequency.value =
        selected.frequency;

      gain.gain.setValueAtTime(
        0.05,
        context.currentTime
      );

      gain.gain
        .exponentialRampToValueAtTime(
          0.001,
          context.currentTime +
            selected.duration
        );

      oscillator.connect(gain);
      gain.connect(context.destination);

      oscillator.start();

      oscillator.stop(
        context.currentTime +
          selected.duration
      );
    } catch (error) {
      // Sound is optional.
    }
  }

  function escapeHtml(value) {
    const text = String(value);

    return text.replace(
      /[&<>"']/g,
      (character) => {
        const entities = {
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#039;"
        };

        return entities[character];
      }
    );
  }

  function registerServiceWorker() {
    if (
      !(
        "serviceWorker" in navigator
      )
    ) {
      return;
    }

    window.addEventListener(
      "load",
      () => {
        navigator.serviceWorker
          .register("sw.js")
          .catch((error) => {
            console.info(
              "Service worker not available yet.",
              error
            );
          });
      }
    );
  }
})();
