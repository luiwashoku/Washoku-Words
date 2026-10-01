(() => {
  "use strict";

  window.getJapaneseSpeechText = function getJapaneseSpeechText(text) {
    if (typeof text !== "string") return "";

    return text
      // Read the annotation instead of its kanji before removing silent notes.
      .replace(/([々〆ヵヶ一-龯]+)[(（]([ぁ-ゖァ-ヺー・\s]+)[)）]/g, "$2")
      .replace(/（[^（）]*）/g, "")
      .replace(/\([^()]*\)/g, "")
      .split(/\r?\n/)
      .map((line) => line.replace(
        // A dialogue label starts a line and ends at a colon. Keep times like 9:30.
        /^\s*[A-Za-zＡ-Ｚａ-ｚぁ-ゖァ-ヺ一-龯々][^:：。！？!?、\n]*[：:]\s*/,
        ""
      ))
      .filter((line) => {
        // Percentage-only choices still need a distinct audio lookup key.
        if (/^\s*\d+(?:\.\d+)?\s*[%％][。.!！?？]?\s*$/.test(line)) return true;
        const japanese = line.match(/[\u3040-\u30ff\u3400-\u9fff]/g) || [];
        const latin = line.match(/[a-z]/gi) || [];
        return japanese.length > 0 && japanese.length >= latin.length;
      })
      .join(" ")
      .replace(/[＿_]{2,}/g, "……")
      .replace(/\s+/g, " ")
      .replace(/\s+([、。！？!?])/g, "$1")
      .replace(/、{2,}/g, "、")
      .replace(/。{2,}/g, "。")
      .trim();
  };
})();
