(() => {
  "use strict";

  function mount(container, {file, getRecordedJapaneseFile, speakerTemplate}) {
    const controller = new AbortController();
    const {signal} = controller;
    const player = window.MoneyCatGame.createVocabularyPlayer(
      text => typeof text === "object" ? text.file : getRecordedJapaneseFile(text),
      src => new window.Audio(src), window.fetch.bind(window), signal);
    player.unlock();
    container.replaceChildren();
    container.classList.add("money-cat-audio-check");
    const status = document.createElement("p");
    status.setAttribute("role", "status");
    status.textContent = "Loading recordings…";
    const list = document.createElement("ul");
    list.className = "audio-check-list";
    container.append(status, list);
    let revision = 0;

    Promise.all([
      window.WordExplosionGame.loadVocabulary(file, signal),
      fetch("data/marin-audio-trials.json", {signal}).then(response => {
        if (!response.ok) throw new Error("Audio trials could not load.");
        return response.json();
      })
    ]).then(([{entries}, trials]) => {
      if (signal.aborted) return;
      const words = entries.filter(word => getRecordedJapaneseFile(word.japanese));
      words.sort((a, b) => a.japanese.localeCompare(b.japanese, "ja"));
      status.textContent = "";
      for (const word of words) {
        const row = document.createElement("li");
        const label = document.createElement("span");
        label.lang = "ja";
        label.textContent = word.kanji ? `${word.kanji}（${word.japanese}）` : word.japanese;
        function makeSpeaker(trialFile) {
          const button = speakerTemplate.cloneNode(true);
          button.removeAttribute("id");
          button.className = "icon-button audio-check-play";
          button.querySelectorAll(".pauseIcon, .resumeIcon").forEach(icon => icon.remove());
          button.disabled = false;
          button.setAttribute("aria-label", `Play ${trialFile ? "new trial for " : ""}${word.japanese}`);
          button.title = trialFile ? "New pitch-accent trial" : `Play ${word.japanese}`;
          if (trialFile) {
            button.classList.add("audio-check-trial");
            const caption = document.createElement("span");
            caption.textContent = "New";
            button.append(caption);
          }
          button.addEventListener("click", () => {
            const current = ++revision;
            status.textContent = "";
            player.play(trialFile ? {file: trialFile} : word.japanese).catch(() => {
              if (!signal.aborted && current === revision) {
                status.textContent = `Could not play ${word.japanese}. Tap its speaker to retry.`;
              }
            });
          }, {signal});
          return button;
        }
        const controls = document.createElement("div");
        controls.className = "audio-check-controls";
        controls.append(makeSpeaker());
        if (trials[word.japanese]) controls.append(makeSpeaker(trials[word.japanese]));
        row.append(label, controls);
        list.append(row);
      }
    }).catch(error => {
      if (!signal.aborted) status.textContent = `${error.message} Return home and try again.`;
    });

    return () => {
      controller.abort();
      player.stop();
      container.classList.remove("money-cat-audio-check");
      container.replaceChildren();
    };
  }

  window.MoneyCatAudioCheck = {mount};
})();
