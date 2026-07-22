"""Find plausible intro/loop boundaries for the web game's BGM files.

This is a review aid, not an automatic approval step: it decodes audio with
FFmpeg, compares harmony/energy around possible crossfades, and prints the
best candidates for a human listening pass.
"""

from __future__ import annotations

import argparse
import os
import subprocess
from pathlib import Path

import numpy as np


ROOT = Path(__file__).resolve().parents[1]
DEFAULT_FFMPEG = next(
    (ROOT / ".tools" / "python" / "imageio_ffmpeg" / "binaries").glob("ffmpeg*.exe"),
    None,
)


def decode(path: Path, ffmpeg: Path, sample_rate: int) -> np.ndarray:
    command = [
        str(ffmpeg), "-v", "error", "-i", str(path), "-ac", "1", "-ar",
        str(sample_rate), "-f", "f32le", "-",
    ]
    result = subprocess.run(command, check=True, capture_output=True)
    return np.frombuffer(result.stdout, dtype="<f4")


def features(audio: np.ndarray, sample_rate: int, hop: int = 1024) -> tuple[np.ndarray, np.ndarray]:
    window_size = 4096
    usable = 1 + (len(audio) - window_size) // hop
    frames = np.lib.stride_tricks.sliding_window_view(audio, window_size)[::hop][:usable]
    spectrum = np.abs(np.fft.rfft(frames * np.hanning(window_size), axis=1)) + 1e-8
    frequencies = np.fft.rfftfreq(window_size, 1 / sample_rate)

    chroma = np.zeros((len(frames), 12), dtype=np.float64)
    valid = frequencies >= 55
    midi = np.rint(69 + 12 * np.log2(frequencies[valid] / 440)).astype(int)
    for pitch_class in range(12):
        chroma[:, pitch_class] = spectrum[:, valid][:, midi % 12 == pitch_class].sum(axis=1)
    chroma /= np.linalg.norm(chroma, axis=1, keepdims=True) + 1e-8

    edges = [55, 110, 220, 440, 880, 1760, 3520, 6000]
    bands = []
    for low, high in zip(edges, edges[1:]):
        mask = (frequencies >= low) & (frequencies < high)
        bands.append(np.log1p(spectrum[:, mask].mean(axis=1)))
    bands = np.stack(bands, axis=1)
    bands = (bands - bands.mean(axis=0)) / (bands.std(axis=0) + 1e-8)
    rms = np.sqrt(np.mean(frames * frames, axis=1) + 1e-10)
    return np.concatenate([chroma, bands], axis=1), rms


def candidates(feature: np.ndarray, rms: np.ndarray, duration: float, hop_seconds: float, crossfade: float):
    crossfade_frames = max(2, round(crossfade / hop_seconds))
    start_times = np.arange(4.0, min(25.0, duration * 0.38), 0.25)
    end_times = np.arange(max(duration * 0.62, 25.0), duration - max(2.0, crossfade), 0.25)
    scored = []

    for start in start_times:
        si = round(start / hop_seconds)
        head = feature[si:si + crossfade_frames]
        head_rms = rms[si:si + crossfade_frames]
        if len(head) < crossfade_frames:
            continue
        for end in end_times:
            if end - start < 20:
                continue
            ei = round(end / hop_seconds)
            tail = feature[ei - crossfade_frames:ei]
            tail_rms = rms[ei - crossfade_frames:ei]
            if len(tail) != len(head):
                continue
            # A crossfade works best when the overlapping harmony/timbre and
            # loudness envelopes are already similar.
            feature_cost = np.mean((head - tail) ** 2)
            level_cost = np.mean(np.abs(np.log(head_rms + 1e-6) - np.log(tail_rms + 1e-6)))
            edge_cost = abs(np.log(rms[si] + 1e-6) - np.log(rms[ei - 1] + 1e-6))
            score = feature_cost + 0.22 * level_cost + 0.12 * edge_cost
            scored.append((float(score), float(start), float(end)))

    selected = []
    for item in sorted(scored):
        if all(abs(item[1] - old[1]) > 1.0 or abs(item[2] - old[2]) > 1.0 for old in selected):
            selected.append(item)
        if len(selected) == 8:
            break
    return selected


def tempo_candidates(feature: np.ndarray, hop_seconds: float) -> list[tuple[float, float]]:
    flux = np.linalg.norm(np.diff(feature, axis=0), axis=1)
    flux -= flux.mean()
    options = []
    for bpm in np.arange(60.0, 181.0, 0.25):
        lag = max(1, round(60.0 / bpm / hop_seconds))
        correlation = float(np.dot(flux[:-lag], flux[lag:]))
        correlation /= float(np.linalg.norm(flux[:-lag]) * np.linalg.norm(flux[lag:]) + 1e-9)
        options.append((correlation, float(bpm)))
    selected = []
    for item in sorted(options, reverse=True):
        if all(abs(item[1] - old[1]) > 4 for old in selected):
            selected.append(item)
        if len(selected) == 5:
            break
    return selected


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("files", nargs="+")
    parser.add_argument("--ffmpeg", type=Path, default=Path(os.environ.get("FFMPEG", DEFAULT_FFMPEG or "ffmpeg")))
    parser.add_argument("--crossfade", type=float, default=1.5)
    args = parser.parse_args()
    sample_rate = 12000

    for raw_path in args.files:
        path = Path(raw_path)
        audio = decode(path, args.ffmpeg, sample_rate)
        duration = len(audio) / sample_rate
        feature, rms = features(audio, sample_rate)
        hop_seconds = 1024 / sample_rate
        print(f"\n{path.name} ({duration:.3f}s)")
        tempos = ", ".join(f"{bpm:.1f} ({score:.2f})" for score, bpm in tempo_candidates(feature, hop_seconds))
        print(f"  tempo candidates: {tempos}")
        for score, start, end in candidates(feature, rms, duration, hop_seconds, args.crossfade):
            print(f"  start={start:6.2f}s  end={end:7.2f}s  loop={end-start:7.2f}s  score={score:.4f}")


if __name__ == "__main__":
    main()
