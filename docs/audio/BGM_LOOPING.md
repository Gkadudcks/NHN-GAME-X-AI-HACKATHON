# BGM 루프 재생과 편집

## 런타임 구조

- HTTP/HTTPS 실행: Web Audio가 `source`를 한 번 디코딩하고 `loopStart`부터 샘플 단위로 반복한다.
- `file://` 직접 실행: 브라우저의 로컬 파일 `fetch()` 제한을 피하기 위해 HTML Audio를 쓴다.
  인트로가 든 `source`를 한 번 재생한 뒤 `loopSource`로 전환하고, 반복 구간 전용 OGG는
  브라우저의 기본 `loop`로 반복한다.
- 현재 재생 엔진은 `BGMManager.backend`의 `webaudio` 또는 `html`로 명시한다. 재개·일시정지는
  이 값을 기준으로 실제 사용 중인 엔진에 전달한다.
- 게임 시작 때 현재 Day에서 사용할 가능성이 있는 곡을 미리 디코딩하거나 프리로드한다.

`NAN_GAME_TITLE/js/bgm-manager.js`의 각 트랙에는 다음 값이 함께 있어야 한다.

- `source`: 인트로 1회 + 크로스페이드된 반복 본체
- `loopSource`: 반복 본체만 든 `*-loop.ogg`
- `loopStart`: `source`에서 반복을 시작할 초 단위 위치

## 편집본 생성

원본은 `NAN_GAME_TITLE/assets/audio/original/`을 우선 사용한다. 보관 폴더가 없는 기존 저장소는
같은 이름의 `NAN_GAME_TITLE/assets/audio/` 파일을 읽는다. 원본 파일은 수정하지 않는다.

```powershell
python scripts/build_bgm_loops.py
```

현재 인트로 편집본을 유지하고 직접 실행용 반복 파일만 다시 만들려면:

```powershell
python scripts/build_bgm_loops.py --fallback-only
```

특정 곡을 새 버전으로 비파괴 생성하려면:

```powershell
python scripts/build_bgm_loops.py --track daily --suffix v2
```

자동 분석은 후보를 좁히는 용도다. 파형 유사도뿐 아니라 박/마디 끝과 구문이 맞는지 듣고 결정한다.

```powershell
python scripts/analyze_bgm_loops.py "NAN_GAME_TITLE/assets/audio/2. 일상.mp3"
```

`NAN_GAME_TITLE/bgm-loop-review.html`에서는 일상곡 기존판/개선판, Web Audio 경계,
직접 실행용 기본 루프를 각각 들을 수 있다.

## 일상곡 v2 결정 기록

- 원본 분석의 상위 후보는 `7.75–49.58초`와 `7.50–47.83초`였다.
- 기존판은 파형 점수가 가장 낮은 첫 후보였지만, 약 94 BPM 검출 기준으로 반복 길이가 구문 끝과
  덜 맞아 연결이 어색하게 들릴 수 있었다.
- v2는 `7.50–47.83초` 후보를 사용한다. 1.5초 크로스페이드 뒤 런타임 `loopStart`는 9.00초다.
- 기존 `daily.ogg`와 `daily-loop.ogg`는 비교와 복구를 위해 보존하고, 런타임만
  `daily-v2.ogg`와 `daily-v2-loop.ogg`를 사용한다.

## 의존성·권한 문제 해결 기록

- PATH에 FFmpeg가 없으면 프로젝트 내부에 설치한다.

  ```powershell
  python -m pip install imageio-ffmpeg --target .tools/python
  ```

  `.tools/`는 Git에서 제외한다. 스크립트는 `.tools/python/imageio_ffmpeg/binaries/ffmpeg*.exe`를
  자동 탐색한다.
- Codex의 제한된 실행 환경에서는 다운로드한 FFmpeg 실행 파일이 `WinError 5`로 차단될 수 있다.
  이 경우 `python scripts/build_bgm_loops.py ...` 명령에 실행 승인을 받아 다시 실행한다.
- OGG를 잘라 재인코딩할 때 `Non-monotonic DTS` 경고가 발생하면 `asetpts=N/SR/TB`로 샘플 수를
  기준으로 타임스탬프를 다시 만든다. 현재 빌드 스크립트에 적용되어 있다.
- HTML `<audio loop>`로 인트로 포함 전체 파일을 반복하면 인트로가 매번 재생된다. 반드시
  `loopSource` 반복 전용 파일을 사용한다.
- 브라우저 자동 재생 정책 때문에 첫 사용자 입력 전에는 소리가 나지 않을 수 있다. 게임의 첫
  포인터·키 입력에서 `resume()`을 다시 호출한다.

## 검수 항목

1. 경계 앞뒤에서 클릭, 무음, 음량 튐, 박자 어긋남이 없는지 확인한다.
2. 같은 경계를 최소 10회 반복해 누적 지연이 없는지 확인한다.
3. HTTP 실행과 `day2.html` 직접 실행에서 각각 확인한다.
4. 일시정지 후 재개했을 때 같은 위치와 같은 음량으로 이어지는지 확인한다.
5. 빠르게 장면을 넘겨 곡이 바뀔 때 이전 곡이나 페이드가 남지 않는지 확인한다.
