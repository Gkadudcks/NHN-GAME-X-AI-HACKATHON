from __future__ import annotations

import math
import struct
import sys
import wave
from array import array
from pathlib import Path


def frame_peak(samples: array, channels: int, start: int, end: int) -> float:
    peak = 0.0
    for frame in range(start, end):
        offset = frame * channels
        for channel in range(channels):
            peak = max(peak, abs(samples[offset + channel]))
    return peak


def main() -> None:
    if len(sys.argv) != 4:
        raise SystemExit("usage: build-shared-headphones-loop.py <module-dir> <input.mp3> <output.wav>")

    module_dir = Path(sys.argv[1]).resolve()
    source = Path(sys.argv[2]).resolve()
    output = Path(sys.argv[3]).resolve()
    sys.path.insert(0, str(module_dir))

    import miniaudio

    decoded = miniaudio.decode_file(
        str(source),
        output_format=miniaudio.SampleFormat.FLOAT32,
        nchannels=2,
        sample_rate=44100,
    )
    samples = array("f", decoded.samples)
    channels = decoded.nchannels
    sample_rate = decoded.sample_rate
    total_frames = len(samples) // channels
    duration = total_frames / sample_rate

    trim_seconds = min(8.0, max(2.0, duration * 0.06))
    crossfade_seconds = min(6.0, max(3.0, duration * 0.045))
    start_frame = round(trim_seconds * sample_rate)
    end_frame = total_frames - start_frame
    crossfade_frames = round(crossfade_seconds * sample_rate)

    if end_frame - start_frame <= crossfade_frames * 3:
        raise RuntimeError("source audio is too short to build a stable loop")

    body_start = start_frame + crossfade_frames
    tail_start = end_frame - crossfade_frames
    loop_samples = array("f", samples[body_start * channels:tail_start * channels])

    for frame in range(crossfade_frames):
        progress = frame / max(1, crossfade_frames - 1)
        fade_out = math.cos(progress * math.pi / 2)
        fade_in = math.sin(progress * math.pi / 2)
        tail_offset = (tail_start + frame) * channels
        head_offset = (start_frame + frame) * channels
        for channel in range(channels):
            mixed = (
                samples[tail_offset + channel] * fade_out
                + samples[head_offset + channel] * fade_in
            )
            loop_samples.append(mixed)

    loop_frames = len(loop_samples) // channels
    peak = frame_peak(loop_samples, channels, 0, loop_frames)
    target_peak = 10 ** (-1.0 / 20.0)
    gain = min(1.0, target_peak / peak) if peak else 1.0

    output.parent.mkdir(parents=True, exist_ok=True)
    with wave.open(str(output), "wb") as wav:
        wav.setnchannels(channels)
        wav.setsampwidth(2)
        wav.setframerate(sample_rate)
        pcm = bytearray()
        for sample in loop_samples:
            value = max(-1.0, min(1.0, sample * gain))
            pcm.extend(struct.pack("<h", round(value * 32767)))
        wav.writeframes(pcm)

    print(f"source_duration={duration:.3f}s")
    print(f"trim={trim_seconds:.3f}s")
    print(f"crossfade={crossfade_seconds:.3f}s")
    print(f"loop_duration={loop_frames / sample_rate:.3f}s")
    print(f"output={output}")


if __name__ == "__main__":
    main()
