---
name: "NAN DAY 4 Office Escape"
description: "A threshold-driven Korean office runner for the DAY 4 minigame world."
colors:
  night-shift-navy: "#101c2f"
  night-deep: "#080f1c"
  elevator-ivory: "#f3e8cd"
  exit-green: "#24c982"
  warning-orange: "#ff8a1f"
  impact-red: "#f04455"
  smoked-glass: "rgba(87, 111, 131, .34)"
typography:
  display:
    fontFamily: "Pretendard, 'Noto Sans KR', system-ui, sans-serif"
    fontSize: "clamp(40px, 5vw, 64px)"
    fontWeight: 900
    lineHeight: 1.02
    letterSpacing: "-.02em"
  headline:
    fontFamily: "Pretendard, 'Noto Sans KR', system-ui, sans-serif"
    fontSize: "24px"
    fontWeight: 900
    lineHeight: 1.1
    letterSpacing: "-.02em"
  body:
    fontFamily: "Pretendard, 'Noto Sans KR', system-ui, sans-serif"
    fontSize: "16px"
    lineHeight: 1.68
  label:
    fontFamily: "Pretendard, 'Noto Sans KR', system-ui, sans-serif"
    fontSize: "12px"
    fontWeight: 750
rounded:
  alert: "2px"
  cta: "4px"
  action: "7px"
  shell: "8px"
  round: "50%"
spacing:
  compact: "8px"
  control-inset: "14px"
  hud-inset: "20px"
components:
  action-control:
    backgroundColor: "{colors.night-deep}"
    textColor: "{colors.elevator-ivory}"
    rounded: "{rounded.action}"
    padding: "0 {spacing.control-inset}"
    height: "60px"
  action-control-pressed:
    backgroundColor: "{colors.warning-orange}"
    textColor: "{colors.night-shift-navy}"
    rounded: "{rounded.action}"
    height: "60px"
  exit-cta:
    backgroundColor: "{colors.exit-green}"
    textColor: "{colors.night-shift-navy}"
    rounded: "{rounded.cta}"
    padding: "15px 24px"
  status-hud:
    backgroundColor: "{colors.night-deep}"
    textColor: "{colors.elevator-ivory}"
    height: "64px"
---

# Design System: NAN DAY 4 Office Escape

## Overview

**Creative North Star: "17:58 Threshold Rush"**

This system belongs only to the DAY 4 `부장님 피해서 퇴근하기` minigame world, not to NAN's visual-novel or story UI. It makes a single continuous office escape legible: Doyun stays grounded near the left third while hazards, landmarks, and thresholds advance from the right toward the elevator.

Night Shift Navy, Elevator Ivory, Exit Green, and Warning Orange establish a late-office emergency wayfinding world. Smoked glass, dim approved office backdrops, and floor seams produce layered photographic depth; the interface remains a game instrument, never a static-background web dashboard.

**Key Characteristics:**

- Compact 64px status HUD above a predominantly playable world.
- Physical portal and floor-line thresholds that pass the player instead of merely changing a scene.
- Tactile emergency wayfinding: square-edged labels, bright route marks, and clear action states.
- Fixed player framing, grounded shadows, and staged boss/Harin depth that make pursuit readable.

## Colors

The palette reserves light for urgent wayfinding and legibility against a deep, desaturated office night.

### Primary

- **Exit Green:** Marks viable route progress, collected items, assistance, and the final escape threshold.

### Secondary

- **Warning Orange:** Announces hazards, clearance, active control input, and the warm-to-safe direction of travel.

### Tertiary

- **Impact Red:** Appears only for escalating pursuit risk and confirmed collision feedback.

### Neutral

- **Night Shift Navy:** The active game-field and dark text base for high-contrast bright states.
- **Night Deep:** The HUD, shell, smoked overlay, and control surface that contains the world without turning it into cards.
- **Elevator Ivory:** The warm readable type, route chrome, and thin structural rule color.
- **Smoked Glass:** The translucent office-separation material for depth, not a generic panel fill.

### Named Rules

**The Exit Line Rule.** Carry the direction of escape through a floor-adjacent progression from Warning Orange to Exit Green; do not replace it with a detached dashboard progress treatment.

**The Impact Reserve Rule.** Impact Red belongs to danger escalation and collision only; normal calls to action remain Exit Green or Warning Orange.

## Typography

**Display Font:** Pretendard (with Noto Sans KR and system-ui fallbacks)

**Body Font:** Pretendard (with Noto Sans KR and system-ui fallbacks)

**Character:** Heavy Korean sans labels make the limited input vocabulary instantly scannable. Large numerals are compact and tabular where route progress changes, while explanatory copy stays restrained.

### Hierarchy

- **Display:** Used for the intro time and title, with a tight, urgent headline silhouette.
- **Headline:** Used for the HUD clock, outcome marks, and action labels that must be read during play.
- **Body:** Used for the intro explanation and result copy; keep it to the established short, readable measure.
- **Label:** Used for route zones, HUD descriptors, pickup marks, and compact status information.

### Named Rules

