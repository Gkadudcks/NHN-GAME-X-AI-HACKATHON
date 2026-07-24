# Project TODO

## Settings follow-up

- Implement the saved `dialogueMode` setting so auto progression advances story text only after its full reveal and always stops for choices, overlays, and unread clue confirmations.
- Implement the saved `textSpeed` setting in every DAY story renderer, including instant/fast/normal/slow reveal timings and accessibility-safe defaults.
- Connect the existing `autoDelay` value to the implemented auto progression timing after the two items above are complete.

### Current scope

The global settings dialog currently applies volume, text size, dialogue opacity, reduced effects, and screen mode immediately. Auto progression, text speed, and auto-delay are intentionally not exposed as active controls until the DAY renderers support them consistently.
