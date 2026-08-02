(function () {
  "use strict";
  const $ = (id) => document.getElementById(id);
  const stage = $("stage");
  const ui = { intro:$("intro"), start:$("start"), card:$("dialogueCard"), speaker:$("speaker"), dialogue:$("dialogue"), next:$("next"), clock:$("clock"), location:$("location"), screen:$("screenPanel"), screenTitle:$("screenTitle"), screenContent:$("screenContent"), memory:$("memory"), memoryMain:$("memoryMain"), memorySub:$("memorySub"), choice:$("choice"), ending:$("ending"), restart:$("restart"), skipTyping:$("skipTyping") };
  let index = -1;
  let typingTimer = null;
  let fastText = false;
  let chosenResponse = "evidence";
  let transitionToken = 0;

  const assetPath = ArtAssets.resolve("background.presentation_room.day");
  const backgroundUrl = new URL(`../${assetPath}`, location.href).href;
  document.querySelectorAll(".background").forEach((node) => { node.style.backgroundImage = `url("${backgroundUrl}")`; });
  const backgroundImage = new Image();
  backgroundImage.addEventListener("load", layoutScreenPanel);
  backgroundImage.src = backgroundUrl;

  function layoutScreenPanel() {
    const sourceWidth = backgroundImage.naturalWidth || 1920;
    const sourceHeight = backgroundImage.naturalHeight || 1080;
    const scale = Math.max(innerWidth / sourceWidth, innerHeight / sourceHeight);
    const offsetX = (innerWidth - sourceWidth * scale) / 2;
    const offsetY = (innerHeight - sourceHeight * scale) / 2;
    const screenRect = { x: 621, y: 263, width: 703, height: 346 };
    ui.screen.style.left = `${offsetX + screenRect.x * scale}px`;
    ui.screen.style.top = `${offsetY + screenRect.y * scale}px`;
    ui.screen.style.width = `${screenRect.width * scale}px`;
    ui.screen.style.height = `${screenRect.height * scale}px`;
  }

  const slides = {
    opening: { title:"신규 사용자 경험 개선", rows:[["핵심 지표","7일 차 잔존율"],["대상","신규 가입 사용자"],["발표 상태","진행 중"],["검증","원본 연결 정상"]] },
    problem: { title:"USER JOURNEY · BEFORE", rows:[["관찰 구간","첫 플레이"],["이탈 원인","목표 인지 전 이탈"],["문제","다음 행동 불명확"],["개선 방향","초반 동선 명확화"]] },
    solution: { title:"ONBOARDING FLOW", rows:[["불필요한 안내","축소"],["핵심 행동","전면 배치"],["첫 성공 경험","앞당김"],["측정 기준","동일 조건 비교"]] },
    metric: { title:"VERIFIED RESULT", rows:[["7일 차 잔존율","18.4%"],["대상","신규 가입 사용자"],["기간","발표 기준 주차"],["상태","교차 검증 완료"]] },
    refresh: { title:"OFFICIAL EVIDENCE", rows:[["발표 PT","18.4%"],["공식 증빙","불러오는 중"],["출처","retention_7d_verified"],["상태","연결 갱신"]] },
    mismatch: { title:"VALUE MISMATCH", danger:true, rows:[["발표 PT","18.4%"],["공식 증빙","12.7%"],["대상·기간","동일"],["판정","확인 필요"]] },
    source: { title:"PRESERVED ORIGINAL", rows:[["발표 자료","18.4%"],["증빙 수치","18.4%"],["확인 시각","DAY 4 · 17:08"],["추가 수정","없음"]] },
    alias: { title:"SOURCE ALIAS HISTORY", rows:[["09:57","retention_7d_verified"],["09:58","retention_archive_2024"],["구버전 수치","12.7%"],["현재 상태","경로 복구 완료"]] },
    resumed: { title:"PRESENTATION RESUMED", rows:[["검증 수치","18.4%"],["변경 원인","출처 별칭 전환"],["조치","공식 연결 복구"],["발표 상태","재개"]] }
  };

  const scenes = [
    {time:"10:00",speaker:"한도윤",text:"정직원 전환 발표를 시작하겠습니다.",slide:"opening",camera:"camera-screen cinematic",delay:350},
    {time:"10:01",speaker:"한도윤",text:"먼저 확인한 문제는 신규 사용자가 첫 플레이의 목표를 이해하기 전에 이탈한다는 점이었습니다.",slide:"problem",camera:"camera-left",delay:220},
    {time:"10:03",speaker:"한도윤",text:"그래서 불필요한 안내를 줄이고, 사용자가 바로 선택하고 행동할 수 있도록 초반 동선을 다시 구성했습니다.",slide:"solution",camera:"camera-right",delay:220},
    {time:"10:07",speaker:"한도윤",text:"그 결과 신규 가입 사용자의 7일 차 잔존율은 <mark>18.4%</mark>로 확인됐습니다.",slide:"metric",camera:"camera-screen",delay:350},
    {time:"10:09",speaker:"한도윤",text:"DAY 2 교차 검증과 DAY 4 제출 직후 확인에서도 PT와 증빙 수치는 모두 18.4%였습니다.",slide:"metric",camera:"camera-screen",delay:220},
    {time:"10:12",speaker:"질문",text:"개선 방향과 검증 과정까지 확인했습니다. 공식 제출 증빙도 함께 보겠습니다.",slide:"refresh",camera:"camera-left",delay:450},
    {time:"10:16",speaker:"시스템",text:"공식 제출 증빙의 연결 출처를 다시 불러옵니다…",slide:"refresh",camera:"camera-screen cinematic",auto:1500},
    {time:"10:18",speaker:"질문",text:"잠시만요. 발표 자료에는 18.4%라고 되어 있는데, 공식 증빙에는 <mark>12.7%</mark>로 표시됩니다.",slide:"mismatch",camera:"camera-impact cinematic",impact:true,delay:650},
    {time:"10:18",speaker:"질문",text:"혹시 <mark>제출 전부터 12.7%였던 것</mark> 아닙니까?",slide:"mismatch",camera:"camera-impact cinematic",impact:true,delay:800},
    {time:"10:18",speaker:"한도윤",text:"……",slide:"mismatch",camera:"camera-impact cinematic",pause:true,delay:900},
    {time:"10:18",speaker:"한도윤",text:"수치는 다르다. 하지만 제출 직후 확인한 값은 분명히—",slide:"mismatch",camera:"camera-impact cinematic",memory:true,delay:300},
    {time:"10:19",speaker:"선택",text:"",slide:"mismatch",camera:"camera-impact cinematic",choice:true},
    {time:"10:19",speaker:"한도윤",dynamic:true,slide:"source",camera:"camera-screen cinematic",impact:true,delay:650},
    {time:"10:21",speaker:"한도윤",text:"DAY 4 17시 8분, 제출 직후 보존한 원본입니다. PT와 증빙 모두 18.4%였고 추가 수정도 없었습니다.",slide:"source",camera:"camera-screen",delay:380},
    {time:"10:21",speaker:"한도윤",text:"따라서 처음부터 수치가 달랐던 것이 아닙니다.",slide:"source",camera:"camera-left cinematic",delay:600},
    {time:"10:21",speaker:"한도윤",text:"수치가 달라진 건 제출 전이 아니라, <mark>제출 이후입니다.</mark>",slide:"source",camera:"camera-impact cinematic",impact:true,delay:850},
    {time:"10:22",speaker:"질문",text:"그렇다면 누가, 언제 수치를 변경했다는 겁니까?",slide:"mismatch",camera:"camera-right cinematic",delay:600},
    {time:"10:24",speaker:"한도윤",text:"특정 사람을 먼저 지목하지 않겠습니다. 제출 기록과 현재 연결 경로 사이에서 달라진 시점부터 확인하겠습니다.",slide:"source",camera:"camera-left",delay:350},
    {time:"10:27",speaker:"시스템",text:"출처 별칭 변경 기록을 확인했습니다.",slide:"alias",camera:"camera-screen cinematic",memoryAlias:true,delay:380},
    {time:"10:28",speaker:"한도윤",text:"09시 58분, 공식 출처 별칭이 구버전 보관 데이터로 연결됐습니다. 현재 표시된 12.7%는 그 구버전의 수치입니다.",slide:"alias",camera:"camera-screen",delay:350},
    {time:"10:29",speaker:"질문",text:"제출 당시의 수치와 이후 변경 경로를 확인했습니다. 수정된 공식 연결을 기준으로 발표를 계속해 주세요.",slide:"resumed",camera:"camera-screen cinematic",impact:true,delay:550},
    {time:"10:29",speaker:"한도윤",text:"네. 확인된 18.4%와 검증 범위를 기준으로 계속 설명드리겠습니다.",slide:"resumed",camera:"camera-screen",final:true,delay:400}
  ];

  function renderSlide(key) {
    const slide = slides[key]; if (!slide) return;
    ui.screenTitle.textContent = slide.title;
    ui.screenContent.innerHTML = slide.rows.map(([label,value],i) => `<article class="${slide.danger && (i===0||i===1)?"danger":""}"><small>${label}</small><strong>${value}</strong><span>${i===3&&slide.danger?"발표 일시 정지":"SOURCE VERIFIED"}</span></article>`).join("");
  }
  function clearStateClasses() { [...stage.classList].filter((name)=>name.startsWith("camera-")||name==="cinematic"||name==="shake"||name==="flash"||name==="hide-screen").forEach((name)=>stage.classList.remove(name)); }
  function typeText(html, done) {
    clearInterval(typingTimer); ui.dialogue.innerHTML="";
    const temp=document.createElement("div"); temp.innerHTML=html; const plain=temp.textContent; let n=0;
    ui.next.disabled=true;
    const finish=()=>{clearInterval(typingTimer);ui.dialogue.innerHTML=html;ui.next.disabled=false;done?.();};
    if(fastText){finish();return;}
    typingTimer=setInterval(()=>{n+=1;ui.dialogue.textContent=plain.slice(0,n);if(n>=plain.length)finish();},26);
  }
  function playMemory(alias=false) {
    const token=++transitionToken; ui.memory.hidden=false; ui.card.hidden=true;
    const cuts=alias?[["09:57","정상 출처 연결"],["09:58","출처 별칭 변경"],["12.7%","구버전 보관 수치"]]:[["DAY 4 · 17:08","제출 직후 확인"],["PT · 18.4%","발표 자료 정상"],["증빙 · 18.4%","원본 연결 정상"],["추가 수정 · 없음","보존 상태 유지"]];
    let cut=0; const show=()=>{if(token!==transitionToken)return;ui.memoryMain.textContent=cuts[cut][0];ui.memorySub.textContent=cuts[cut][1];stage.classList.add("flash");setTimeout(()=>stage.classList.remove("flash"),300);cut+=1;if(cut<cuts.length)setTimeout(show,560);else setTimeout(()=>{ui.memory.hidden=true;ui.card.hidden=false;ui.next.disabled=false;},720);}; show();
  }
  function showScene(scene) {
    clearStateClasses(); renderSlide(scene.slide); ui.clock.textContent=scene.time; ui.speaker.textContent=scene.speaker; ui.card.hidden=false; ui.choice.hidden=true;
    scene.camera.split(" ").filter(Boolean).forEach((name)=>stage.classList.add(name));
    if(scene.impact){stage.classList.add("shake","flash");setTimeout(()=>stage.classList.remove("shake","flash"),650);}
    if(scene.choice){ui.card.hidden=true;ui.choice.hidden=false;return;}
    const text=scene.dynamic?(chosenResponse==="evidence"?"먼저 확인한 사실부터 설명하겠습니다.":"원인을 단정하기 전에, 확인한 기록으로 변경 시점부터 설명하겠습니다."):scene.text;
    typeText(text,()=>{if(scene.memory)playMemory(false);if(scene.memoryAlias)playMemory(true);if(scene.auto){ui.next.disabled=true;setTimeout(()=>{ui.next.disabled=false;nextScene();},scene.auto);}});
    if(scene.pause)ui.next.disabled=true, setTimeout(()=>{ui.next.disabled=false;},1200);
    if(scene.final)ui.next.textContent="발표 마치기　›";else ui.next.textContent="다음　›";
  }
  function nextScene(){if(ui.next.disabled)return;index+=1;if(index>=scenes.length){showEnding();return;}showScene(scenes[index]);}
  function showEnding(){clearInterval(typingTimer);clearStateClasses();ui.card.hidden=true;ui.screen.hidden=true;ui.ending.hidden=false;stage.classList.add("cinematic");}
  function start(){index=-1;ui.intro.hidden=true;ui.ending.hidden=true;ui.screen.hidden=false;ui.card.hidden=false;nextScene();}
  function reset(){transitionToken+=1;index=-1;chosenResponse="evidence";ui.ending.hidden=true;ui.choice.hidden=true;ui.memory.hidden=true;ui.card.hidden=true;ui.screen.hidden=false;ui.intro.hidden=false;clearStateClasses();renderSlide("opening");}

  ui.start.addEventListener("click",start);ui.next.addEventListener("click",nextScene);ui.restart.addEventListener("click",reset);ui.skipTyping.addEventListener("click",()=>{fastText=!fastText;ui.skipTyping.textContent=fastText?"느린 출력":"빠른 출력";});
  ui.choice.querySelectorAll("button").forEach((button)=>button.addEventListener("click",()=>{chosenResponse=button.dataset.choice;ui.choice.hidden=true;ui.card.hidden=false;nextScene();}));
  window.addEventListener("keydown",(event)=>{if(event.key==="Enter"&&!ui.card.hidden&&!ui.next.disabled)nextScene();if(event.key==="Escape"&&ui.intro.hidden)reset();});
  window.addEventListener("pointermove",(event)=>{stage.style.setProperty("--px",`${(event.clientX/innerWidth-.5)*9}px`);stage.style.setProperty("--py",`${(event.clientY/innerHeight-.5)*6}px`);});
  window.addEventListener("resize",layoutScreenPanel);
  renderSlide("opening");
}());
