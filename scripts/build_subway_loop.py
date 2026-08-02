from __future__ import annotations

import array
import shutil
import sys
import tempfile
import wave
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TOOLS = ROOT / "tmp" / "audio-tools"
sys.path.insert(0, str(TOOLS))

import miniaudio  # noqa: E402

SOURCE = ROOT / "NAN_GAME_TITLE" / "assets" / "audio" / "original" / "subway-ride-pixabay-57289.mp3"
OUTPUT = ROOT / "NAN_GAME_TITLE" / "assets" / "audio" / "looped" / "subway-ride-pixabay-57289-rail-only-v2.wav"
START_SECONDS = 43
BODY_SECONDS = 30
CROSSFADE_SECONDS = 2
SAMPLE_RATE = 44_100
CHANNELS = 2


def main() -> None:
    decode_source = Path(tempfile.gettempdir()) / "nan-subway-source-57289.mp3"
    shutil.copyfile(SOURCE, decode_source)
    decoded = miniaudio.decode_file(
        str(decode_source),
        output_format=miniaudio.SampleFormat.SIGNED16,
        nchannels=CHANNELS,
        sample_rate=SAMPLE_RATE,
    )
    samples = array.array("h", decoded.samples)
    frame_start = START_SECONDS * SAMPLE_RATE
    source_frames = BODY_SECONDS + CROSSFADE_SECONDS
    frame_end = frame_start + source_frames * SAMPLE_RATE
    segment = samples[frame_start * CHANNELS : frame_end * CHANNELS]
    expected = source_frames * SAMPLE_RATE * CHANNELS
    if len(segment) != expected:
        raise RuntimeError(f"Expected {expected} samples, got {len(segment)}")

    # Announcements and speech are predominantly centered in the stereo field.
    # Preserve the low-frequency center rumble, but use the side channel for
    # the audible mid/high range so rail movement remains without clear words.
    rail_only = array.array("h")
    low_mid = 0.0
    cutoff_hz = 220.0
    alpha = 1.0 - pow(2.718281828, -2.0 * 3.141592654 * cutoff_hz / SAMPLE_RATE)
    for frame in range(source_frames * SAMPLE_RATE):
        left = segment[frame * CHANNELS]
        right = segment[frame * CHANNELS + 1]
        mid = (left + right) * 0.5
        side = (left - right) * 0.5
        low_mid += alpha * (mid - low_mid)
        out_left = round(low_mid * 0.9 + side * 1.45)
        out_right = round(low_mid * 0.9 - side * 1.45)
        rail_only.append(max(-32768, min(32767, out_left)))
        rail_only.append(max(-32768, min(32767, out_right)))
    segment = rail_only

    fade_frames = CROSSFADE_SECONDS * SAMPLE_RATE
    body_frames = BODY_SECONDS * SAMPLE_RATE
    output = array.array("h")

    # Crossfade tail -> head, then continue from the head into the middle.
    # The resulting loop begins where the source tail begins and ends at that
    # same point, avoiding a click at the wrap boundary.
    for frame in range(fade_frames):
        t = frame / max(1, fade_frames - 1)
        head_frame = frame
        tail_frame = body_frames + frame
        for channel in range(CHANNELS):
            head = segment[head_frame * CHANNELS + channel]
            tail = segment[tail_frame * CHANNELS + channel]
            mixed = round(tail * (1.0 - t) + head * t)
            output.append(max(-32768, min(32767, mixed)))

    output.extend(segment[fade_frames * CHANNELS : body_frames * CHANNELS])

    with wave.open(str(OUTPUT), "wb") as wav:
        wav.setnchannels(CHANNELS)
        wav.setsampwidth(2)
        wav.setframerate(SAMPLE_RATE)
        wav.writeframes(output.tobytes())
    decode_source.unlink(missing_ok=True)

    print(f"Created {OUTPUT} ({len(output) / CHANNELS / SAMPLE_RATE:.2f}s)")


if __name__ == "__main__":
    main()
