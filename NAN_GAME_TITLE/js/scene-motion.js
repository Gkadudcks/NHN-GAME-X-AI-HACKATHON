(function (global) {
  "use strict";

  const EMOTIONS = ["surprised", "nervous", "happy", "embarrassed", "angry", "sad", "determined"];
  const CAMERAS = ["focus", "tension", "impact", "romance", "reveal"];
  const EFFECTS = ["discovery", "document-impact", "decision-focus", "mic-live", "dinner-evening"];

  function restart(element, className) {
    if (!element) return;
    element.classList.remove(className);
    void element.offsetWidth;
    element.classList.add(className);
  }

  function applyDialogueEmphasis(stage, scene = {}) {
    const dialogue = stage.querySelector(".dialogue-card #dialogue");
    const phrases = (Array.isArray(scene.emphasis) ? scene.emphasis : [scene.emphasis])
      .filter((phrase) => typeof phrase === "string" && phrase.length);
    if (!dialogue || !phrases.length || !dialogue.textContent) return;

    const source = dialogue.textContent;
    const matches = [];
    phrases.forEach((phrase, phraseIndex) => {
      let offset = 0;
      while (offset < source.length) {
        const start = source.indexOf(phrase, offset);
        if (start < 0) break;
        matches.push({ start, end: start + phrase.length, phraseIndex });
        offset = start + phrase.length;
      }
    });
    matches.sort((a, b) => a.start - b.start || b.end - a.end);
    const usable = matches.filter((match, index) =>
      !matches.slice(0, index).some((prior) => match.start < prior.end)
    );
    if (!usable.length) return;

    const fragment = document.createDocumentFragment();
    let cursor = 0;
    usable.forEach((match, index) => {
      if (match.start > cursor) fragment.append(document.createTextNode(source.slice(cursor, match.start)));
      const mark = document.createElement("strong");
      mark.className = "dialogue-emphasis";
      mark.style.setProperty("--emphasis-index", index);
      mark.textContent = source.slice(match.start, match.end);
      fragment.append(mark);
      cursor = match.end;
    });
    if (cursor < source.length) fragment.append(document.createTextNode(source.slice(cursor)));
    dialogue.replaceChildren(fragment);
  }

  function characterCompositionChanged(stage) {
    const signature = Array.from(stage.querySelectorAll(".character")).map((character) => [
      character.getAttribute("src") || "",
      character.style.getPropertyValue("--position-x"),
      Array.from(character.classList).filter((name) => name.startsWith("framing-")).join("."),
    ].join("|")).join(";");
    const changed = stage.dataset.characterComposition !== signature;
    stage.dataset.characterComposition = signature;
    return changed;
  }

  function applyDirection(stage, scene = {}) {
    const speaker = stage.querySelector(".character.speaking");
    const recoveringFromSad = stage.dataset.sceneMotion === "sad" && scene.motion !== "sad";
    stage.dataset.sceneMotion = scene.motion || "";
    stage.classList.remove("camera-reset", ...CAMERAS.map((name) => `camera-${name}`));
    stage.classList.remove(...EFFECTS.map((name) => `effect-${name}`));
    stage.classList.add(`camera-${CAMERAS.includes(scene.camera) ? scene.camera : "reset"}`);
    if (EFFECTS.includes(scene.effect)) {
      void stage.offsetWidth;
      stage.classList.add(`effect-${scene.effect}`);
    }
    if (!speaker) return false;
    speaker.classList.remove(...EMOTIONS.map((name) => `emotion-${name}`));
    if (EMOTIONS.includes(scene.motion)) speaker.classList.add(`emotion-${scene.motion}`);
    return recoveringFromSad;
  }

  function play(stage, scene) {
    if (!stage) return;
    const characterChanged = characterCompositionChanged(stage);
    const recoveringFromSad = applyDirection(stage, scene);
    applyDialogueEmphasis(stage, scene);
    restart(stage.querySelector(".dialogue-card:not([hidden])"), "dialogue-beat");
    if (recoveringFromSad) restart(stage.querySelector(".character.speaking"), "emotion-recover");
    else if (scene?.motion) restart(stage.querySelector(".character.speaking"), "emotion-beat");
    else if (characterChanged) restart(stage.querySelector(".character.speaking"), "speaker-beat");

    restart(stage.querySelector(".stage-choices.show"), "choices-beat");
  }

  function playDialogue(stage, scene) {
    if (!stage) return;
    applyDirection(stage, scene);
    applyDialogueEmphasis(stage, scene);
    restart(stage.querySelector(".dialogue-card:not([hidden])"), "dialogue-beat");
  }

  global.SceneMotion = Object.freeze({ play, playDialogue, applyDialogueEmphasis });
})(window);
