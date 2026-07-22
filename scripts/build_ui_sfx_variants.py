"""Build quiet, deterministic UI click candidates without external dependencies."""

from __future__ import annotations

import math
import random
import struct
import wave
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "NAN_GAME_TITLE" / "assets" / "audio"
RATE = 44_100


def envelope(time: float, attack: float, decay: float) -> float:
    rise = min(1.0, time / attack) if attack else 1.0
    return rise * math.exp(-time / decay)


def tone(time: float, frequency: float, decay: float, phase: float = 0.0) -> float:
    return math.sin(2 * math.pi * frequency * time + phase) * math.exp(-time / decay)


def render(name: str, duration: float, peak: float, sample_fn) -> None:
    values = [sample_fn(index / RATE, index) for index in range(round(duration * RATE))]
    maximum = max(abs(value) for value in values) or 1.0
    scale = peak / maximum
    frames = b"".join(struct.pack("<h", round(max(-1, min(1, value * scale)) * 32767)) for value in values)
    with wave.open(str(OUTPUT / name), "wb") as output:
        output.setnchannels(1)
        output.setsampwidth(2)
        output.setframerate(RATE)
        output.writeframes(frames)


def main() -> None:
    randomizer = random.Random(20260723)
    noise = [randomizer.uniform(-1, 1) for _ in range(round(0.11 * RATE))]
    smoothed = []
    previous = 0.0
    for value in noise:
        previous = previous * 0.72 + value * 0.28
        smoothed.append(previous)

    render(
        "ui-click-soft.wav",
        0.055,
        0.13,
        lambda t, _i: envelope(t, 0.002, 0.017) * (tone(t, 980, 0.022) + 0.38 * tone(t, 640, 0.03)),
    )
    render(
        "ui-click-warm.wav",
        0.078,
        0.15,
        lambda t, _i: envelope(t, 0.0025, 0.025) * (tone(t, 430, 0.034) + 0.46 * tone(t, 760, 0.021, 0.4)),
    )
    # v2는 기존 파형을 늘이지 않고 같은 음역의 감쇠음을 다시 합성한다.
    render(
        "ui-click-soft-v2.wav",
        0.072,
        0.16,
        lambda t, _i: envelope(t, 0.0022, 0.024) * (tone(t, 920, 0.034) + 0.4 * tone(t, 580, 0.044, 0.16)),
    )
    render(
        "ui-click-warm-v2.wav",
        0.098,
        0.17,
        lambda t, _i: envelope(t, 0.0028, 0.034) * (tone(t, 410, 0.049) + 0.43 * tone(t, 690, 0.035, 0.38) + 0.12 * tone(t, 980, 0.025)),
    )
    render(
        "ui-click-paper.wav",
        0.068,
        0.12,
        lambda t, i: envelope(t, 0.0015, 0.018) * (0.7 * smoothed[i] + 0.24 * tone(t, 820, 0.02)),
    )
    render(
        "ui-click-glass.wav",
        0.096,
        0.10,
        lambda t, _i: envelope(t, 0.001, 0.032) * (tone(t, 1760, 0.04) + 0.35 * tone(t, 2380, 0.026)),
    )


if __name__ == "__main__":
    main()
