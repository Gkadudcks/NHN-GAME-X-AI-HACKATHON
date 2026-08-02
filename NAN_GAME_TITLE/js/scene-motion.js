(function (global) {
  "use strict";

  const EMOTIONS = ["surprised", "nervous", "happy", "embarrassed", "angry", "sad", "determined"];
  const CAMERAS = ["focus", "tension", "impact", "romance", "reveal"];
  const EFFECTS = ["discovery", "document-impact", "decision-focus", "mic-live", "dinner-evening"];
  const CHARACTER_BOUNDS = Object.freeze([
    ["boss_holding_cup_concerned_", 1398 / 1536, 61 / 1536],
    ["harin_arms_folded_concerned_", 1474 / 1536, 40 / 1536],
    ["harin_hand_to_chest_surprised_", 1433 / 1536, 72 / 1536],
    ["harin_holding_cup_tired_", 1433 / 1536, 61 / 1536],
    ["harin_relaxed_standing_embarrassed_", 1347 / 1536, 164 / 1536],
    ["harin_relaxed_standing_gentle_smile_", 1437 / 1536, 73 / 1536],
    ["harin_relaxed_standing_neutral_", 1306 / 1536, 202 / 1536],
    ["minjae_relaxed_standing_gentle_smile_", 1501 / 1536, 21 / 1536],
    ["sea_neutral_standing_gentle_smile_", 1453 / 1536, 41 / 1536],
    ["boss-standing.png", 1700 / 1800, 50 / 1800],
    ["harin-evening-standing.png", 1700 / 1800, 50 / 1800],
    ["harin-standing.png", 1700 / 1800, 50 / 1800],
    ["minjae-standing.png", 1700 / 1800, 50 / 1800],
    ["sea-standing.png", 1700 / 1800, 50 / 1800],
  ]);

  function restart(element, className) {
    if (!element) return;
    element.classList.remove(className);
    void element.offsetWidth;
    element.classList.add(className);
  }

  function dialogueEmphasisMatches(source, scene = {}) {
    const phrases = (Array.isArray(scene.emphasis) ? scene.emphasis : [scene.emphasis])
      .filter((phrase) => typeof phrase === "string" && phrase.length);
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
    return usable;
  }

  function applyDialogueEmphasis(stage, scene = {}) {
    const dialogue = stage.querySelector(".dialogue-card #dialogue");
    if (!dialogue || !dialogue.textContent) return;
    const source = dialogue.textContent;
    const usable = dialogueEmphasisMatches(source, scene);
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

  function prepareProgressiveDialogue(stage, scene = {}, source = "") {
    const dialogue = stage.querySelector(".dialogue-card #dialogue");
    if (!dialogue) return null;
    const matches = dialogueEmphasisMatches(source, scene);
    const segments = [];
    let cursor = 0;
    matches.forEach((match, index) => {
      if (match.start > cursor) segments.push({ start: cursor, end: match.start, node: document.createTextNode("") });
      const mark = document.createElement("strong");
      mark.style.setProperty("--emphasis-index", index);
      segments.push({ start: match.start, end: match.end, node: mark, emphasis: true });
      cursor = match.end;
    });
    if (cursor < source.length || !segments.length) {
      segments.push({ start: cursor, end: source.length, node: document.createTextNode("") });
    }
    dialogue.replaceChildren(...segments.map((segment) => segment.node));
    return (visibleLength) => {
      segments.forEach((segment) => {
        const revealedEnd = Math.min(segment.end, Math.max(segment.start, visibleLength));
        segment.node.textContent = source.slice(segment.start, revealedEnd);
        if (segment.emphasis && visibleLength >= segment.end) {
          segment.node.classList.add("dialogue-emphasis");
        }
      });
    };
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

  function alignCharacterFeet(stage) {
    stage.querySelectorAll(".character:not(.character-nanabot)").forEach((character) => {
      const source = character.getAttribute("src") || "";
      const bounds = CHARACTER_BOUNDS.find(([assetName]) => source.includes(assetName));
      const declaredHeight = Number.parseFloat(character.dataset.declaredHeight || character.style.getPropertyValue("--sprite-height")) || 84;
      character.dataset.declaredHeight = String(declaredHeight);
      const spriteHeight = bounds ? declaredHeight / bounds[1] : declaredHeight;
      const offset = bounds ? -(spriteHeight * bounds[2]) : 0;
      character.style.setProperty("--sprite-height", `${spriteHeight.toFixed(3)}cqh`);
      character.style.setProperty("--foot-baseline-offset", `${offset.toFixed(3)}cqh`);
    });
  }

  function clearTransientCharacterMotion(stage) {
    stage.querySelectorAll(".character").forEach((character) => {
      character.classList.remove("speaker-beat", "emotion-beat", "emotion-recover");
    });
  }

  function installCharacterMotionCleanup(stage) {
    if (stage.dataset.characterMotionCleanup === "true") return;
    stage.dataset.characterMotionCleanup = "true";
    stage.addEventListener("animationend", (event) => {
      const character = event.target.closest?.(".character");
      if (!character || !stage.contains(character)) return;
      character.classList.remove("speaker-beat", "emotion-beat", "emotion-recover");
    });
  }

  function play(stage, scene) {
    if (!stage) return;
    installCharacterMotionCleanup(stage);
    clearTransientCharacterMotion(stage);
    alignCharacterFeet(stage);
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
    installCharacterMotionCleanup(stage);
    clearTransientCharacterMotion(stage);
    alignCharacterFeet(stage);
    applyDirection(stage, scene);
    applyDialogueEmphasis(stage, scene);
    restart(stage.querySelector(".dialogue-card:not([hidden])"), "dialogue-beat");
  }

  global.SceneMotion = Object.freeze({ play, playDialogue, applyDialogueEmphasis, prepareProgressiveDialogue });
})(window);
