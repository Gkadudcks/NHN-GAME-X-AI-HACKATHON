"""Generate the original DAY 5 presentation BGM and semantic sound effects."""

from __future__ import annotations

import math
import random
import wave
from array import array
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
AUDIO = ROOT / "assets" / "audio"
RATE = 22_050


def write_mono(path: Path, samples: list[float]) -> None:
    peak = max(1.0, max(abs(sample) for sample in samples) / 0.92)
    pcm = array("h", (int(max(-1, min(1, sample / peak)) * 32767) for sample in samples))
    with wave.open(str(path), "wb") as output:
        output.setnchannels(1)
        output.setsampwidth(2)
        output.setframerate(RATE)
        output.writeframes(pcm.tobytes())


def midi(note: int) -> float:
    return 440.0 * 2 ** ((note - 69) / 12)


def presentation_bgm() -> list[float]:
    bpm = 132
    beat = 60 / bpm
    duration = beat * 64
    total = round(duration * RATE)
    result = [0.0] * total
    progression = [
        (45, 48, 52, 57),  # A minor
        (41, 45, 48, 53),  # F
        (43, 47, 50, 55),  # G
        (40, 44, 47, 52),  # E minor
    ]
    rng = random.Random(50518)

    for index in range(total):
        time = index / RATE
        beat_position = time / beat
        beat_index = int(beat_position)
        bar = beat_index // 4
        chord = progression[bar % len(progression)]
        phase_in_beat = beat_position % 1

        # Wide, restrained pad.
        pad = 0.0
        for offset, note in enumerate(chord):
            frequency = midi(note)
            pad += math.sin(math.tau * frequency * time + offset * 0.7)
            pad += 0.32 * math.sin(math.tau * frequency * 2 * time + offset)
        pad *= 0.035

        # Fast sixteenth-note arpeggio creates a relentless presentation pulse.
        sixteenth = int(beat_position * 4)
        arp_note = chord[(sixteenth + bar) % len(chord)] + (24 if sixteenth % 4 == 3 else 12)
        arp_phase = (beat_position * 4) % 1
        arp_env = math.exp(-6.8 * arp_phase)
        arp_wave = math.sin(math.tau * midi(arp_note) * time)
        arp_wave += 0.25 * math.sin(math.tau * midi(arp_note) * 2 * time)
        arp = arp_wave * arp_env * 0.13

        # Low pulse on every beat, stronger at each bar.
        bass_env = math.exp(-6.5 * phase_in_beat)
        bass_frequency = midi(chord[0] - 12)
        bass = (
            math.sin(math.tau * bass_frequency * time)
            + 0.38 * math.sin(math.tau * bass_frequency * 2 * time)
        ) * bass_env * (0.2 if beat_index % 4 == 0 else 0.135)

        # Kick, backbeat, and rapid hats make the loop substantially more dynamic.
        kick_phase = phase_in_beat
        kick_pitch = 110 * math.exp(-18 * kick_phase) + 43
        kick = math.sin(math.tau * kick_pitch * time) * math.exp(-12 * kick_phase) * 0.28
        half_beat = (beat_position * 2) % 1
        hat = (rng.random() * 2 - 1) * math.exp(-32 * half_beat) * 0.052
        backbeat_phase = (beat_position - 1) % 2
        snare = (rng.random() * 2 - 1) * math.exp(-18 * backbeat_phase) * 0.12

        # Four-bar tension swell with a minor-second layer.
        phrase = (beat_position % 16) / 16
        tension = math.sin(math.pi * phrase) ** 2
        high = (
            math.sin(math.tau * midi(chord[2] + 24) * time)
            + 0.52 * math.sin(math.tau * midi(chord[2] + 25) * time)
        ) * tension * 0.024
        result[index] = math.tanh((pad + arp + bass + kick + hat + snare + high) * 1.5)

    fade = round(RATE * 0.045)
    for index in range(fade):
        gain = math.sin((index / fade) * math.pi / 2) ** 2
        result[index] *= gain
        result[-1 - index] *= gain
    return result


def error_discovery_sfx() -> list[float]:
    duration = 1.55
    total = round(duration * RATE)
    rng = random.Random(127)
    result = []
    for index in range(total):
        time = index / RATE
        fall = 740 * math.exp(-2.8 * time) + 82
        impact = math.exp(-5.8 * time)
        alarm = math.sin(math.tau * fall * time) * impact
        low = math.sin(math.tau * (68 - 12 * min(time, 1)) * time) * math.exp(-2.8 * time)
        siren_env = (1 - math.exp(-8 * time)) * math.exp(-1.8 * time)
        siren = (
            math.sin(math.tau * 221 * time + 2.2 * math.sin(math.tau * 3.2 * time))
            + math.sin(math.tau * 233 * time)
        ) * siren_env
        metallic = math.sin(math.tau * 1260 * time) * math.exp(-7 * time)
        noise = (rng.random() * 2 - 1) * math.exp(-10 * time)
        result.append(math.tanh(alarm * 0.48 + low * 0.52 + siren * 0.2 + metallic * 0.1 + noise * 0.18))
    return result


