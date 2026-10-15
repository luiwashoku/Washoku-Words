(() => {
  "use strict";
  const kanaOnly = /^[ぁ-ゖー]+$/u;
  function normalizeReading(value) {
    return String(value || "").normalize("NFKC").trim()
      .replace(/[ァ-ヶ]/g, c => String.fromCharCode(c.charCodeAt(0) - 0x60)).normalize("NFC");
  }
  function stripReading(value) {
    return String(value || "").replace(/[（(][ぁ-ゖァ-ヶー]+[）)]/gu, "");
  }
  function annotatedReading(value) {
    const text = String(value || "").normalize("NFKC").trim();
    // Only supplied furigana; never guess unannotated kanji.
    return normalizeReading(text.replace(/[々〆一-龯]+\(([ぁ-ゖァ-ヶー]+)\)/gu, "$1"));
  }
  function isTerm(value) {
    const text = stripReading(value);
    return !!text && text.length <= 24 && !/[\s。！？!?、,;：:・／/～〜…「」『』]/u.test(text)
      && !/(です|ます|ません|ました|ましょう|ください|だった|している|になります)$/u.test(text);
  }
  function extractVocabulary(lesson, data) {
    const result = [];
    const add = (entry, spelling, reading, english) => {
      if (spelling && english && isTerm(spelling)) result.push({
        spelling: stripReading(spelling), reading: reading || annotatedReading(spelling), english,
        speech: entry.speech || reading || spelling, source: lesson.id, sourceFile: lesson.file,
        sourceKey: entry.sourceKey
      });
    };
    const rows = Array.isArray(data) ? data : data.entries || data.questions || [];
    if (lesson.gameMode === "vocabulary-cards" && !lesson.grammarCards && !lesson.sentenceCards && lesson.id !== "auto-response-cards") {
      rows.forEach(card => {
        if (!card.blocks || lesson.conjugationCards) add(card, card.kanji || card.japanese, card.reading || card.japanese, card.english);
        (card.blocks || []).forEach(block => {
          (block.pairs || []).forEach(pair => {
            const word = pair.vocabulary;
            if (word) {
              const annotated = annotatedReading(word.japanese);
              const suppliedKeyReading = pair.sourceKey?.split("|")[0];
              add({ ...word, sourceKey: pair.sourceKey }, word.japanese,
                word.reading || suppliedKeyReading || (kanaOnly.test(annotated) ? annotated : word.speech), word.english);
            }
          });
          (block.numberRows || []).forEach(word => add(word, word.japanese, word.reading, word.english));
          const words = block.items || (!block.heading && !block.pairs && !block.numberRows ? [block] : []);
          words.forEach(word => {
            if (isTerm(word.japanese) && word.english && !/[.!?]/.test(word.english)) {
              const annotated = annotatedReading(word.japanese);
              add(word, word.japanese, word.reading || (kanaOnly.test(annotated) ? annotated : word.speech), word.english);
            }
          });
        });
      });
    }
    rows.forEach(card => {
      if (card.answerMode === "reading-card" && card.englishTitle) add(card, card.question, annotatedReading(card.question), card.englishTitle);
      if (card.verb && card.verbReading && card.translation) {
        // A drill's sentence translation is not a dictionary meaning. Only explicit verb meanings qualify.
        if (card.verbMeaning) add(card, card.verb, card.verbReading, card.verbMeaning);
      }
      (card.vocabulary || []).forEach(word => add(word, word.spelling || word.japanese, word.reading, word.english));
    });
    return result;
  }
  function meaningKey(value) {
    return String(value || "").normalize("NFKC").trim().toLowerCase().replace(/\s+/g, " ");
  }
  function romanizedReading(reading) {
    const pairs = "あ:a い:i う:u え:e お:o か:ka き:ki く:ku け:ke こ:ko さ:sa し:shi す:su せ:se そ:so た:ta ち:chi つ:tsu て:te と:to な:na に:ni ぬ:nu ね:ne の:no は:ha ひ:hi ふ:fu へ:he ほ:ho ま:ma み:mi む:mu め:me も:mo や:ya ゆ:yu よ:yo ら:ra り:ri る:ru れ:re ろ:ro わ:wa を:wo ん:n が:ga ぎ:gi ぐ:gu げ:ge ご:go ざ:za じ:ji ず:zu ぜ:ze ぞ:zo だ:da ぢ:ji づ:zu で:de ど:do ば:ba び:bi ぶ:bu べ:be ぼ:bo ぱ:pa ぴ:pi ぷ:pu ぺ:pe ぽ:po";
    const kana = Object.fromEntries(pairs.split(" ").map(pair => pair.split(":")));
    let result = "", doubled = false;
    for (let i = 0; i < reading.length; i++) {
      if (reading[i] === "ー") continue;
      if (reading[i] === "っ") { doubled = true; continue; }
      let syllable = kana[reading[i]];
      if (!syllable) return null;
      const small = { "ゃ": "a", "ゅ": "u", "ょ": "o" }[reading[i + 1]];
      if (small && syllable.endsWith("i")) { syllable = syllable.slice(0, -1) + small; i++; }
      result += (doubled ? syllable[0] : "") + syllable; doubled = false;
    }
    return result;
  }
  function romanKey(text) {
    return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
      .replace(/[\s-]/g, "").replace(/([aeiou])\1/g, "$1").replace(/ou/g, "o");
  }
  function displayVariants(entry) {
    const groups = new Map(), romanized = romanizedReading(entry.reading);
    for (const variant of entry.variants) {
      let meaning = variant.english.trim();
      const parts = meaning.split(/\s*\/\s*/);
      // Omit a redundant romanized name only when it matches this exact reading.
      if (parts.length > 1 && /^[A-Za-zÀ-ž\s-]+$/.test(parts[0]) && romanized && romanKey(parts[0]) === romanKey(romanized)) meaning = parts.slice(1).join(" / ");
      const key = meaningKey(meaning);
      const group = groups.get(key) || { english: meaning, spellings: [], variants: [] };
      const base = variant.spelling.normalize("NFKC").replace(/\([^()]*\)/g, "");
      const index = group.spellings.findIndex(spelling => spelling.normalize("NFKC").replace(/\([^()]*\)/g, "") === base);
      if (index < 0) group.spellings.push(variant.spelling);
      else if (variant.spelling.length > group.spellings[index].length) group.spellings[index] = variant.spelling;
      group.variants.push(variant); groups.set(key, group);
    }
    return [...groups.values()];
  }
  function aggregate(records) {
    const dictionary = new Map();
    const audit = { candidates: records.length, missingReading: 0, tooShort: 0, sources: {}, variants: 0 };
    records.forEach(record => {
      const reading = normalizeReading(record.reading);
      if (!kanaOnly.test(reading)) { audit.missingReading++; return; }
      if (Array.from(reading).length < 2) { audit.tooShort++; return; }
      audit.sources[record.source] = (audit.sources[record.source] || 0) + 1;
      const entry = dictionary.get(reading) || { reading, kana: [...new Set(Array.from(reading))], variants: [] };
      let variant = entry.variants.find(v => v.spelling === record.spelling && meaningKey(v.english) === meaningKey(record.english));
      if (!variant) { variant = { ...record, reading, sources: [] }; entry.variants.push(variant); audit.variants++; }
      if (!variant.sources.some(s => s.source === record.source && s.speech === record.speech)) variant.sources.push(record);
      dictionary.set(reading, entry);
    });
    audit.readings = dictionary.size;
    return { dictionary, audit };
  }
  function validAnswers(dictionary, kana, center) {
    const allowed = new Set(kana);
    return [...dictionary.values()].filter(word => word.kana.includes(center) && word.kana.every(c => allowed.has(c))).map(word => word.reading);
  }
  function validateAnswer(value, board, dictionary, found = []) {
    const reading = normalizeReading(value);
    if (!kanaOnly.test(reading) || Array.from(reading).length < 2) return { error: "Use at least two kana.", reading };
    if (!reading.includes(board.center)) return { error: `Include the centre kana ${board.center}.`, reading };
    if ([...reading].some(c => !board.kana.includes(c))) return { error: "Use only the kana shown in the honeycomb.", reading };
    if (!dictionary.has(reading)) return { error: "That reading is not in this game's vocabulary dictionary.", kind: "not-found", reading };
    if (found.includes(reading)) return { error: "You already found that word.", reading };
    return { reading, word: dictionary.get(reading) };
  }
  function restorePuzzle(saved, dictionary) {
    if (!saved || saved.version !== 1 || !Array.isArray(saved.kana) || saved.kana.length !== 7 || new Set(saved.kana).size !== 7
      || saved.kana.some(c => !kanaOnly.test(c) || [...c].length !== 1) || !saved.kana.includes(saved.center)) return null;
    const answers = validAnswers(dictionary, saved.kana, saved.center).sort();
    if (answers.length < 5) return null;
    const found = Array.isArray(saved.found) ? [...new Set(saved.found.filter(r => answers.includes(r)))] : [];
    const outer = saved.outer;
    return { ...saved, answers, found, outer: Array.isArray(outer) && outer.length === 6 && new Set(outer).size === 6
      && outer.every(c => saved.kana.includes(c) && c !== saved.center) ? outer : saved.kana.filter(c => c !== saved.center),
      input: typeof saved.input === "string" ? [...normalizeReading(saved.input)].filter(c => saved.kana.includes(c)).join("").slice(0, 48) : "",
      finished: saved.finished === true, hint: answers.includes(saved.hint) && !found.includes(saved.hint) ? saved.hint : null,
      hintStage: saved.hintStage === 2 ? 2 : 1 };
  }
  function resolveAudio(variant) {
    const clean = window.getJapaneseSpeechText || (s => s);
    const sources = variant.sources || [variant];
    for (const source of sources) {
      const keys = [source.sourceKey, source.speech, variant.reading, variant.spelling].filter(Boolean).map(clean);
      const files = window.lessonAudioFiles?.[source.source];
      for (const key of keys) if (files?.[key]) return files[key];
    }
    const keys = [variant.sourceKey, `${variant.reading}|${variant.spelling}`, variant.reading, variant.spelling].filter(Boolean).map(clean);
    for (const files of [window.wordExplosionAudioFiles, window.gameAudioFiles, window.tasteAudioFiles]) {
      for (const key of keys) if (files?.[key]) return files[key];
    }
    return null;
  }
  window.KanahachiCore = { normalizeReading, annotatedReading, extractVocabulary, aggregate, displayVariants, validAnswers, validateAnswer, restorePuzzle, resolveAudio };
})();
