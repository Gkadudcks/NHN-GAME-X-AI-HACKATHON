"""Build intro-once/crossfaded-loop OGG files from the original BGM assets."""

from __future__ import annotations

import os
import subprocess
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
AUDIO = ROOT / "NAN_GAME_TITLE" / "assets" / "audio"
ORIGINAL = AUDIO / "original"
OUTPUT = AUDIO / "looped"
DEFAULT_FFMPEG = next(
    (ROOT / ".tools" / "python" / "imageio_ffmpeg" / "binaries").glob("ffmpeg*.exe"),
    None,
)

# start/end are musically similar boundaries selected by waveform, spectrum,
# loudness-envelope comparison, then rounded to stable edit points.
TRACKS = {
    "title": ("1. 기본 테마.wav", "title.ogg", 10.25, 31.75, 1.50),
    "daily": ("2. 일상.mp3", "daily.ogg", 7.75, 49.58, 1.50),
    "harin": ("3. 서하린과의 일상.mp3", "harin.ogg", 13.25, 53.58, 1.50),
    "overtime": ("4. 야근.mp3", "overtime.ogg", 16.50, 251.13, 1.50),
    "mystery": ("5. 추리.mp3", "mystery.ogg", 24.50, 206.00, 1.50),
    "minigame": ("MiniGame-theme.mp3", "minigame.ogg", 9.25, 128.74, 1.50),
    "happyEnding": ("주말에 시간 있어요 1차 엔딩.mp3", "happy-ending.ogg", 18.75, 124.45, 1.50),
    "middleEnding": ("중간 엔딩. 말하지 못한 마음.mp3", "middle-ending.ogg", 23.50, 218.21, 1.50),
    "badEnding": ("배드 엔딩. 계약 종료.mp3", "bad-ending.ogg", 4.00, 183.33, 1.50),
}


def build(ffmpeg: Path, source: Path, target: Path, start: float, end: float, crossfade: float) -> None:
    loop_start = start + crossfade
    fade_start = end - crossfade
    graph = (
        f"[0:a]asplit=4[intro][middle][tail][head];"
        f"[intro]atrim=0:{loop_start},asetpts=PTS-STARTPTS[i];"
        f"[middle]atrim={loop_start}:{fade_start},asetpts=PTS-STARTPTS[m];"
        f"[tail]atrim={fade_start}:{end},asetpts=PTS-STARTPTS,afade=t=out:st=0:d={crossfade}[t];"
        f"[head]atrim={start}:{loop_start},asetpts=PTS-STARTPTS,afade=t=in:st=0:d={crossfade}[h];"
        f"[t][h]amix=inputs=2:duration=longest:dropout_transition=0:normalize=0,asetpts=PTS-STARTPTS[x];"
        f"[i][m][x]concat=n=3:v=0:a=1[out]"
    )
    command = [
        str(ffmpeg), "-y", "-v", "warning", "-i", str(source),
        "-filter_complex", graph, "-map", "[out]", "-c:a", "libvorbis",
        "-q:a", "6", str(target),
    ]
    subprocess.run(command, check=True)


def main() -> None:
    ffmpeg = Path(os.environ.get("FFMPEG", DEFAULT_FFMPEG or "ffmpeg"))
    OUTPUT.mkdir(parents=True, exist_ok=True)
    for track_id, (source_name, output_name, start, end, crossfade) in TRACKS.items():
        build(ffmpeg, ORIGINAL / source_name, OUTPUT / output_name, start, end, crossfade)
        print(f"{track_id}: intro 0-{start + crossfade:.2f}s, loop {start + crossfade:.2f}-{end:.2f}s")


if __name__ == "__main__":
    main()