def flash_transition_sfx() -> list[float]:
    duration = 0.34
    total = round(duration * RATE)
    rng = random.Random(184)
    result = []
    for index in range(total):
        time = index / RATE
        snap = (rng.random() * 2 - 1) * math.exp(-28 * time)
        sweep_frequency = 420 + 2_400 * (time / duration) ** 1.7
        sweep = math.sin(math.tau * sweep_frequency * time) * math.sin(math.pi * time / duration) ** 2
        shimmer = math.sin(math.tau * 3_100 * time) * math.exp(-12 * time)
        result.append(math.tanh(snap * 0.46 + sweep * 0.22 + shimmer * 0.12))
    return result


def evaluator_suspicion_sfx() -> list[float]:
    duration = 2.0
    total = round(duration * RATE)
    rng = random.Random(127)
    result = []
    noise_state = 0.0
    question_phase = 0.0
    shadow_phase = 0.0
    for index in range(total):
        time = index / RATE
        # An audible mid-range "띠용?" bends upward, then sags out of tune.
        if time < 0.34:
            question_frequency = 318 + 172 * (time / 0.34) ** 0.68
        else:
            question_frequency = 490 - 218 * min(1, (time - 0.34) / 0.72) ** 0.82
        question_phase += math.tau * question_frequency / RATE
        question_envelope = (1 - math.exp(-75 * time)) * math.exp(-2.15 * time)
        question = (
            math.sin(question_phase)
            + 0.34 * math.sin(question_phase * 2.01 + 0.2)
            + 0.12 * math.sin(question_phase * 3.98)
        ) * question_envelope

        # A low, detuned shadow keeps the gesture awkward and serious rather than comic.
        shadow_time = max(0.0, time - 0.16)
        shadow_frequency = 116 - 18 * min(1, shadow_time / 1.5)
        shadow_phase += math.tau * shadow_frequency / RATE
        shadow_attack = 1 - math.exp(-9 * shadow_time)
        shadow_release = max(0.0, min(1.0, (duration - time) / 0.5)) ** 1.5
        shadow = (
            math.sin(shadow_phase)
            + 0.52 * math.sin(shadow_phase * math.sqrt(2) + 0.45)
        ) * shadow_attack * shadow_release

        metallic = (
            math.sin(math.tau * 673 * time + 0.9)
            + 0.55 * math.sin(math.tau * 708 * time)
        ) * math.exp(-3.8 * time) * (1 - math.exp(-80 * time))

        noise_state += ((rng.random() * 2 - 1) - noise_state) * 0.022
        air = noise_state * math.sin(math.pi * min(1, time / 1.45)) ** 2
        air *= max(0.0, min(1.0, (1.78 - time) / 0.38))

        sample = question * 0.42 + shadow * 0.18 + metallic * 0.075 + air * 0.34
        result.append(math.tanh(sample * 1.18))
    return result


def evidence_match_sfx() -> list[float]:
    duration = 0.58
    total = round(duration * RATE)
    notes = [(0.00, 659.25), (0.105, 783.99), (0.215, 987.77)]
    result = [0.0] * total
    for start, frequency in notes:
        start_index = round(start * RATE)
        for index in range(start_index, total):
            time = (index - start_index) / RATE
            if time > 0.28:
                break
            envelope = (1 - math.exp(-90 * time)) * math.exp(-10 * time)
            bell = math.sin(math.tau * frequency * time)
            bell += 0.34 * math.sin(math.tau * frequency * 2.01 * time)
            result[index] += bell * envelope * 0.25
    return [math.tanh(sample) for sample in result]


def main() -> None:
    looped = AUDIO / "looped"
    looped.mkdir(parents=True, exist_ok=True)
    write_mono(looped / "day5-presentation-dynamic-v2.wav", presentation_bgm())
    write_mono(AUDIO / "day5-error-discovery-v2.wav", error_discovery_sfx())
    write_mono(AUDIO / "day5-flash-transition.wav", flash_transition_sfx())
    write_mono(AUDIO / "day5-evaluator-awkward-sting-v3.wav", evaluator_suspicion_sfx())
    write_mono(AUDIO / "day5-evidence-match.wav", evidence_match_sfx())


if __name__ == "__main__":
    main()
