# BGM 루프 제작 및 재생

## 구조

원본 BGM은 `NAN_GAME_TITLE/assets/audio/original/`에 보관한다. 각 편집본은
`도입부 + 루프 본체 + 끝/시작 크로스페이드`가 한 OGG 파일에 들어 있다.
게임은 처음에는 0초부터 재생하고, 첫 재생이 루프 끝에 도달하면 도입부를 제외한
`loopStart` 지점으로 돌아간다. 원본 음원은 수정하지 않는다.

편집본은 `NAN_GAME_TITLE/assets/audio/looped/`에 생성한다. 반복 지점과 1.5초
크로스페이드 값은 `scripts/build_bgm_loops.py`, 런타임의 `loopStart` 값은
`NAN_GAME_TITLE/js/bgm-manager.js`에서 함께 관리한다.

## 다시 생성하기

FFmpeg가 PATH에 있으면 다음 명령으로 전체 편집본을 다시 만든다.

```powershell
python scripts/build_bgm_loops.py
```

FFmpeg가 다른 위치에 있으면 `FFMPEG` 환경 변수로 실행 파일 경로를 지정한다.
후보 지점을 다시 계산할 때는 NumPy가 있는 Python에서 다음 스크립트를 사용한다.

```powershell
python scripts/analyze_bgm_loops.py "NAN_GAME_TITLE/assets/audio/original/2. 일상.mp3"
```

자동 분석 결과는 최종 승인이 아니다. 편집본을 게임에서 10회 이상 반복 재생하며
박자, 화음, 잔향, 클릭, 음량 변화를 헤드폰과 스피커로 확인한다.

게임 진행 없이 빠르게 확인하려면 로컬 서버에서 `bgm-loop-review.html`을 연다.
`경계 5초 전부터 듣기`는 곡의 마지막 5초를 재생한 뒤 실제 `loopStart`로 이동해
8초를 더 들려준다. 전환 전에는 카운트다운을 표시하고 전환 순간에는 화면을 점멸해,
경계가 들리지 않더라도 정확히 어느 순간에 반복됐는지 확인할 수 있다. 일반 MP3
플레이어로는 이 게임 전용 반복 지점을 재현할 수 없다.

## 의존성 및 권한 문제 기록

- 2026-07-20: 작업 환경에 FFmpeg와 `winget`이 없었다. 시스템 전역 설치 대신
  `imageio-ffmpeg`를 프로젝트의 `.tools/python` 아래 설치해 사용했고 `.tools/`는
  Git에서 제외했다. 같은 상황에서는 `python -m pip install imageio-ffmpeg
  --target .tools/python`으로 복구할 수 있다.
- 2026-07-20: FFmpeg `acrossfade`에 입력 길이와 페이드 길이를 똑같이 주면 샘플
  반올림 때문에 필터 출력이 비어 편집본 끝 1.5초가 누락됐다. 빌드 스크립트는
  `afade` 두 개와 `amix`를 사용하도록 바꿨으며, 생성 후 각 파일 길이가 설정된
  루프 종료 시각과 일치하는지 확인해야 한다.
- MP3의 인코더 지연과 HTML `<audio loop>`의 전체 파일 반복은 도입부 재진입이나
  짧은 공백을 만들 수 있다. 편집본은 OGG로 만들고 Web Audio의 `loopStart`를
  사용해 도입부를 한 번만 재생한다.
- 브라우저 자동재생 정책상 첫 사용자 입력 전에는 오디오 컨텍스트가 정지될 수 있다.
  화면의 첫 포인터 또는 키 입력에서 `resume()`을 다시 호출한다.