**The Two-Verb Rule.** In active play, emphasize only the two player verbs—jump and slide—so the visual hierarchy never competes with the action decision.

## Layout

The shell holds a 64px HUD followed by the game course, so the first desktop viewport is overwhelmingly world rather than UI. The HUD uses a three-part danger / route / item arrangement; its central route becomes a compact two-column track on small screens while pickup marks hide.

Doyun's screen position is fixed at about 32% of course width, and world objects, portals, and the elevator pass through a shared ground baseline. Far atmosphere, office depth, and floor/hazard layers move at distinct rates (0.15×, 0.4×, and 1.0× respectively). At 850px and below, the shell becomes edge-to-edge, the HUD drops to 56px, and the footer becomes a 78px action dock with two equal controls; compact landscape further reduces it to 72px with 48px controls.

**The Threshold-Rhythm Rule.** Zone changes must be communicated by physical doorway, corridor, gate, or elevator thresholds crossing the shared world projection—not by a whole-screen swap or a card transition.

## Elevation & Depth

Depth is layered and photographic rather than card-based: dim approved backdrops, a smoked-glass mid layer, office geometry, and floor seams establish distance before shadows reinforce contact. The dark shell and HUD use soft containment shadows; characters, hazards, and pickups use grounded shadows that keep their visual feet aligned with collision space.

### Shadow Vocabulary

- **Shell containment** (`0 28px 80px rgba(0, 0, 0, .58), 0 8px 20px rgba(0, 0, 0, .36)`): Frames the desktop game without introducing floating interior cards.
- **HUD separation** (`0 7px 18px rgba(0, 0, 0, .28)`): Keeps route information legible over the moving world.
- **Ground contact** (`drop-shadow(0 8px 5px rgba(3, 7, 13, .5))`): Grounds obstacle art; character artwork uses the closely matched deeper contact shadow.
- **Tactile message offset** (`6px 7px 0 rgba(3, 8, 15, .38)`): Gives live feedback and Harin's callout a brief physical stamp.

### Named Rules

**The Grounded Depth Rule.** Use tonal parallax and floor contact before adding surface lift; a floating dashboard card is not a substitute for world depth.

## Shapes

Forms are deliberately firm: thin ivory rules, square route tracks, and alert diamonds communicate office emergency wayfinding. Tiny alert and CTA corners are nearly square, actions are softly practical rather than pill-shaped, and circles are reserved for route nodes, pickups, spotlights, and collision-adjacent marks. The shell alone receives the broader corner that frames the game on desktop; it drops away edge-to-edge on mobile.

## Components

### Status HUD

The status HUD is a single continuous instrument, not a row of cards.

- **Structure:** 64px three-part danger / route / pickup bar; the route contains the clock, percentage, three zones, and a line-and-node progress indicator.
- **Route state:** The active node and progress head use Exit Green; the route begins in Warning Orange and moves toward green.
- **Mobile:** At 850px the HUD is 56px, pickups hide, and textual density reduces without hiding route progress.

### Action Controls

The two action controls are direct, tactile inputs rather than toolbar buttons.

- **Shape:** Practical rounded corners and a full 60px height on desktop; they become equal-width 52px mobile buttons and 48px compact-landscape buttons.
- **Default:** Dark smoked control surface with Elevator Ivory label, icon, and key cue.
- **Pressed / Focus:** Pressed state turns Warning Orange and shifts down; visible keyboard focus uses a 3px Exit Green outline.

### Escape CTA

The intro and result continuation use a single Exit Green action with dark type and a short hard shadow. Hover and focus lighten the green; the action remains an exit signal rather than a coral or pink generic primary button.

### Pursuit Alert & Route Nodes

The boss-distance signal uses a rotated, near-square warning frame. Its warning state is orange and its escalating states move to Impact Red; route nodes are circular and glow only when active.

### World Thresholds

Landmarks are translucent framed office portals with ivory rules and a floor-aligned crossing mark. The security/elevator endpoint inherits Exit Green; all thresholds move through the same world-space projection as hazards.

### Telegraph, Feedback & Assistance

Telegraphs attach to the upcoming hazard with large Warning Orange symbol and action text. Live feedback is a compact dark stamp; collection and Harin assistance use Exit Green, while a hit uses Impact Red. Harin's assist callout remains ivory with a green edge and a short dark offset.

## Do's and Don'ts

### Do:

- **Do** keep Doyun fixed near the left third and move hazards, landmarks, and the exit through the shared floor baseline.
- **Do** use the orange-to-green floor line and route indicator to make the course's escape direction visible at a glance.
- **Do** use layered approved backdrops, smoked glass, and grounded shadows to show office depth.
- **Do** retain both jump and slide as immediately visible, keyboard-focusable, touch-sized controls.

### Don't:

- **Don't** turn the active course into a static office image with dashboard cards layered on top.
- **Don't** use the elevator as a permanent background object; make it a destination threshold that arrives in world space.
- **Don't** use Impact Red as a decorative accent or use bright color to obscure obstacle clearance.
- **Don't** let perspective decoration, effect placement, or visual art change collision geometry.
